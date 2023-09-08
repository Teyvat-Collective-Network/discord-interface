import "dotenv/config.js";

import fastify from "fastify";
import pino from "pino";

import { Client, IntentsBitField } from "discord.js";

const logger = pino();
if (process.env.DEBUG) logger.level = "trace";

const bot = new Client({ intents: IntentsBitField.Flags.Guilds | IntentsBitField.Flags.GuildMembers });
await bot.login(process.env.TOKEN);

const server = fastify({ ignoreTrailingSlash: true });

server.get("/user/:userid", async (request, reply) => {
    try {
        return await bot.users.fetch(request.params.userid);
    } catch {
        return reply.code(404).send();
    }
});

server.listen({ port: process.env.PORT }).then(() => logger.info("[DI] READY"));
