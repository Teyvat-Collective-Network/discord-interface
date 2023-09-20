import { Events, GuildMember } from "discord.js";
import { sweepInvites } from "../../../lib/internals.ts";

export const event = Events.GuildMemberAdd;

export default async function (member: GuildMember) {
    if (member.guild.id === Bun.env.HQ) await sweepInvites();
}
