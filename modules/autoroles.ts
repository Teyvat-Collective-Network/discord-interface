import api from "../lib/api.ts";
import { syncAutoroles } from "../lib/autoroles.ts";
import bot from "../lib/bot.ts";
import logger from "../lib/logger.ts";

const CYCLE = 60 * 60 * 1000;

setTimeout(
    () =>
        setInterval(async () => {
            const guilds = await api(`GET /guilds`);

            for (const { id } of [...guilds, { id: Bun.env.HQ }, { id: Bun.env.HUB }]) {
                const guild = bot.guilds.cache.get(id);
                if (!guild) continue;

                try {
                    await syncAutoroles(guild);
                } catch (error) {
                    logger.error(error);
                }
            }
        }, CYCLE),
    CYCLE - (Date.now() % CYCLE),
);
