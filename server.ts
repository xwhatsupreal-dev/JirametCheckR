import express from "express";
import { createServer as createViteServer } from "vite";
import axios from "axios";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Roblox API Proxy Routes
  
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

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
