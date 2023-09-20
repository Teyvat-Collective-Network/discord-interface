import { Events, GuildMember } from "discord.js";
import { syncMemberAutoroles } from "../../../lib/autoroles.ts";

export const event = Events.GuildMemberUpdate;

export default async function (_: unknown, member: GuildMember) {
    await syncMemberAutoroles(member);
}
