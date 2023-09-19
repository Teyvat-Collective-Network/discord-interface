import bot from "../lib/bot.ts";
import { RouteMap } from "../lib/types.ts";

export default {
    async "GET /user/_"({ params: [userId] }) {
        try {
            const user = await bot.users.fetch(userId);
            return { ...user, tag: user.tag };
        } catch {
            throw 404;
        }
    },
} as RouteMap;
