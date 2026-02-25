import express from "express";
import { createServer as createViteServer } from "vite";
import axios from "axios";
import { WebSocketServer, WebSocket } from "ws";
import { createServer } from "http";

async function startServer() {
  const app = express();
  const server = createServer(app);
  const wss = new WebSocketServer({ server });
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json());

  // Shared state: list of tracked users and activity history
  let trackedUsers: any[] = [];
  let activityHistory: any[] = [];

  // API to add/remove users for global sync
  app.post("/api/users/sync/add", (req, res) => {
    const { user } = req.body;
    if (!user) return res.status(400).json({ error: "User is required" });
    
    // Check if already exists
    if (!trackedUsers.find(u => u.id === user.id)) {
      trackedUsers.push(user);
      broadcast({ type: "USER_ADDED", user });
      
      // Log activity
      const log = {
        id: Date.now() + Math.random(),
        type: 'SYSTEM',
        message: `Added ${user.displayName} to monitor`,
        timestamp: new Date().toISOString()
      };
      activityHistory.unshift(log);
      if (activityHistory.length > 50) activityHistory.pop();
      broadcast({ type: "HISTORY_UPDATED", history: activityHistory });
    }
    res.json({ success: true });
  });

  app.post("/api/users/sync/remove", (req, res) => {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: "UserId is required" });
    
    const user = trackedUsers.find(u => u.id === userId);
    trackedUsers = trackedUsers.filter(u => u.id !== userId);
    broadcast({ type: "USER_REMOVED", userId });

    if (user) {
      const log = {
        id: Date.now() + Math.random(),
        type: 'SYSTEM',
        message: `Removed ${user.displayName} from monitor`,
        timestamp: new Date().toISOString()
      };
      activityHistory.unshift(log);
      if (activityHistory.length > 50) activityHistory.pop();
      broadcast({ type: "HISTORY_UPDATED", history: activityHistory });
    }
    res.json({ success: true });
  });

  app.post("/api/users/sync/log", (req, res) => {
    const { log } = req.body;
    if (!log) return res.status(400).json({ error: "Log is required" });
    
    const newLog = { ...log, id: Date.now() + Math.random() };
    activityHistory.unshift(newLog);
    if (activityHistory.length > 50) activityHistory.pop();
    broadcast({ type: "HISTORY_UPDATED", history: activityHistory });
    res.json({ success: true });
  });

  app.post("/api/users/sync/update", (req, res) => {
    const { user } = req.body;
    if (!user) return res.status(400).json({ error: "User is required" });
    
    trackedUsers = trackedUsers.map(u => u.id === user.id ? user : u);
    broadcast({ type: "USER_UPDATED", user });
    res.json({ success: true });
  });

  // WebSocket logic
  wss.on("connection", (ws) => {
    console.log("[WS] New client connected");
    
    // Send initial state
    ws.send(JSON.stringify({ type: "SYNC_DATA", users: trackedUsers, history: activityHistory }));

    ws.on("close", () => console.log("[WS] Client disconnected"));
  });

  const broadcast = (data: any) => {
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(data));
      }
    });
  };

  // Roblox API Proxy Routes

  // Get game details
  app.get("/api/roblox/games/details", async (req, res) => {
    const { placeIds } = req.query;
    if (!placeIds) return res.status(400).json({ error: "placeIds are required" });

    try {
      const response = await axios.get(`https://games.roblox.com/v1/games/multiget-place-details?placeIds=${placeIds}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      });
      res.json(response.data);
    } catch (error: any) {
      console.error("Roblox Game Details Error:", error.response?.data || error.message);
      res.status(error.response?.status || 500).json({ 
        error: error.response?.data?.errors?.[0]?.message || error.message 
      });
    }
  });
  
  // Search user by username (using exact match endpoint for better reliability)
  app.get("/api/roblox/users/search", async (req, res) => {
    const { username } = req.query;
    if (!username) return res.status(400).json({ error: "Username is required" });
    
    const name = (username as string).trim();
    console.log(`[Proxy] Looking up user: ${name}`);
    
    try {
      // Use the exact username lookup endpoint which is more robust for "adding" users
      const response = await axios.post("https://users.roblox.com/v1/usernames/users", {
        usernames: [name],
        excludeBannedUsers: false
      }, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        },
        timeout: 5000
      });

      // If no exact match, fallback to the search endpoint
      if (!response.data.data || response.data.data.length === 0) {
        console.log(`[Proxy] No exact match for ${name}, falling back to search...`);
        const searchResponse = await axios.get(`https://users.roblox.com/v1/users/search?keyword=${encodeURIComponent(name)}&limit=1`, {
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
          },
          timeout: 5000
        });
        return res.json(searchResponse.data);
      }

      console.log(`[Proxy] Lookup success for: ${name}`);
      res.json(response.data);
    } catch (error: any) {
      const status = error.response?.status || 500;
      const data = error.response?.data;
      console.error(`[Proxy] Lookup failed for ${name}:`, status, data || error.message);
      
      res.status(status).json({ 
        error: data?.errors?.[0]?.message || error.message,
        details: data
      });
    }
  });

  // Get presence for multiple users
  app.post("/api/roblox/presence", async (req, res) => {
    const { userIds } = req.body;
    if (!userIds || !Array.isArray(userIds)) return res.status(400).json({ error: "userIds array is required" });

    try {
      const response = await axios.post("https://presence.roblox.com/v1/presence/users", { userIds }, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      });
      res.json(response.data);
    } catch (error: any) {
      console.error("Roblox Presence Error:", error.response?.data || error.message);
      res.status(error.response?.status || 500).json({ 
        error: error.response?.data?.errors?.[0]?.message || error.message 
      });
    }
  });

  // Get thumbnails for multiple users
  app.get("/api/roblox/thumbnails", async (req, res) => {
    const { userIds } = req.query;
    if (!userIds) return res.status(400).json({ error: "userIds are required" });

    try {
      const response = await axios.get(`https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${userIds}&size=150x150&format=Png&isCircular=false`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      });
      res.json(response.data);
    } catch (error: any) {
      console.error("Roblox Thumbnail Error:", error.response?.data || error.message);
      res.status(error.response?.status || 500).json({ 
        error: error.response?.data?.errors?.[0]?.message || error.message 
      });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static("dist"));
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
