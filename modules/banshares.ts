import api from "../lib/api.ts";
import { channels } from "../lib/bot.ts";

const CYCLE = 30 * 60 * 1000;

setTimeout(
    () =>
        setInterval(async () => {
            const { remind } = await api(`POST /banshares/remind`);
            if (!remind) return;

            await channels.EXEC_MANAGEMENT.send(
                `${Bun.env.URGENT} One or more banshares has exceeded the allowed pending time. Please check the list of all pending banshares in ${channels.BANSHARE_DASHBOARD}.`,
            );
        }, CYCLE),
    CYCLE - (Date.now() % CYCLE),
);
