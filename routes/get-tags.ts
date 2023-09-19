import bot from "../lib/bot.ts";
import { RouteMap } from "../lib/types.ts";

export default {
    async "GET /users"({ req }) {
        const url = new URL(req.url);
        const output: (string | null)[] = [];

        for (const id of url.searchParams.get("users")!.split(","))
            try {
                output.push((await bot.users.fetch(id)).tag);
            } catch {
                output.push(null);
            }

        return output;
    },
} as RouteMap;
