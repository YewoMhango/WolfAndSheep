import { otherRole, type Role, type RolePreference } from '@wolf/shared';
import type { Player } from './types.js';
import type { RoomManager } from './RoomManager.js';
import { PriorityQueue } from './PriorityQueue.js';
import { sendPlayer } from './send.js';

interface QueueEntry {
  player: Player;
  rolePreference: RolePreference;
  enqueuedAt: number;
  sequence: number;
}

/** Longest-waiting player has the highest priority; `sequence` breaks ties stably. */
function byWaitTime(a: QueueEntry, b: QueueEntry): number {
  return a.enqueuedAt - b.enqueuedAt || a.sequence - b.sequence;
}

/** Assign sides to a pair, honoring as many preferences as possible. */
function resolveRoles(a: QueueEntry, b: QueueEntry): [Role, Role] {
  const preferenceA = a.rolePreference;
  const preferenceB = b.rolePreference;
  if (preferenceA !== 'either' && preferenceB !== 'either') {
    return preferenceA !== preferenceB ? [preferenceA, preferenceB] : [preferenceA, otherRole(preferenceA)];
  }
  if (preferenceA !== 'either') return [preferenceA, otherRole(preferenceA)];
  if (preferenceB !== 'either') return [otherRole(preferenceB), preferenceB];
  return Math.random() < 0.5 ? ['wolf', 'sheep'] : ['sheep', 'wolf'];
}

/** How many of the two players get the side they asked for. Higher is better. */
function satisfaction(a: QueueEntry, b: QueueEntry): number {
  const [roleA, roleB] = resolveRoles(a, b);
  let satisfiedCount = 0;
  if (a.rolePreference === 'either' || a.rolePreference === roleA) satisfiedCount++;
  if (b.rolePreference === 'either' || b.rolePreference === roleB) satisfiedCount++;
  return satisfiedCount;
}

export class Matchmaker {
  private queue = new PriorityQueue<QueueEntry>(byWaitTime);
  private sequence = 0;

  constructor(private readonly rooms: RoomManager) {}

  enqueue(player: Player, rolePreference: RolePreference = 'either'): void {
    if (player.queued) {
      sendPlayer(player, { type: 'error', code: 'already_queued', message: 'Already searching.' });
      return;
    }
    player.queued = true;
    this.queue.push({ player, rolePreference, enqueuedAt: Date.now(), sequence: this.sequence++ });
    this.matchAll();
    this.broadcastPositions();
  }

  cancel(player: Player): void {
    const removed = this.queue.remove((entry) => entry.player.id === player.id);
    if (removed) {
      player.queued = false;
      sendPlayer(player, { type: 'match_cancelled' });
    }
    this.broadcastPositions();
  }

  /** Called when a queued player disconnects. */
  remove(player: Player): void {
    if (this.queue.remove((entry) => entry.player.id === player.id)) {
      player.queued = false;
      this.broadcastPositions();
    }
  }

  /** Pair up players while at least two are waiting. */
  private matchAll(): void {
    while (this.queue.size >= 2) {
      const first = this.queue.pop()!;
      // Pick the best partner: most preferences satisfied, then longest-waiting.
      const partner = this.queue
        .values()
        .sort(byWaitTime)
        .reduce<QueueEntry | null>((best, candidate) => {
          if (!best) return candidate;
          return satisfaction(first, candidate) > satisfaction(first, best) ? candidate : best;
        }, null)!;
      this.queue.remove((entry) => entry.player.id === partner.player.id);

      first.player.queued = false;
      partner.player.queued = false;

      const [firstRole] = resolveRoles(first, partner);
      const wolf = firstRole === 'wolf' ? first.player : partner.player;
      const sheep = firstRole === 'wolf' ? partner.player : first.player;
      this.rooms.startMatched(wolf, sheep);
    }
  }

  private broadcastPositions(): void {
    const waiting = this.queue.values().sort(byWaitTime);
    waiting.forEach((entry, index) => {
      sendPlayer(entry.player, { type: 'queued', position: index + 1, size: waiting.length });
    });
  }
}
