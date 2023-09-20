import { User } from "discord.js";
import api from "../lib/api.ts";
import bot, { channels, hq } from "../lib/bot.ts";
import { sweepInvites } from "../lib/internals.ts";

async function monitor() {
    const alerts: [string, any][] = [];
    const guilds = await api("GET /guilds");

    for (const guild of guilds)
        try {
            const invite = await bot.fetchInvite(guild.invite);
            if (invite.guild?.id !== guild.id) throw 0;
        } catch {
            alerts.push(["invite", guild]);
        }

    const expected = new Set<string>();

    for (const { owner, advisor } of guilds) {
        if (owner) expected.add(owner);
        if (advisor) expected.add(advisor);
    }

    for (const [, member] of await hq.members.fetch())
        if (!member.user.bot && !expected.has(member.id))
            try {
                const user = await api(`GET /users/${member.id}`);
                if (!user.roles.includes("guest")) throw 0;
            } catch {
                alerts.push(["unauthorized", member]);
            }

    const rep: Record<string, { user: User; positions: string[] }> = {};

    for (const guild of guilds) {
        if (!guild.owner) alerts.push(["missing-owner", guild]);
        if (guild.delegated && !guild.advisor) alerts.push(["faulty-delegation", guild]);

        for (const [id, role] of [
            [guild.owner, "server owner"],
            [guild.advisor, "council advisor"],
        ])
            if (id) {
                try {
                    if (!rep[id]) {
                        const user = await bot.users.fetch(id);
                        rep[id] = { user, positions: [] };
                    }

                    rep[id].positions.push(`${guild.name} (\`${guild.id}\`) ${role}`);
                } catch {}

                try {
                    await hq.members.fetch(id);
                } catch {
                    try {
                        const user = await bot.users.fetch(id);
                        alerts.push(["missing", { guild, user, role }]);
                    } catch {
                        alerts.push(["invalid-id", { guild, id, role }]);
                    }
                }
            }

        for (const id of Object.keys(rep)) if (rep[id].positions.length > 1) alerts.push(["duplicate", rep[id]]);

        const lines = [];

        for (const [key, item] of alerts)
            if (key === "invite") lines.push(`- invalid invite / invite points elsewhere for ${item.name} (\`${item.id}\`): https://discord.gg/${item.invite}`);
            else if (key === "unauthorized") lines.push(`- member in the server is not in the council or a guest: ${item} (\`${item.id}\`)`);
            else if (key === "missing-owner") lines.push(`- ${item.name} (\`${item.id}\`) is missing a server owner`);
            else if (key === "missing-voter") lines.push(`- ${item.name} (\`${item.id}\`) is missing a voter`);
            else if (key === "invalid-voter") lines.push(`- voter for ${item.name} (\`${item.id}\`) is neither its owner nor its advisor`);
            else if (key === "missing") lines.push(`- ${item.role} for ${item.guild.name} is missing from the server: ${item.user} (\`${item.user.id}\`)`);
            else if (key === "invalid-id") lines.push(`- ${item.role} for ${item.guild.name} corresponds to an invalid ID: \`${item.id}\``);
            else if (key === "duplicate") lines.push(`- ${item.user} (\`${item.user.id}\`) has multiple council positions: ${item.positions.join(", ")}`);

        if (lines.length === 0) return;

        let texts = ["Server/API issues or discrepancies detected:"];

        for (const line of lines)
            if (texts.at(-1)!.length + line.length + 1 <= 2000) texts[texts.length - 1] += `\n${line}`;
            else texts.push(line);

        for (const text of texts) await channels.EXEC_MANAGEMENT.send(text);
    }
}

const CYCLE = 24 * 60 * 60 * 1000;
setTimeout(() => setInterval(monitor, CYCLE), CYCLE - (Date.now() % CYCLE));

sweepInvites();
