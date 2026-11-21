import { Room } from '@/types/room';
import { INITIAL_COMMUNITY_ROOMS } from '@/lib/mock-rooms';

// Edge-safe in-memory store for active rooms
export const serverRoomsMap = new Map<string, Room>();

// Initialize with default community rooms
INITIAL_COMMUNITY_ROOMS.forEach((r) => {
  serverRoomsMap.set(r.id, r);
});
