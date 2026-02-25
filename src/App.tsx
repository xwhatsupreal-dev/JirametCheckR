/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Search, 
  RefreshCw, 
  Trash2, 
  Plus, 
  Users, 
  Activity, 
  Circle, 
  Gamepad2, 
  ExternalLink,
  ShieldCheck,
  LayoutDashboard,
  Languages,
  Clock,
  Link as LinkIcon,
  Edit2,
  Check,
  X,
  RotateCcw,
  History,
  ChevronRight
} from 'lucide-react';
import { 
  motion, 
  AnimatePresence, 
  useMotionValue, 
  useTransform, 
  useSpring 
} from 'motion/react';
import axios from 'axios';
import { UserStatus, RobloxUser, RobloxPresence, RobloxThumbnail, RobloxPlaceDetails, RobloxUniverseDetails } from './types';

const STORAGE_KEY = 'jiramet_check_users';
const LANG_KEY = 'jiramet_check_lang';

type Language = 'en' | 'th';

const translations = {
  en: {
    title: 'Jiramet',
    subtitle: 'Advanced Roblox Presence Monitor',
    addPlaceholder: 'Add Username...',
    filterPlaceholder: 'Filter dashboard users...',
    totalAccounts: 'Total Accounts',
    onlineNow: 'Online Now',
    offline: 'Offline',
    status: 'Status',
    online: 'Online',
    inGame: 'In-Game',
    inStudio: 'In-Studio',
    offlineText: 'Offline',
    lastUpdated: 'Last updated',
    offlineSince: 'Offline since',
    profile: 'Profile',
    noAccounts: 'No Accounts Tracked',
    noAccountsDesc: 'Search for a Roblox username above to start monitoring their real-time presence.',
    currentlyPlaying: 'Currently Playing',
    unknownExperience: 'Unknown Experience',
    systemOperational: 'System Operational',
    showing: 'Showing',
    of: 'of',
    userNotFound: 'User not found on Roblox',
    userAlreadyAdded: 'User already in dashboard',
    searchError: 'Search Error',
    fetchError: 'User added, but failed to fetch live status. Try refreshing.',
    justNow: 'Just now',
    minutesAgo: 'm ago',
    hoursAgo: 'h ago',
    daysAgo: 'd ago',
    mapName: 'Map Name',
    gameId: 'Game ID',
    lastSeen: 'Last Seen',
    at: 'at',
    customGame: 'Custom Game Link/ID',
    setCustom: 'Set Custom',
    reset: 'Reset',
    enterGameRef: 'Enter Game URL or Place ID',
    save: 'Save',
    cancel: 'Cancel',
    updateLog: 'Update Log',
    updates: [
      {
        title: 'v1.5.0 - Visual Overhaul',
        items: [
          'Added 3D Tilt effect to user cards',
          'Enhanced glassmorphism with better blur and saturation',
          'Added interactive shine effect on hover'
        ]
      },
      {
        title: 'v1.4.0 - Rich Game Cards',
        items: [
          'Added automatic game icon fetching',
          'Added creator information to game details',
          'Improved game card layout with thumbnails'
        ]
      },
      {
        title: 'v1.3.0 - Reliability Fixes',
        items: [
          'Fixed Roblox API 401/404 errors',
          'Implemented multi-step fallback for game details',
          'Added Universe ID support for better name fetching'
        ]
      },
      {
        title: 'v1.2.0 - Customization',
        items: [
          'Added Custom Game Link/ID support',
          'Added automatic name fetching for custom games',
          'Added quick reset for custom game settings'
        ]
      },
      {
        title: 'v1.1.0 - Smart Features',
        items: [
          'Added smart sorting (In-Game users first)',
          'Added detailed "Last Seen" information',
          'Added Universe ID and Root Place ID details'
        ]
      }
    ]
  },
  th: {
    title: 'Jiramet',
    subtitle: 'ระบบตรวจสอบสถานะ Roblox ขั้นสูง',
    addPlaceholder: 'เพิ่มชื่อผู้ใช้...',
    filterPlaceholder: 'กรองรายชื่อผู้ใช้...',
    totalAccounts: 'บัญชีทั้งหมด',
    onlineNow: 'ออนไลน์ขณะนี้',
    offline: 'ออฟไลน์',
    status: 'สถานะ',
    online: 'ออนไลน์',
    inGame: 'ในเกม',
    inStudio: 'ในสตูดิโอ',
    offlineText: 'ออฟไลน์',
    lastUpdated: 'อัปเดตล่าสุด',
    offlineSince: 'ออฟไลน์เมื่อ',
    profile: 'โปรไฟล์',
    noAccounts: 'ยังไม่มีการติดตามบัญชี',
    noAccountsDesc: 'ค้นหาชื่อผู้ใช้ Roblox ด้านบนเพื่อเริ่มติดตามสถานะแบบเรียลไทม์',
    currentlyPlaying: 'กำลังเล่น',
    unknownExperience: 'ไม่ทราบชื่อแมพ',
    systemOperational: 'ระบบทำงานปกติ',
    showing: 'กำลังแสดง',
    of: 'จาก',
    userNotFound: 'ไม่พบผู้ใช้ใน Roblox',
    userAlreadyAdded: 'ผู้ใช้นี้อยู่ในแดชบอร์ดแล้ว',
    searchError: 'เกิดข้อผิดพลาดในการค้นหา',
    fetchError: 'เพิ่มผู้ใช้แล้ว แต่ไม่สามารถดึงสถานะล่าสุดได้ กรุณาลองรีเฟรช',
    justNow: 'เมื่อกี้',
    minutesAgo: 'นาทีที่แล้ว',
    hoursAgo: 'ชั่วโมงที่แล้ว',
    daysAgo: 'วันที่แล้ว',
    mapName: 'ชื่อแมพ',
    gameId: 'ไอดีเกม',
    lastSeen: 'เห็นล่าสุดเมื่อ',
    at: 'เวลา',
    customGame: 'ลิงก์เกม/ไอดีแบบกำหนดเอง',
    setCustom: 'ตั้งค่ากำหนดเอง',
    reset: 'รีเซ็ต',
    enterGameRef: 'ใส่ลิงก์เกมหรือไอดีแมพ',
    save: 'บันทึก',
    cancel: 'ยกเลิก',
    updateLog: 'บันทึกการอัปเดต',
    updates: [
      {
        title: 'v1.5.0 - Visual Overhaul',
        items: [
          'เพิ่มเอฟเฟกต์เอียง 3 มิติ (3D Tilt) ให้กับบัตรผู้เล่น',
          'ปรับปรุงความใสของกระจก (Glassmorphism) ให้สวยขึ้น',
          'เพิ่มเอฟเฟกต์แสงสะท้อนเวลาเอาเมาส์ไปชี้'
        ]
      },
      {
        title: 'v1.4.0 - Rich Game Cards',
        items: [
          'เพิ่มการดึงรูปไอคอนเกมอัตโนมัติ',
          'เพิ่มข้อมูลผู้สร้างเกมในรายละเอียด',
          'ปรับปรุงหน้าตาการ์ดเกมให้มีรูปประกอบ'
        ]
      },
      {
        title: 'v1.3.0 - Reliability Fixes',
        items: [
          'แก้ไขปัญหา Roblox API 401/404',
          'เพิ่มระบบดึงข้อมูลสำรอง (Fallback) เมื่อ API มีปัญหา',
          'รองรับ Universe ID เพื่อการดึงชื่อเกมที่แม่นยำขึ้น'
        ]
      },
      {
        title: 'v1.2.0 - Customization',
        items: [
          'เพิ่มช่องใส่ลิงก์/ไอดีเกมกำหนดเอง',
          'ดึงชื่อเกมจากลิงก์ที่ใส่ให้อัตโนมัติ',
          'เพิ่มปุ่มรีเซ็ตการตั้งค่าเกมกำหนดเอง'
        ]
      },
      {
        title: 'v1.1.0 - Smart Features',
        items: [
          'เพิ่มการจัดเรียงลำดับ (คนที่เล่นเกมอยู่จะขึ้นก่อน)',
          'เพิ่มข้อมูล "เห็นล่าสุด" ที่ละเอียดขึ้น',
          'แสดงข้อมูล Universe ID และ Root Place ID'
        ]
      }
    ]
  }
};

const formatRelativeTime = (dateStr: string | undefined, lang: Language) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return translations[lang].justNow;
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}${lang === 'en' ? translations[lang].minutesAgo : ' ' + translations[lang].minutesAgo}`;
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}${lang === 'en' ? translations[lang].hoursAgo : ' ' + translations[lang].hoursAgo}`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  return `${diffInDays}${lang === 'en' ? translations[lang].daysAgo : ' ' + translations[lang].daysAgo}`;
};

const GameIcon = ({ src, className, fallbackIcon: Fallback = Gamepad2 }: { src?: string, className?: string, fallbackIcon?: any }) => {
  const [error, setError] = useState(false);
  
  if (!src || error) {
    return (
      <div className={`${className} bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-700`}>
        <Fallback className="w-1/2 h-1/2" />
      </div>
    );
  }

  return (
    <img 
      src={src} 
      alt="Game Icon"
      onError={() => setError(true)}
      className={`${className} object-cover bg-zinc-900 border border-zinc-800`}
    />
  );
};

const TiltCard = ({ children, className, glowClass }: { children: React.ReactNode, className?: string, glowClass?: string, key?: any }) => {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x);
  const mouseYSpring = useSpring(y);

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["10deg", "-10deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-10deg", "10deg"]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;

    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateY,
        rotateX,
        transformStyle: "preserve-3d",
      }}
      className={`relative ${className} ${glowClass}`}
    >
      <div
        style={{
          transform: "translateZ(50px)",
          transformStyle: "preserve-3d",
        }}
      >
        {children}
      </div>
      {/* Shine effect */}
      <motion.div
        style={{
          background: "radial-gradient(circle at center, rgba(255,255,255,0.1) 0%, transparent 80%)",
          left: useTransform(mouseXSpring, [-0.5, 0.5], ["-20%", "20%"]),
          top: useTransform(mouseYSpring, [-0.5, 0.5], ["-20%", "20%"]),
        }}
        className="absolute inset-0 pointer-events-none z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
      />
    </motion.div>
  );
};

const UserCardSkeleton = () => (
  <div className="w-full h-full space-y-4">
    <div className="flex items-start justify-between mb-4">
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-xl bg-zinc-800 border border-zinc-700/50 animate-pulse" />
        <div className="space-y-2">
          <div className="h-4 w-24 bg-zinc-800 rounded animate-pulse" />
          <div className="h-3 w-16 bg-zinc-800/50 rounded animate-pulse" />
        </div>
      </div>
    </div>
    <div className="space-y-3">
      <div className="h-10 w-full bg-zinc-800/30 rounded-xl border border-zinc-800/50 animate-pulse" />
      <div className="h-8 w-full bg-zinc-800/40 rounded-xl animate-pulse" />
    </div>
  </div>
);

export default function App() {
  const [username, setUsername] = useState('');
  const [filterQuery, setFilterQuery] = useState('');
  const [users, setUsers] = useState<UserStatus[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchingUser, setSearchingUser] = useState<boolean>(false);
  const [lang, setLang] = useState<Language>('en');
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [showUpdateLog, setShowUpdateLog] = useState(false);
  const [editingCustomGame, setEditingCustomGame] = useState<number | null>(null);
  const [customGameInput, setCustomGameInput] = useState('');
  const [, setTick] = useState(0);

  const t = translations[lang];

  // Tick every minute to update relative times
  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 60000);
    return () => clearInterval(interval);
  }, []);

  // WebSocket Sync
  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}`;
    const socket = new WebSocket(wsUrl);

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      switch (data.type) {
        case 'SYNC_USERS':
          setUsers(data.users);
          if (isInitialLoading) {
            refreshAllStatus(data.users).finally(() => {
              setTimeout(() => setIsInitialLoading(false), 1500);
            });
          }
          break;
        case 'USER_ADDED':
          setUsers(prev => {
            if (prev.find(u => u.id === data.user.id)) return prev;
            return [...prev, data.user];
          });
          break;
        case 'USER_REMOVED':
          setUsers(prev => prev.filter(u => u.id !== data.userId));
          break;
        case 'USER_UPDATED':
          setUsers(prev => prev.map(u => u.id === data.user.id ? data.user : u));
          break;
      }
    };

    return () => socket.close();
  }, [isInitialLoading]);

  // Load saved language from localStorage
  useEffect(() => {
    const savedLang = localStorage.getItem(LANG_KEY) as Language;
    if (savedLang) setLang(savedLang);
  }, []);

  // Save language to localStorage
  useEffect(() => {
    localStorage.setItem(LANG_KEY, lang);
  }, [lang]);

  const fetchPresenceAndThumbnails = async (userIds: number[]) => {
    if (userIds.length === 0) return { presences: [], thumbnails: [] };
    
    try {
      const [presenceRes, thumbRes] = await Promise.all([
        axios.post('/api/roblox/presence', { userIds }),
        axios.get(`/api/roblox/thumbnails?userIds=${userIds.join(',')}`)
      ]);
      
      return {
        presences: presenceRes.data.userPresences as RobloxPresence[],
        thumbnails: thumbRes.data.data as RobloxThumbnail[]
      };
    } catch (err) {
      console.error("Error fetching presence/thumbnails", err);
      return { presences: [], thumbnails: [] };
    }
  };

  const refreshAllStatus = async (currentUsers: UserStatus[]) => {
    if (currentUsers.length === 0) return;
    setRefreshing(true);
    
    const userIds = currentUsers.map(u => u.id);
    const { presences, thumbnails } = await fetchPresenceAndThumbnails(userIds);
    
    // Fetch place details for users in game or studio + custom game refs
    const activePlaceIds = presences
      .filter(p => (p.userPresenceType === 2 || p.userPresenceType === 3) && p.placeId)
      .map(p => p.placeId as number);
    
    const customPlaceIds = currentUsers
      .filter(u => u.customGameRef && !isNaN(Number(u.customGameRef)))
      .map(u => Number(u.customGameRef));
    
    const placeIds = [...activePlaceIds, ...customPlaceIds];
    
    // Fetch universe details (Experience name) - Often more stable
    const universeIds = presences
      .filter(p => (p.userPresenceType === 2 || p.userPresenceType === 3) && p.universeId)
      .map(p => p.universeId as number);
    
    let placeDetailsMap: Record<number, RobloxPlaceDetails> = {};
    let universeDetailsMap: Record<number, RobloxUniverseDetails> = {};
    let universeIconsMap: Record<number, string> = {};

    try {
      const requests = [];
      
      if (placeIds.length > 0) {
        const uniquePlaceIds = [...new Set(placeIds)];
        requests.push(
          axios.get(`/api/roblox/places/details?placeIds=${uniquePlaceIds.join(',')}`)
            .then(res => {
              if (Array.isArray(res.data)) {
                res.data.forEach((detail: any) => {
                  placeDetailsMap[detail.placeId] = detail;
                });
              }
            })
            .catch(e => console.error("Place details fetch failed", e))
        );
      }

      if (universeIds.length > 0) {
        const uniqueUniverseIds = [...new Set(universeIds)];
        requests.push(
          axios.get(`/api/roblox/universes/details?universeIds=${uniqueUniverseIds.join(',')}`)
            .then(res => {
              if (res.data && Array.isArray(res.data.data)) {
                res.data.data.forEach((detail: any) => {
                  universeDetailsMap[detail.id] = detail;
                });
              }
            })
            .catch(e => console.error("Universe details fetch failed", e))
        );

        requests.push(
          axios.get(`/api/roblox/games/icons?universeIds=${uniqueUniverseIds.join(',')}`)
            .then(res => {
              if (res.data && Array.isArray(res.data.data)) {
                res.data.data.forEach((icon: any) => {
                  universeIconsMap[icon.targetId] = icon.imageUrl;
                });
              }
            })
            .catch(e => console.error("Universe icons fetch failed", e))
        );
      }

      if (requests.length > 0) await Promise.all(requests);
    } catch (err) {
      console.error("Error fetching game details", err);
    }

    const now = new Date().toISOString();
    
    setUsers(prev => prev.map(user => {
      const presence = presences.find(p => p.userId === user.id);
      const thumb = thumbnails.find(t => t.targetId === user.id);
      const placeDetails = presence?.placeId ? placeDetailsMap[presence.placeId] : undefined;
      const universeDetails = presence?.universeId ? universeDetailsMap[presence.universeId] : undefined;
      const universeIcon = presence?.universeId ? universeIconsMap[presence.universeId] : undefined;
      const customPlaceDetails = user.customGameRef && !isNaN(Number(user.customGameRef)) 
        ? placeDetailsMap[Number(user.customGameRef)] 
        : undefined;

      const updatedUser = {
        ...user,
        presence,
        thumbnail: thumb?.imageUrl,
        placeDetails,
        universeDetails,
        universeIcon,
        customPlaceDetails,
        lastUpdated: now
      };
      
      // Sync update to server
      axios.post('/api/users/sync/update', { user: updatedUser });
      
      return updatedUser;
    }));
    
    setRefreshing(false);
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;
    
    setLoading(true);
    setSearchingUser(true);
    setError(null);
    
    const name = username.trim();
    
    try {
      const res = await axios.get(`/api/roblox/users/search?username=${name}`);
      const foundUsers = res.data.data as RobloxUser[];
      
      if (foundUsers.length > 0) {
        const userToAdd = foundUsers[0];
        
        // Check if already exists in current state
        if (users.some(u => u.id === userToAdd.id)) {
          setError(t.userAlreadyAdded);
          return;
        }

        const now = new Date().toISOString();
        try {
          const { presences, thumbnails } = await fetchPresenceAndThumbnails([userToAdd.id]);
          const presence = presences[0];
          
          let placeDetails = undefined;
          let universeDetails = undefined;

          if ((presence?.userPresenceType === 2 || presence?.userPresenceType === 3)) {
            const requests = [];
            
            if (presence.placeId) {
              requests.push(
                axios.get(`/api/roblox/places/details?placeIds=${presence.placeId}`)
                  .then(res => {
                    if (Array.isArray(res.data) && res.data.length > 0) {
                      placeDetails = res.data[0];
                    }
                  })
                  .catch(e => console.error("Place details fetch failed", e))
              );
            }

            if (presence.universeId) {
              requests.push(
                axios.get(`/api/roblox/universes/details?universeIds=${presence.universeId}`)
                  .then(res => {
                    if (res.data && Array.isArray(res.data.data) && res.data.data.length > 0) {
                      universeDetails = res.data.data[0];
                    }
                  })
                  .catch(e => console.error("Universe details fetch failed", e))
              );
            }

            if (requests.length > 0) await Promise.all(requests);
          }

          const newUser: UserStatus = {
            ...userToAdd,
            presence,
            thumbnail: thumbnails[0]?.imageUrl,
            placeDetails,
            universeDetails,
            lastUpdated: now
          };
          
          // Sync to server
          await axios.post('/api/users/sync/add', { user: newUser });
          
          setUsername('');
        } catch (fetchErr: any) {
          console.error("Presence/Thumbnail fetch failed", fetchErr);
          // Add user anyway but without presence/thumbnail if it fails
          const newUser: UserStatus = { ...userToAdd, lastUpdated: now };
          
          // Sync to server
          await axios.post('/api/users/sync/add', { user: newUser });
          
          setUsername('');
          setError(t.fetchError);
        }
      } else {
        setError(t.userNotFound);
      }
    } catch (err: any) {
      console.error("Search failed", err);
      const apiError = err.response?.data?.error || err.message || "Failed to connect to Roblox API";
      setError(`${t.searchError}: ${typeof apiError === 'object' ? JSON.stringify(apiError) : apiError}`);
    } finally {
      setLoading(false);
      setSearchingUser(false);
    }
  };

  const removeUser = async (id: number) => {
    try {
      await axios.post('/api/users/sync/remove', { userId: id });
      setDeleteConfirmId(null);
    } catch (err) {
      console.error("Failed to remove user", err);
    }
  };

  const saveCustomGame = async (userId: number) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;

    let finalRef = customGameInput.trim();
    // Support link or ID
    const match = finalRef.match(/roblox\.com\/games\/(\d+)/);
    if (match) {
      finalRef = match[1];
    }

    let customPlaceDetails = undefined;
    if (finalRef && !isNaN(Number(finalRef))) {
      try {
        const res = await axios.get(`/api/roblox/places/details?placeIds=${finalRef}`);
        if (Array.isArray(res.data) && res.data.length > 0) {
          customPlaceDetails = res.data[0];
        }
      } catch (e) {
        console.error("Failed to fetch custom place details", e);
      }
    }

    const updatedUser = { ...user, customGameRef: finalRef, customPlaceDetails };
    try {
      await axios.post('/api/users/sync/update', { user: updatedUser });
      setEditingCustomGame(null);
      setCustomGameInput('');
    } catch (err) {
      console.error("Failed to update custom game ref", err);
    }
  };

  const resetCustomGame = async (userId: number) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;

    const updatedUser = { ...user, customGameRef: undefined, customPlaceDetails: undefined };
    try {
      await axios.post('/api/users/sync/update', { user: updatedUser });
    } catch (err) {
      console.error("Failed to reset custom game ref", err);
    }
  };

  const getStatusColor = (type?: number) => {
    switch (type) {
      case 1: return 'text-green-500'; // Online
      case 2: return 'text-blue-500';  // InGame
      case 3: return 'text-orange-500'; // InStudio
      default: return 'text-zinc-500'; // Offline
    }
  };

  const getStatusGlow = (type?: number) => {
    switch (type) {
      case 1: return 'glow-green';
      case 2: return 'glow-blue';
      case 3: return 'shadow-[0_0_20px_rgba(249,115,22,0.2)]';
      default: return '';
    }
  };

  const getStatusText = (type?: number) => {
    switch (type) {
      case 1: return t.online;
      case 2: return t.inGame;
      case 3: return t.inStudio;
      default: return t.offlineText;
    }
  };

  const stats = {
    total: users.length,
    online: users.filter(u => u.presence?.userPresenceType && u.presence.userPresenceType > 0).length,
    offline: users.filter(u => !u.presence?.userPresenceType || u.presence.userPresenceType === 0).length
  };

  const filteredUsers = [...users]
    .filter(u => 
      u.name.toLowerCase().includes(filterQuery.toLowerCase()) || 
      u.displayName.toLowerCase().includes(filterQuery.toLowerCase())
    )
    .sort((a, b) => {
      const getPriority = (type?: number) => {
        switch (type) {
          case 2: return 3; // InGame
          case 3: return 2; // InStudio
          case 1: return 1; // Online
          default: return 0; // Offline
        }
      };
      return getPriority(b.presence?.userPresenceType) - getPriority(a.presence?.userPresenceType);
    });

  return (
    <div className="min-h-screen bg-[#050505] font-sans selection:bg-red-500/30">
      <AnimatePresence>
        {isInitialLoading && (
          <motion.div
            key="initial-loader"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
            className="fixed inset-0 z-[100] bg-[#050505] flex flex-col items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="relative w-full h-full flex items-center justify-center p-12"
            >
              <img 
                src="https://cdn.discordapp.com/attachments/1408452728388325511/1475859003270762609/BackgroundEraser_20260224_211304647.png?ex=699f044e&is=699db2ce&hm=a1ce927d6348022cf51198dbae609dcb034f5e6d56b111543515894a892016e2&" 
                alt="Loading..."
                className="w-full max-w-lg h-auto object-contain opacity-100"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-[#050505] pointer-events-none" />
            </motion.div>
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="mt-8 text-center"
            >
              <h2 className="text-2xl font-bold tracking-tighter uppercase text-white mb-2">
                Jiramet<span className="text-red-600">Check</span>
              </h2>
              <p className="text-[10px] font-mono text-zinc-600 uppercase tracking-[0.2em] mb-4">
                Created by _.texraxit
              </p>
              <div className="flex items-center justify-center gap-2 text-zinc-500 text-xs font-mono uppercase tracking-[0.3em]">
                <span className="w-1 h-1 bg-red-600 rounded-full animate-ping" />
                Initializing System
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-red-900/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-red-900/10 blur-[120px] rounded-full" />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03]" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-6 py-12">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-12">
          <div>
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-3 mb-2"
            >
              <div className="p-2 bg-red-600/10 rounded-lg border border-red-600/20">
                <LayoutDashboard className="w-6 h-6 text-red-500" />
              </div>
              <h1 className="text-3xl font-bold tracking-tighter uppercase">
                {t.title}<span className="text-red-600">Check</span>
              </h1>
            </motion.div>
            <p className="text-zinc-500 text-sm font-mono uppercase tracking-widest">
              {t.subtitle} // v1.0.0
            </p>
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={() => setShowUpdateLog(true)}
              className="p-2.5 glass rounded-xl hover:border-red-600/30 transition-all flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-zinc-400 hover:text-red-500"
              title={t.updateLog}
            >
              <History className="w-4 h-4" />
            </button>

            <button 
              onClick={() => setLang(lang === 'en' ? 'th' : 'en')}
              className="p-2.5 glass rounded-xl hover:border-red-600/30 transition-all flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-zinc-400 hover:text-red-500"
            >
              <Languages className="w-4 h-4" />
              {lang === 'en' ? 'TH' : 'EN'}
            </button>

            <form onSubmit={handleSearch} className="relative group">
              <input 
                type="text" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={t.addPlaceholder}
                className="w-full md:w-64 bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-2.5 pl-10 focus:outline-none focus:border-red-600/50 transition-all placeholder:text-zinc-600 text-sm"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 group-focus-within:text-red-500 transition-colors" />
              <button 
                type="submit"
                disabled={loading}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
              </button>
            </form>

            <button 
              onClick={() => refreshAllStatus(users)}
              disabled={refreshing}
              className="p-2.5 glass rounded-xl hover:border-red-600/30 transition-all group"
            >
              <RefreshCw className={`w-5 h-5 text-zinc-400 group-hover:text-red-500 transition-colors ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </header>

        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 p-4 bg-red-600/10 border border-red-600/20 rounded-xl text-red-500 text-sm flex items-center gap-2"
          >
            <ShieldCheck className="w-4 h-4" />
            {error}
          </motion.div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {[
            { label: t.totalAccounts, value: stats.total, icon: Users, color: 'text-zinc-400' },
            { label: t.onlineNow, value: stats.online, icon: Activity, color: 'text-green-500' },
            { label: t.offline, value: stats.offline, icon: Circle, color: 'text-zinc-600' }
          ].map((stat, i) => (
            <motion.div 
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="glass p-6 rounded-2xl flex items-center justify-between group hover:border-red-600/20 transition-all"
            >
              <div>
                <p className="text-zinc-500 text-xs font-mono uppercase tracking-wider mb-1">{stat.label}</p>
                <h3 className="text-3xl font-bold tracking-tight">{stat.value}</h3>
              </div>
              <stat.icon className={`w-8 h-8 ${stat.color} opacity-20 group-hover:opacity-100 transition-all`} />
            </motion.div>
          ))}
        </div>

        {/* Dashboard Filter */}
        {users.length > 0 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-8 flex items-center justify-between gap-4"
          >
            <div className="relative flex-1 max-w-md group">
              <input 
                type="text" 
                value={filterQuery}
                onChange={(e) => setFilterQuery(e.target.value)}
                placeholder={t.filterPlaceholder}
                className="w-full bg-zinc-900/30 border border-zinc-800/50 rounded-xl px-4 py-2 pl-10 focus:outline-none focus:border-red-600/30 transition-all placeholder:text-zinc-700 text-sm"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-700 group-focus-within:text-red-500 transition-colors" />
            </div>
            <div className="text-zinc-600 text-[10px] font-mono uppercase tracking-widest hidden sm:block">
              {t.showing} {filteredUsers.length} {t.of} {users.length}
            </div>
          </motion.div>
        )}

        {/* Users Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {searchingUser && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="glass p-5 rounded-2xl relative overflow-hidden shimmer border-red-600/20"
              >
                <div className="absolute top-0 left-0 w-full h-1 bg-red-600/50" />
                <UserCardSkeleton />
              </motion.div>
            )}
            {filteredUsers.map((user) => (
              <TiltCard
                key={user.id}
                glowClass={getStatusGlow(user.presence?.userPresenceType)}
                className="group"
              >
                <motion.div
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className={`glass p-5 rounded-2xl relative overflow-hidden transition-all duration-500 ${refreshing ? 'shimmer' : ''} hover:border-red-600/40`}
                >
                  {refreshing ? (
                  <>
                    <div className="absolute top-0 left-0 w-full h-1 bg-zinc-800" />
                    <UserCardSkeleton />
                  </>
                ) : (
                  <>
                    {/* Status Indicator Bar */}
                    <div className={`absolute top-0 left-0 w-full h-1 ${getStatusColor(user.presence?.userPresenceType).replace('text-', 'bg-')}`} />
                    
                    <div className="flex items-start justify-between mb-4" style={{ transform: "translateZ(20px)" }}>
                      <div className="flex items-center gap-4">
                        <div className="relative" style={{ transform: "translateZ(30px)" }}>
                          <img 
                            src={user.thumbnail || `https://www.roblox.com/headshot-thumbnail/image?userId=${user.id}&width=150&height=150&format=png`} 
                            alt={user.name}
                            className="w-16 h-16 rounded-xl object-cover bg-zinc-900 border border-zinc-800"
                          />
                          <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-[#050505] ${getStatusColor(user.presence?.userPresenceType).replace('text-', 'bg-')}`} />
                        </div>
                        <div style={{ transform: "translateZ(25px)" }}>
                          <div className="flex items-center gap-1">
                            <h4 className="font-bold text-lg leading-none">{user.displayName}</h4>
                            {user.hasVerifiedBadge && <ShieldCheck className="w-4 h-4 text-blue-500" />}
                          </div>
                          <p className="text-zinc-500 text-sm font-mono">@{user.name}</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => setDeleteConfirmId(user.id)}
                        className="p-2 text-zinc-600 hover:text-red-500 transition-colors"
                        style={{ transform: "translateZ(40px)" }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="space-y-3" style={{ transform: "translateZ(10px)" }}>
                      <div className="flex items-center justify-between p-3 bg-zinc-900/40 rounded-xl border border-zinc-800/50">
                        <div className="flex items-center gap-2">
                          <Circle className={`w-2 h-2 fill-current ${getStatusColor(user.presence?.userPresenceType)}`} />
                          <span className="text-xs font-mono uppercase tracking-wider text-zinc-400">{t.status}</span>
                        </div>
                        <span className={`text-xs font-bold uppercase ${getStatusColor(user.presence?.userPresenceType)}`}>
                          {getStatusText(user.presence?.userPresenceType)}
                        </span>
                      </div>

                      {user.presence?.userPresenceType === 2 && (
                        <motion.div 
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="p-3 bg-blue-600/10 border border-blue-600/20 rounded-xl space-y-3"
                        >
                          <div className="flex items-start gap-3">
                            <div className="relative flex-shrink-0">
                              <GameIcon 
                                src={user.universeIcon || `https://www.roblox.com/asset-thumbnail/image?assetId=${user.presence.placeId}&width=150&height=150&format=png`}
                                className="w-14 h-14 rounded-lg shadow-lg shadow-blue-500/10 border-blue-500/30"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-0.5">
                                <Gamepad2 className="w-3 h-3 text-blue-500" />
                                <span className="text-[9px] font-mono uppercase tracking-widest text-blue-400/80">{t.currentlyPlaying}</span>
                              </div>
                              <h5 className="text-sm font-bold text-white leading-tight mb-0.5 line-clamp-2">
                                {user.universeDetails?.name || user.placeDetails?.name || user.presence.lastLocation || t.unknownExperience}
                              </h5>
                              {(user.universeDetails?.creator || user.placeDetails?.builder) && (
                                <p className="text-[10px] text-blue-300/70 font-medium truncate">
                                  by {user.universeDetails?.creator?.name || user.placeDetails?.builder}
                                </p>
                              )}
                            </div>
                          </div>
                          
                          {(user.placeDetails || user.universeDetails) && (
                            <div className="pt-2 border-t border-blue-600/10 space-y-1">
                              {user.placeDetails && user.placeDetails.name !== (user.universeDetails?.name) && (
                                <div className="flex items-center justify-between text-[9px] font-mono uppercase tracking-wider text-blue-400/70">
                                  <span>{t.mapName}</span>
                                  <span className="text-blue-300 text-right line-clamp-1 ml-4">{user.placeDetails.name}</span>
                                </div>
                              )}
                              <div className="flex items-center justify-between text-[9px] font-mono uppercase tracking-wider text-blue-400/70">
                                <span>{t.gameId}</span>
                                <span className="text-blue-300">{user.presence.placeId}</span>
                              </div>
                              {user.presence.universeId && (
                                <div className="flex items-center justify-between text-[9px] font-mono uppercase tracking-wider text-blue-400/70">
                                  <span>Universe ID</span>
                                  <span className="text-blue-300">{user.presence.universeId}</span>
                                </div>
                              )}
                              {user.presence.rootPlaceId && (
                                <div className="flex items-center justify-between text-[9px] font-mono uppercase tracking-wider text-blue-400/70">
                                  <span>Root Place ID</span>
                                  <span className="text-blue-300">{user.presence.rootPlaceId}</span>
                                </div>
                              )}
                            </div>
                          )}
                        </motion.div>
                      )}

                      {/* Custom Game Link Section */}
                      <div className="p-3 bg-zinc-900/40 rounded-xl border border-zinc-800/50">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <LinkIcon className="w-3 h-3 text-zinc-500" />
                            <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">{t.customGame}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            {user.customGameRef && (
                              <button 
                                onClick={() => resetCustomGame(user.id)}
                                className="p-1 text-zinc-600 hover:text-red-500 transition-colors"
                                title={t.reset}
                              >
                                <RotateCcw className="w-3 h-3" />
                              </button>
                            )}
                            <button 
                              onClick={() => {
                                setEditingCustomGame(user.id);
                                setCustomGameInput(user.customGameRef || '');
                              }}
                              className="p-1 text-zinc-600 hover:text-blue-500 transition-colors"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>

                        {editingCustomGame === user.id ? (
                          <div className="flex items-center gap-2">
                            <input 
                              type="text"
                              value={customGameInput}
                              onChange={(e) => setCustomGameInput(e.target.value)}
                              placeholder={t.enterGameRef}
                              className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-2 py-1 text-[10px] focus:outline-none focus:border-blue-500"
                              autoFocus
                            />
                            <button onClick={() => saveCustomGame(user.id)} className="p-1 text-green-500 hover:bg-green-500/10 rounded">
                              <Check className="w-3 h-3" />
                            </button>
                            <button onClick={() => setEditingCustomGame(null)} className="p-1 text-red-500 hover:bg-red-500/10 rounded">
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <div className="text-[10px] font-mono text-zinc-500">
                            {user.customGameRef ? (
                              <div className="flex items-center gap-3">
                                <GameIcon 
                                  src={`https://www.roblox.com/asset-thumbnail/image?assetId=${user.customGameRef}&width=150&height=150&format=png`}
                                  className="w-8 h-8 rounded-md flex-shrink-0"
                                  fallbackIcon={LinkIcon}
                                />
                                <div className="flex flex-col gap-0.5 min-w-0">
                                  {user.customPlaceDetails?.name && (
                                    <span className="text-blue-300 font-bold truncate">{user.customPlaceDetails.name}</span>
                                  )}
                                  <a 
                                    href={user.customGameRef.startsWith('http') ? user.customGameRef : `https://www.roblox.com/games/${user.customGameRef}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-400 hover:underline flex items-center gap-1 truncate"
                                  >
                                    {user.customGameRef} <ExternalLink className="w-2 h-2" />
                                  </a>
                                </div>
                              </div>
                            ) : (
                              <span className="italic opacity-50">Not set</span>
                            )}
                          </div>
                        )}
                      </div>

                      {(!user.presence?.userPresenceType || user.presence.userPresenceType === 0) && user.presence?.lastOnline && (
                        <div className="flex flex-col gap-1 px-1">
                          <div className="flex items-center gap-2 text-[10px] font-mono text-zinc-500 uppercase tracking-wider">
                            <Clock className="w-3 h-3" />
                            {t.offlineSince} {formatRelativeTime(user.presence.lastOnline, lang)}
                          </div>
                          <div className="text-[9px] font-mono text-zinc-600 uppercase tracking-widest pl-5">
                            {t.lastSeen} {t.at} {new Date(user.presence.lastOnline).toLocaleTimeString(lang === 'th' ? 'th-TH' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      )}

                      <div className="flex flex-col gap-2">
                        <a 
                          href={`https://www.roblox.com/users/${user.id}/profile`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 flex items-center justify-center gap-2 py-2 bg-zinc-800/50 hover:bg-zinc-800 rounded-xl text-xs font-medium transition-colors"
                        >
                          {t.profile} <ExternalLink className="w-3 h-3" />
                        </a>
                        <div className="text-[9px] font-mono text-zinc-600 uppercase tracking-widest text-center">
                          {t.lastUpdated}: {user.lastUpdated ? new Date(user.lastUpdated).toLocaleTimeString(lang === 'th' ? 'th-TH' : 'en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '-'}
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </motion.div>
            </TiltCard>
          ))}
          </AnimatePresence>
          
          {users.length === 0 && (
            <div className="col-span-full py-20 text-center">
              <div className="inline-block p-4 bg-zinc-900/50 rounded-full mb-4">
                <Users className="w-12 h-12 text-zinc-700" />
              </div>
              <h3 className="text-xl font-bold mb-2">{t.noAccounts}</h3>
              <p className="text-zinc-500 max-w-xs mx-auto">
                {t.noAccountsDesc}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirmId !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] bg-black/80 backdrop-blur-sm flex items-center justify-center p-6"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl max-w-sm w-full shadow-2xl"
            >
              <div className="flex items-center gap-3 mb-4 text-red-500">
                <div className="p-2 bg-red-500/10 rounded-lg">
                  <Trash2 className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold uppercase tracking-tight">Confirm Delete</h3>
              </div>
              <p className="text-zinc-400 text-sm mb-6 leading-relaxed">
                Are you sure you want to remove this user from the monitor? This action will be visible to everyone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteConfirmId(null)}
                  className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold uppercase tracking-widest rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => removeUser(deleteConfirmId)}
                  className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white text-xs font-bold uppercase tracking-widest rounded-xl transition-colors"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Update Log Modal */}
      <AnimatePresence>
        {showUpdateLog && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowUpdateLog(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg glass rounded-3xl overflow-hidden shadow-2xl border-red-600/20"
            >
              <div className="p-6 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-600/10 rounded-lg border border-red-600/20">
                    <History className="w-5 h-5 text-red-500" />
                  </div>
                  <h3 className="text-xl font-bold uppercase tracking-tighter">{t.updateLog}</h3>
                </div>
                <button 
                  onClick={() => setShowUpdateLog(false)}
                  className="p-2 text-zinc-500 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-6 max-h-[60vh] overflow-y-auto custom-scrollbar space-y-8">
                {t.updates.map((update, idx) => (
                  <div key={idx} className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-red-600 rounded-full" />
                      <h4 className="text-sm font-bold text-zinc-200 uppercase tracking-wider">{update.title}</h4>
                    </div>
                    <ul className="space-y-2 pl-3.5 border-l border-zinc-800 ml-0.5">
                      {update.items.map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-zinc-500 leading-relaxed">
                          <ChevronRight className="w-3 h-3 mt-0.5 flex-shrink-0 text-red-600/50" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              <div className="p-4 bg-zinc-900/50 border-t border-zinc-800 text-center">
                <p className="text-[10px] font-mono text-zinc-600 uppercase tracking-[0.2em]">
                  Current Version: v1.5.0
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="relative z-10 py-12 border-t border-zinc-900 mt-20">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <p className="text-zinc-600 text-xs font-mono">
              &copy; 2024 JIRAMETCHECK. NOT AFFILIATED WITH ROBLOX CORPORATION.
            </p>
            <p className="text-red-600/50 text-[10px] font-mono uppercase tracking-widest">
              Developed by _.texraxit
            </p>
          </div>
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-2 text-[10px] font-mono text-zinc-600 uppercase tracking-widest">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
              {t.systemOperational}
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
