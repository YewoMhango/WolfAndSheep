# Wolf & Sheep

A web version of the classic **Wolf & Sheep** (a.k.a. Fox & Hounds) board game.
One wolf, four sheep, played on the dark squares of an 8×8 board. Play locally on
one device, or online against another player via a room code or quick match.

## Rules

- Pieces live only on the **dark squares**; every move is one diagonal step to an empty square.
- **Sheep** move first and may only move **forward** (never backward).
- The **wolf** moves one step in **any** diagonal direction.
- No jumping or capturing — the pieces only block each other.
- The **wolf wins** by reaching the sheep's home row.
- The **sheep win** by trapping the wolf so it has no legal move.

## Tech

An npm-workspaces monorepo, TypeScript throughout:

| Workspace | Purpose |
| --------- | ------- |
| `shared`  | Pure, dependency-free game rules engine + WebSocket protocol types. Used by **both** client and server. |
| `server`  | Express + `ws` WebSocket server. Authoritative game state, private rooms, and priority-queue matchmaking. In-memory only. |
| `client`  | Vite + React front end. Client-side routing (React Router), per-component CSS Modules, and inline SVG artwork. |

The move-validation logic lives once in `shared/src/rules.ts` and is imported by the
client (for instant, legal-only interactions) and the server (as the source of truth).

### Client conventions

- **Routing:** `react-router-dom` drives three routes — `/` (menu), `/local`, `/online` —
  so the browser Back button returns to the previous screen instead of leaving the app.
- **Styling:** every component owns a co-located `*.module.css` file (CSS Modules).
  `src/styles/theme.css` holds only the global custom properties and page reset.
- **Icons:** the wolf and sheep pieces are hand-drawn inline SVGs
  (`src/ui/GamePieceIcon.tsx`); other UI glyphs come from the [`lucide-react`](https://lucide.dev)
  icon pack. No emoji are used in the interface.
- **Responsive board:** the board is always a square sized to the largest that fits the
  viewport (width, height, and a max cap), and each cell keeps a fixed 1:1 aspect ratio.

## Getting started

```bash
npm install          # install all workspaces
npm run dev          # start server (:3001) + client (:5173) together
```

Then open http://localhost:5173. The Vite dev server proxies WebSocket traffic
(`/ws`) to the Express server.

To try online play locally, open the site in **two separate browser tabs/windows**
(each tab is its own session). Use *Quick match* in both, or *Create a private game*
in one and *Join with a code* in the other.

### Other commands

```bash
npm test             # run the rules-engine unit tests (vitest, in shared)
npm run typecheck    # type-check server + client
npm run build        # production build of the client (-> client/dist)
npm start            # run the server; it also serves client/dist in production
```

For production, run `npm run build` then `npm start` — the Express server serves the
built client and handles WebSockets from the same origin (default port `3001`, override
with `SERVER_PORT`).

## Deploy to Render

The repo ships a [`render.yaml`](./render.yaml) blueprint that deploys everything as a
**single Render Web Service** — the Express server builds and serves the React client and
handles the `/ws` WebSocket from one origin, so there is no separate static site or CORS
to configure.

1. Push this repo to GitHub or GitLab.
2. In the Render dashboard: **New +** → **Blueprint**, and select the repo. Render reads
   `render.yaml` and provisions the service:
   - **Build:** `npm install --include=dev && npm run build`
   - **Start:** `npm start`
   - **Health check:** `/health`
   - **Node version:** pinned by [`.node-version`](./.node-version)
3. Deploy. Render assigns a URL and injects `PORT` (the server already reads it); WebSockets
   run over the same URL automatically.

Notes:
- The blueprint uses the **free** plan, which spins down after ~15 minutes without an
  inbound HTTP request (cold starts on the next visit). Change `plan` to `starter` in
  `render.yaml` for an always-on instance.
- **Staying awake during a game:** once players are in an online match they communicate
  over the WebSocket, which doesn't reliably reset Render's HTTP idle timer, so a long game
  could otherwise get spun down mid-play. The client sends a lightweight `/health` request
  every 14 minutes *while a user is in the online flow* (`useKeepServerAwake`) to prevent
  that — no server-side always-on ping, so the free instance-hours are only spent when
  someone is actually playing. This keeps a *running* instance awake; it can't wake one that
  has already spun down (for that, add an external uptime pinger such as UptimeRobot).
- Game state is in-memory, so a redeploy or spin-down ends any in-progress games.

## How online multiplayer works

- Each browser tab gets a session token (kept in `sessionStorage`) so it can
  **reconnect** into an in-progress game after a brief drop (60s grace period).
- **Private rooms:** the creator picks a side and gets a 5-character code to share.
- **Quick match:** players enter a priority queue keyed by wait time (longest wait =
  highest priority, a binary min-heap in `server/src/PriorityQueue.ts`). Role
  preferences (`wolf` / `sheep` / `either`) are honored when pairing.
- Every move is validated server-side; the server broadcasts the authoritative state
  to both players. The client never trusts itself.
- Rematch swaps sides so each player gets a turn as the wolf.
