import { syncAllAutostaff } from "../lib/autostaff.ts";

const CYCLE = 60 * 60 * 1000;

setTimeout(() => setInterval(syncAllAutostaff, CYCLE), CYCLE - (Date.now() % CYCLE));
