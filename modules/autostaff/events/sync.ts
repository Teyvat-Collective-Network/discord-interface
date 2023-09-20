import { Events, GuildMember } from "discord.js";
import { syncMemberAutostaff } from "../../../lib/autostaff.ts";

export const event = Events.GuildMemberUpdate;

export default async function (_: unknown, member: GuildMember) {
    await syncMemberAutostaff(member);
}
