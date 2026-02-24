export interface RobloxUser {
  id: number;
  name: string;
  displayName: string;
  hasVerifiedBadge: boolean;
}

export interface RobloxPresence {
  userPresenceType: number; // 0: Offline, 1: Online, 2: InGame, 3: InStudio
  lastLocation: string;
  placeId: number | null;
  rootPlaceId: number | null;
  gameId: string | null;
  universeId: number | null;
  userId: number;
  lastOnline: string;
}

export interface RobloxThumbnail {
  targetId: number;
  state: string;
  imageUrl: string;
}

export interface UserStatus extends RobloxUser {
  presence?: RobloxPresence;
  thumbnail?: string;
  lastUpdated?: string;
}
