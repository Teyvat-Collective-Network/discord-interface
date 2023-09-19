import bot from "../lib/bot.ts";
import { RouteMap } from "../lib/types.ts";

export default {
    async "GET /invite/_"({ params: [code] }) {
        try {
            const invite = await bot.fetchInvite(code);
            return { ...invite };
        } catch {
            throw 404;
        }
    },
} as RouteMap;
