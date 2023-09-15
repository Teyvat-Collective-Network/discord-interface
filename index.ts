import pino from "pino";
import { Client, IntentsBitField } from "discord.js";

const logger = pino();
if (process.env.DEBUG) logger.level = "trace";

const bot = new Client({ intents: IntentsBitField.Flags.Guilds | IntentsBitField.Flags.GuildMembers });
await bot.login(Bun.env.TOKEN!);

const routes = {
    async "GET /user/_"({ params: [userId] }) {
        try {
            const user = await bot.users.fetch(userId);
            return { ...user, tag: user.tag };
        } catch {
            throw 404;
        }
    },
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
    async "GET /invite/_"({ params: [code] }) {
        try {
            const invite = await bot.fetchInvite(code);
            return { ...invite };
        } catch {
            throw 404;
        }
    },
    async "POST /banshare"({ body }) {
        console.log(body);
        return {};
    },
} as Record<string, (data: { req: Request; params: string[]; body: any }) => any>;

Bun.serve({
    development: !!Bun.env.DEBUG,
    async fetch(req) {
        try {
            const method = req.method.toUpperCase();

            const url = new URL(req.url);
            const path = url.pathname.slice(1).split("/");

            for (const [key, handle] of Object.entries(routes)) {
                const [mt, route] = key.split(" ");
                if (method !== mt) continue;

                const match = route.slice(1).split("/");
                if (match.length !== path.length) continue;

                const params: string[] = [];
                let success = true;

                for (let index = 0; index < match.length; index++) {
                    if (match[index] === "_") params.push(decodeURIComponent(path[index]));
                    else if (match[index] !== path[index]) {
                        success = false;
                        break;
                    }
                }

                if (!success) continue;

                let body: any;

                try {
                    body = await req.json();
                } catch {
                    body = null;
                }

                const data = await handle({ req, params, body });
                return new Response(JSON.stringify(data));
            }
        } catch (error) {
            if (typeof error === "number") return new Response("", { status: error });
            if (Array.isArray(error) && typeof error[0] === "number") return new Response(JSON.stringify(error[1]), { status: error[0] });

            logger.error(error);
            return new Response("", { status: 500 });
        }

        return new Response("", { status: 404 });
    },
});

logger.debug("[DI] READY");
