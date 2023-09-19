import { escapeHTML } from "bun";
import bot, { channels } from "../lib/bot.ts";
import { RouteMap } from "../lib/types.ts";
import { compare, components, severities } from "../lib/banshares.ts";
import { escapeMarkdown } from "discord.js";
import { createGist } from "../lib/gists.ts";
import logger from "../lib/logger.ts";

export default {
    async "POST /banshare"({ body }) {
        let ids: string = body.ids;

        const tags: string[] = [];
        if (!body.skipValidation) {
            for (const id of body.idList)
                try {
                    tags.push((await bot.users.fetch(id)).tag);
                } catch {
                    throw [400, { message: `Invalid ID: <code>${escapeHTML(id)}</code> did not correspond to a valid user.` }];
                }

            ids = body.idList.sort(compare).join(" ");
        }

        const user = await bot.users.fetch(body.author);

        const format = (ids: string, tags: string) => ({
            embeds: [
                {
                    title: "**Banshare**",
                    color: 0x2b2d31,
                    fields: [
                        { name: "ID(s)", value: ids },
                        ...(tags.length > 0 ? [{ name: "Username(s)", value: tags }] : []),
                        { name: "Reason", value: body.reason },
                        { name: "Evidence", value: body.evidence },
                        { name: "Submitted by", value: `<@${user.id}> (${escapeMarkdown(user.tag)}) from ${body.serverName}` },
                        { name: "Severity", value: severities[body.severity] },
                    ],
                },
            ],
        });

        let sendData = format(ids, escapeMarkdown(tags.join(" ")));

        if (
            sendData.embeds[0].title.length + sendData.embeds[0].fields.map((field) => field.name.length + field.value.length).reduce((x, y) => x + y) > 6000 ||
            sendData.embeds[0].fields.some((field) => field.value.length > 1024)
        ) {
            const iso = new Date().toISOString();
            sendData = format(`<${await createGist(`banshare-ids-${iso}`, `IDs for the banshare on ${iso}`, ids)}>`, "");
        }

        try {
            const post = await channels.BANSHARE_LOGS.send({ ...sendData, components: components(false, body.severity) });

            channels.EXEC_MANAGEMENT.send(
                `${body.urgent ? Bun.env.URGENT : Bun.env.NON_URGENT} A banshare was just posted in ${channels.BANSHARE_LOGS} for review${
                    body.urgent ? " (**urgent**)" : ""
                }. If you wish to alter the severity, use the buttons below the banshare **before** publishing.`,
            );

            return { message: post.id };
        } catch (error) {
            logger.error(error);
            throw 500;
        }
    },
} as RouteMap;
