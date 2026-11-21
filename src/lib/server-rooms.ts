import { Room, Participant, LiveCaptionItem, ChatMessageItem, StructuredStage } from '@/types/room';
import { INITIAL_COMMUNITY_ROOMS } from '@/lib/mock-rooms';

export interface RoomSyncState {
  participants: Map<string, Participant & { lastSeen: number }>;
  recentCaptions: LiveCaptionItem[];
  recentChat: ChatMessageItem[];
  currentStage?: StructuredStage;
  activeSpeakerId?: string | null;
  lastUpdated: number;
}

// Global persistent containers across hot reloads & worker threads
const g = typeof globalThis !== 'undefined' ? (globalThis as any) : {};

// Safe dynamic node require helper to bypass edge Webpack bundler static analysis
function getRuntimeNodeModule(name: string) {
  try {
    if (typeof process !== 'undefined' && process?.versions?.node) {
      const dynamicReq = eval('require');
      return dynamicReq(name);
    }
  } catch {
    return null;
  }
  return null;
}

if (!g.__voicesphere_rooms_map) {
  g.__voicesphere_rooms_map = new Map<string, Room>();
  INITIAL_COMMUNITY_ROOMS.forEach((r) => {
    g.__voicesphere_rooms_map.set(r.id, { ...r });
  });

  // Try hydrating custom community rooms from disk in Node.js runtime
  try {
    const fs = getRuntimeNodeModule('fs');
    const path = getRuntimeNodeModule('path');
    if (fs && path) {
      const dataDir = path.join(process.cwd(), '.data');
      const roomsFile = path.join(dataDir, 'community_rooms.json');
      if (fs.existsSync(roomsFile)) {
        const raw = fs.readFileSync(roomsFile, 'utf8');
        const list: Room[] = JSON.parse(raw);
        if (Array.isArray(list)) {
          list.forEach((r) => {
            if (r && r.id) g.__voicesphere_rooms_map.set(r.id, r);
          });
        }
      }
    }
  } catch {
    // Non-fatal edge fallback
  }
}

if (!g.__voicesphere_sync_map) {
  g.__voicesphere_sync_map = new Map<string, RoomSyncState>();
}

export const serverRoomsMap: Map<string, Room> = g.__voicesphere_rooms_map;
export const roomsSyncMap: Map<string, RoomSyncState> = g.__voicesphere_sync_map;

// Cloudflare KV Store Helper (for multi-datacenter edge persistence on Cloudflare Pages)
export async function getCloudflareKv(): Promise<any | null> {
  try {
    const symbolKey = Symbol.for('__cloudflare-request-context__');
    const cfContext = (globalThis as any)?.[symbolKey];
    if (cfContext?.env?.VOICESPHERE_KV) {
      return cfContext.env.VOICESPHERE_KV;
    }
  } catch {}
  try {
    const envKv = (process.env as any)?.VOICESPHERE_KV || (globalThis as any)?.VOICESPHERE_KV;
    if (envKv && typeof envKv.get === 'function') return envKv;
  } catch {}
  return null;
}

// Save custom rooms to disk in Node.js or Cloudflare KV
export async function persistCustomRoomsToDisk() {
  try {
    const initialIds = new Set(INITIAL_COMMUNITY_ROOMS.map((r) => r.id));
    const customRooms = Array.from(serverRoomsMap.values()).filter((r) => !initialIds.has(r.id));
    const jsonStr = JSON.stringify(customRooms, null, 2);

    // 1. Cloudflare KV binding if present
    const kv = await getCloudflareKv();
    if (kv) {
      await kv.put('community_rooms', jsonStr).catch(() => {});
    }

    // 2. Node.js filesystem persistence
    const fs = getRuntimeNodeModule('fs');
    const path = getRuntimeNodeModule('path');
    if (fs && path) {
      const dataDir = path.join(process.cwd(), '.data');
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      const roomsFile = path.join(dataDir, 'community_rooms.json');
      fs.writeFileSync(roomsFile, jsonStr, 'utf8');
    }
  } catch {
    // Edge/serverless fallback
  }
}

export function getOrCreateRoomSync(roomId: string): RoomSyncState {
  let state = roomsSyncMap.get(roomId);
  if (!state) {
    state = {
      participants: new Map(),
      recentCaptions: [],
      recentChat: [],
      lastUpdated: Date.now(),
    };
    roomsSyncMap.set(roomId, state);
  }
  return state;
}

// Prune participants not seen in the last 25 seconds
export function pruneStaleParticipants(state: RoomSyncState) {
  const now = Date.now();
  const cutoff = now - 25000;
  state.participants.forEach((p, id) => {
    if (p.lastSeen < cutoff) {
      state.participants.delete(id);
    }
  });
}

// Register or update a community room
export function registerServerRoom(room: Room) {
  serverRoomsMap.set(room.id, room);

  // Initialize room sync state with host
  const state = getOrCreateRoomSync(room.id);
  if (room.participants && room.participants.length > 0) {
    room.participants.forEach((p) => {
      state.participants.set(p.id, { ...p, lastSeen: Date.now() });
    });
  }

  persistCustomRoomsToDisk();
}

// Update real-time participant presence and sync with room definition
export function touchRoomParticipant(roomId: string, user: Participant, action?: string) {
  const state = getOrCreateRoomSync(roomId);
  state.lastUpdated = Date.now();

  const room = serverRoomsMap.get(roomId);

  if (action === 'leave') {
    state.participants.delete(user.id);
    if (room && room.participants) {
      room.participants = room.participants.filter((p) => p.id !== user.id);
    }
  } else {
    state.participants.set(user.id, { ...user, lastSeen: Date.now() });

    if (room) {
      if (!room.participants) room.participants = [];
      const idx = room.participants.findIndex((p) => p.id === user.id);
      if (idx !== -1) {
        room.participants[idx] = { ...room.participants[idx], ...user };
      } else {
        room.participants.push({ ...user });
      }
    }
  }

  pruneStaleParticipants(state);
}

// Return all rooms with live participants dynamically aggregated
export function getRoomsWithLiveParticipants(): Room[] {
  const allRooms = Array.from(serverRoomsMap.values());

  return allRooms
    .map((room) => {
      const state = roomsSyncMap.get(room.id);
      if (!state) return room;

      pruneStaleParticipants(state);
      const liveParticipants = Array.from(state.participants.values());

      if (liveParticipants.length === 0) {
        return room;
      }

      // Merge live participants with room's initial participants
      const pMap = new Map<string, Participant>();
      (room.participants || []).forEach((p) => pMap.set(p.id, p));
      liveParticipants.forEach((p) => pMap.set(p.id, p));

      return {
        ...room,
        participants: Array.from(pMap.values()),
        structuredStage: state.currentStage
          ? {
              ...room.structuredStage,
              currentStage: state.currentStage,
              activeSpeakerId: state.activeSpeakerId ?? room.structuredStage?.activeSpeakerId ?? null,
            }
          : room.structuredStage,
      };
    })
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
}
