import { useEffect } from "react";

/**
 * Keeps the (Render free-tier) server awake during an online session.
 *
 * Render spins a free service down after ~15 minutes without an inbound *HTTP*
 * request. While a game is in progress the two players talk over the WebSocket,
 * which does not reliably count as HTTP activity — so a long game could get spun
 * down mid-play. This hook sends a lightweight `/health` request on an interval
 * to generate that HTTP traffic.
 *
 * It runs only while mounted (i.e. only while a real user is in the online
 * flow — never on the menu or in a local game, which don't touch the server)
 * and only in the deployed build. The initial WebSocket connection is itself an
 * HTTP upgrade request, so the idle timer is already fresh at mount; the first
 * ping is one interval later.
 */
const PING_INTERVAL_MS = 14 * 60 * 1000; // 14 min — one minute under Render's ~15 min idle window

export function useKeepServerAwake(): void {
  useEffect(() => {
    if (!import.meta.env.PROD) return;
    const ping = () => {
      fetch("/health", { cache: "no-store" }).catch(() => {
        /* offline or the instance is cold-starting — nothing to do */
      });
    };
    const timer = setInterval(ping, PING_INTERVAL_MS);
    return () => clearInterval(timer);
  }, []);
}
