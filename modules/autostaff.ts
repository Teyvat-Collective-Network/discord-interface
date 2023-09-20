import api from "../lib/api.ts";
import { sync } from "../lib/autostaff.ts";
import bot from "../lib/bot.ts";
import logger from "../lib/logger.ts";

const CYCLE = 30 * 1000;

setTimeout(
    () =>
        setInterval(async () => {
            const guilds = await api(`GET /guilds`);

            for (const { id } of guilds) {
                const guild = bot.guilds.cache.get(id);
                if (!guild) continue;

                try {
                    await sync(guild);
                } catch (error) {
                    logger.error(error);
                }
            }
        }, CYCLE),
    CYCLE - (Date.now() % CYCLE),
);
