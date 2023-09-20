import {
    ApplicationCommandData,
    ApplicationCommandOptionData,
    ApplicationCommandOptionType,
    ApplicationCommandSubCommandData,
    ApplicationCommandSubGroupData,
    ApplicationCommandType,
    ChatInputCommandInteraction,
    Colors,
    Events,
} from "discord.js";
import fs from "fs";
import api from "./lib/api.ts";
import bot from "./lib/bot.ts";
import logger from "./lib/logger.ts";
import reply from "./lib/reply.ts";
import { RouteMap } from "./lib/types.ts";

process.on("uncaughtException", (error) => logger.error(error));

const routes: RouteMap = {};

async function loadRoutes(path: string) {
    if (fs.statSync(path).isDirectory()) for (const name of fs.readdirSync(path)) await loadRoutes(`${path}/${name}`);
    else {
        const { default: map } = await import(path);
        Object.assign(routes, map);
        for (const key of Object.keys(map)) logger.debug(`[DI] Loaded ${key}`);
    }
}

loadRoutes("./routes");

async function loadInteractions(path: string, object: any, key: string) {
    if (fs.statSync(path).isDirectory()) for (const name of fs.readdirSync(path)) await loadInteractions(`${path}/${name}`, (object[key] ??= {}), name);
    else {
        key = key.replace(/\..*?$/, "");

        const { default: handler } = await import(path);
        object[key] = handler;

        logger.debug(`[DI] Loaded interaction ${path}`);
    }
}

const commands: ApplicationCommandData[] = [];
const commandHandlers: Record<number, Record<string, any>> = {};
const interactionHandlers: any = {};
const eventHandlers: Partial<Record<any, any[]>> = {};

for (const module of fs.readdirSync("./modules")) {
    const path = `./modules/${module}`;

    if (fs.statSync(path).isDirectory()) {
        if (fs.existsSync(`${path}/commands`)) {
            const handlers: Record<string, any> = {};
            const options: ApplicationCommandOptionData[] = [];
            const groups: Record<string, ApplicationCommandSubCommandData[]> = {};

            for (const name of fs.readdirSync(`${path}/commands`)) {
                const data = await import(`${path}/commands/${name}`);
                const { command } = data;
                command.options ??= [];

                if (command.key) {
                    if (command.group) {
                        (groups[command.group] ??= []).push({
                            type: ApplicationCommandOptionType.Subcommand,
                            name: command.key,
                            description: command.description,
                            options: command.options,
                        });

                        handlers[`${command.group} ${command.key}`] = data;

                        logger.debug(`[DI] Loaded command /${module} ${command.group} ${command.key}`);
                    } else {
                        options.push({
                            type: ApplicationCommandOptionType.Subcommand,
                            name: command.key,
                            description: command.description,
                            options: command.options,
                        });

                        handlers[command.key] = data;

                        logger.debug(`[DI] Loaded command /${module} ${command.key}`);
                    }
                } else {
                    commands.push(command);
                    (commandHandlers[command.type] ??= {})[command.name] = data;
                    logger.debug(`[DI] Loaded command ${command.name}`);
                }
            }

            commands.push({
                type: ApplicationCommandType.ChatInput,
                name: module,
                description: `commands in the ${module} module`,
                options: [
                    ...Object.entries(groups).map(
                        ([group, options]): ApplicationCommandSubGroupData => ({
                            type: ApplicationCommandOptionType.SubcommandGroup,
                            name: group,
                            description: `commands in the ${group} group in the ${module} module`,
                            options,
                        }),
                    ),
                    ...options,
                ],
            });

            (commandHandlers[ApplicationCommandType.ChatInput] ??= {})[module] = {
                async default(cmd: ChatInputCommandInteraction, ...args: any[]) {
                    const group = cmd.options.getSubcommandGroup(false);
                    const key = `${group ? `${group} ` : ""}${cmd.options.getSubcommand()}`;
                    if (!handlers[key]) throw "This command has not been implemented yet.";
                    return await handlers[key].default(cmd, ...args);
                },
            };

            logger.debug(`[DI] Fully loaded commands for the ${module} module`);
        }

        if (fs.existsSync(`${path}/events`))
            for (const name of fs.readdirSync(`${path}/events`)) {
                const { event, default: handler } = await import(`${path}/events/${name}`);
                (eventHandlers[event] ??= []).push(handler);
            }

        if (fs.existsSync(`${path}/interactions`)) await loadInteractions(`${path}/interactions`, interactionHandlers, module);
    } else await import(path);
}

await bot.application!.commands.set(commands);

bot.on(Events.InteractionCreate, async (interaction) => {
    try {
        if (interaction.isCommand() || interaction.isAutocomplete()) {
            const handler = commandHandlers[interaction.commandType]?.[interaction.commandName];
            if (!handler) throw "This command has not been implemented yet.";

            const values: any[] = interaction.isUserContextMenuCommand()
                ? [interaction.targetUser]
                : interaction.isMessageContextMenuCommand()
                ? [interaction.targetMessage]
                : interaction.isAutocomplete()
                ? [interaction.options.getFocused()]
                : [];

            const required: { type: number; name: string }[] = [];

            if (interaction.isChatInputCommand()) {
                for (const option of interaction.command!.options) {
                    if (option.type === ApplicationCommandOptionType.SubcommandGroup) {
                        if (option.name === interaction.options.getSubcommandGroup(false))
                            for (const suboption of option.options ?? [])
                                if (suboption.name === interaction.options.getSubcommand(false))
                                    for (const leaf of suboption.options ?? []) required.push(leaf);
                    } else if (option.type === ApplicationCommandOptionType.Subcommand) {
                        if (option.name === interaction.options.getSubcommand(false)) for (const leaf of option.options ?? []) required.push(leaf);
                    } else required.push(option);
                }

                for (const option of required)
                    switch (option.type) {
                        case ApplicationCommandOptionType.Attachment:
                            values.push(interaction.options.getAttachment(option.name));
                            break;
                        case ApplicationCommandOptionType.Boolean:
                        case ApplicationCommandOptionType.Number:
                        case ApplicationCommandOptionType.Integer:
                        case ApplicationCommandOptionType.String:
                            values.push(interaction.options.get(option.name)?.value);
                            break;
                        case ApplicationCommandOptionType.Channel:
                            values.push(interaction.options.getChannel(option.name));
                            break;
                        case ApplicationCommandOptionType.Role:
                            values.push(interaction.options.getRole(option.name));
                            break;
                        case ApplicationCommandOptionType.User:
                            values.push(interaction.options.getUser(option.name));
                            break;
                        case ApplicationCommandOptionType.Mentionable:
                            values.push(interaction.options.getMentionable(option.name));
                            break;
                        default:
                            values.push(null);
                            logger.fatal(`${option.name} (type ${option.type})`, "Unrecognized option type:");
                    }
            }

            if (interaction.isCommand()) {
                let response = await handler.default(interaction, ...values);
                if (!response) return;

                if (typeof response === "string")
                    response = { embeds: [{ title: "Command Executed", description: response, color: 0x2b2d31 }], components: [], files: [] };

                response.ephemeral ??= true;

                await reply(interaction, response);
            } else {
                let response = await handler.autocomplete(interaction, ...values);
                if (!response) return;
                if (!Array.isArray(response)) response = [response];

                response = response.map((x: any) => (typeof x === "object" && "name" in x ? x : { name: `${x}`, value: x }));

                await interaction.respond(response);
            }
        } else if (interaction.isMessageComponent() || interaction.isModalSubmit()) {
            const id = interaction.customId;
            if (!id.startsWith(":")) return;

            let user = "",
                path: string,
                args: string[];

            if (interaction.isMessageComponent())
                if (id.match(/^:(\d{17,20})?:/)) [, user, path, ...args] = id.split(":");
                else return;
            else [, path, ...args] = id.split(":");

            if (user && interaction.user.id !== user) return;
            if (!path) return;

            let current = interactionHandlers;

            for (const node of path.split("/")) {
                if (!(node in current)) throw `This component has not been implemented yet (\`${path}\`).`;
                current = current[node];
            }

            let response = await current(interaction, ...args);
            if (!response) return;

            if (typeof response === "string")
                response = { embeds: [{ title: "Component Triggered", description: response, color: 0x2b2d31 }], components: [], files: [] };

            response.ephemeral ??= true;

            await reply(interaction, response);
        }
    } catch (error) {
        if (error instanceof Error) {
            logger.error(
                error,
                `Error handling interaction ${
                    interaction.isCommand() || interaction.isAutocomplete()
                        ? `/${interaction.commandName}${interaction.isAutocomplete() ? " [autocomplete]" : ""}`
                        : interaction.isMessageComponent()
                        ? `[${interaction.customId}]`
                        : "{unidentified}"
                }`,
            );

            await reply(interaction, {
                embeds: [
                    {
                        title: "Unexpected Error",
                        description: "An unexpected error occurred. If this issue persists, please inform a developer.",
                        color: Colors.Red,
                    },
                ],
                ephemeral: true,
            });
        } else if (typeof error === "string")
            await reply(interaction, { embeds: [{ title: "Error", description: error, color: Colors.Red }], components: [], files: [], ephemeral: true });
        else if (typeof error === "object") await reply(interaction, { embeds: [{ title: "Error", color: Colors.Red, ...error }], ephemeral: true });
    }
});

for (const key of Object.keys(eventHandlers)) {
    bot.on(key, (...args: any[]) => {
        for (const handler of eventHandlers[key]!) handler(...args);
    });

    logger.debug(`[DI] Registered events for type ${key}`);
}

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
            if (typeof error === "number") return new Response("{}", { status: error });
            if (Array.isArray(error) && typeof error[0] === "number") return new Response(JSON.stringify(error[1]), { status: error[0] });

            logger.error(error);
            return new Response("{}", { status: 500 });
        }

        return new Response("{}", { status: 404 });
    },
});

logger.debug("[DI] READY");
logger.debug("[DI] Preloading API users...");

for (const { id } of await api("GET /users")) {
    try {
        const user = await bot.users.fetch(id);
        logger.trace(`[DI] ${id} = ${user.tag}`);
    } catch {}
}

logger.debug("[DI] Done.")