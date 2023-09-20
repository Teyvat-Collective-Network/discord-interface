import api from "../lib/api.ts";
import { syncMemberAutoroles } from "../lib/autoroles.ts";
import bot from "../lib/bot.ts";
import logger from "../lib/logger.ts";
import { RouteMap } from "../lib/types.ts";

export default {
    async "PUT /autoroles/_"({ params: [user] }) {
        const guilds = await api(`GET /guilds`);

        for (const { id } of [...guilds, { id: Bun.env.HQ }, { id: Bun.env.HUB }]) {
            const guild = bot.guilds.cache.get(id);
            if (!guild) continue;

            const member = await guild.members.fetch(user).catch(() => {});
            if (!member) continue;

            try {
                await syncMemberAutoroles(member);
            } catch (error) {
                logger.error(error);
            }
        }
    },
} as RouteMap;
