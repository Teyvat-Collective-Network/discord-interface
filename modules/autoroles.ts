import { syncAllAutoroles } from "../lib/autoroles.ts";

const CYCLE = 60 * 60 * 1000;

setTimeout(() => setInterval(syncAllAutoroles, CYCLE), CYCLE - (Date.now() % CYCLE));
