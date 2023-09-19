import { APIGuild, Guild, GuildMember, OAuth2Guild, PermissionFlagsBits, User } from "discord.js";
import api from "./api.ts";

type HasUser = string | User | GuildMember | { author: User } | { user: User };
type HasGuild = string | Guild | OAuth2Guild | { guild: Guild | APIGuild | OAuth2Guild };
type MightHaveGuild = string | Guild | OAuth2Guild | { guild?: Guild | APIGuild | OAuth2Guild } | {};

const getUserId = (object: HasUser) =>
    typeof object === "string"
        ? object
        : object instanceof User || object instanceof GuildMember
        ? object.id
        : "author" in object
        ? object.author.id
        : object.user.id;

const getGuildId = (object: HasGuild) =>
    typeof object === "string" ? object : object instanceof Guild || object instanceof OAuth2Guild ? object.id : object.guild.id;

const getGuildIdOrNull = (object: MightHaveGuild) =>
    typeof object === "string"
        ? object
        : object instanceof Guild || object instanceof OAuth2Guild
        ? object.id
        : "guild" in object
        ? object.guild?.id ?? null
        : null;

export async function ensureObserver(object: HasUser) {
    const id = getUserId(object);
    const user = await api(`GET /users/${id}`);

    if (!user.observer) throw "Permission denied (observers only).";
}

export async function ensureOwner(object: HasUser, guildObject?: HasGuild) {
    const id = getUserId(object);
    const user = await api(`GET /users/${id}`);

    if (user.observer) return;
    if (!guildObject && user.owner) return;
    if (guildObject && user.guilds[getGuildId(guildObject)]?.owner) return;

    throw "Permission denied (owner only).";
}

export async function ensureTCN(object: MightHaveGuild) {
    const id = getGuildIdOrNull(object);
    if (id === Bun.env.HUB) return;
    if (!id || (await api(`!GET /guilds/${id}`)).status === 404) throw "Permission denied (TCN servers only).";
}
