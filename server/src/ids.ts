import { customAlphabet, nanoid } from 'nanoid';

// Room codes: 5 chars, unambiguous alphabet (no 0/O/1/I) for easy sharing.
const roomCodeGenerator = customAlphabet('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 5);

export function newRoomCode(): string {
  return roomCodeGenerator();
}

export function newPlayerId(): string {
  return nanoid(10);
}

export function newSessionToken(): string {
  return nanoid(24);
}
