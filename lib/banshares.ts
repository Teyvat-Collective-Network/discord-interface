import { ActionRowData, ButtonStyle, ComponentType, MessageActionRowComponentData, MessageCreateOptions, User } from "discord.js";
import api from "./api.ts";
import bot, { channels } from "./bot.ts";
import { greyButton } from "./components.ts";
import { MessageLike } from "./types.ts";

export function compare(a: string, b: string): number {
    if (!a.match(/^\d+$/))
        if (!b.match(/^\d+$/)) return a.localeCompare(b);
        else return -1;
    else if (!b.match(/^\d+$/)) return 1;

    const diff = BigInt(a) - BigInt(b);
    return diff > 0 ? 1 : diff < 0 ? -1 : 0;
}

export const severities: Record<string, string> = {
    P0: "P0",
    P1: "P1",
    P2: "P2",
    DM: "DM Scam",
};

export function components(published: boolean, severity: string): any[] {
    return published
        ? [
              {
                  type: ComponentType.ActionRow,
                  components: [
                      {
                          type: ComponentType.Button,
                          style: ButtonStyle.Danger,
                          customId: "::banshares/rescind",
                          label: "Rescind",
                      },
                  ],
              },
          ]
        : [
              {
                  type: ComponentType.ActionRow,
                  components: [
                      {
                          type: ComponentType.Button,
                          style: ButtonStyle.Secondary,
                          customId: "::banshares/change-severity:DM",
                          label: "SEV: DM Scam",
                          disabled: severity === "DM",
                      },
                      {
                          type: ComponentType.Button,
                          style: ButtonStyle.Secondary,
                          customId: "::banshares/change-severity:P2",
                          label: "SEV: P2",
                          disabled: severity === "P2",
                      },
                      {
                          type: ComponentType.Button,
                          style: ButtonStyle.Primary,
                          customId: "::banshares/change-severity:P1",
                          label: "SEV: P1",
                          disabled: severity === "P1",
                      },
                      {
                          type: ComponentType.Button,
                          style: ButtonStyle.Danger,
                          customId: "::banshares/change-severity:P0",
                          label: "SEV: P0",
                          disabled: severity === "P0",
                      },
                  ],
              },
              {
                  type: ComponentType.ActionRow,
                  components: [
                      {
                          type: ComponentType.Button,
                          style: ButtonStyle.Success,
                          customId: "::banshares/publish",
                          label: "Publish",
                      },
                      {
                          type: ComponentType.Button,
                          style: ButtonStyle.Danger,
                          customId: "::banshares/reject",
                          label: "Reject",
                      },
                  ],
              },
          ];
}

export function displaySettings(settings?: { blockdms: boolean; nobutton: boolean; daedalus: boolean; autoban: number }): MessageLike {
    const { blockdms, nobutton, daedalus, autoban } = settings ?? { blockdms: false, nobutton: false, daedalus: false, autoban: 0 };

    return {
        embeds: [
            {
                title: "Banshare Settings",
                color: 0x2b2d31,
                fields: [
                    {
                        name: "Block DMs",
                        value: `${blockdms ? "Disable" : "Enable"} this setting to ${
                            blockdms ? "continue" : "stop"
                        } receiving banshares with the DM Scam severity.`,
                    },
                    {
                        name: "No Button",
                        value: `${nobutton ? "Disable" : "Enable"} this setting to ${
                            nobutton ? "enable" : "remove"
                        } the ban button (added to banshares that aren't automatically executed to allow mods to execute the banshare with one click).`,
                    },
                    {
                        name: "Daedalus",
                        value: `${daedalus ? "Disable" : "Enable"} this setting to ${daedalus ? "stop adding" : "add"} banshares into Daedalus user history.`,
                    },
                    {
                        name: "Autoban",
                        value: "Use the dropdown menu to control autoban thresholds.",
                    },
                ],
            },
        ],
        components: [
            {
                type: ComponentType.ActionRow,
                components: (
                    [
                        ["blockdms", "Block DMs"],
                        ["nobutton", "No Button"],
                        ["daedalus", "Daedalus"],
                    ] as const
                ).map(([key, label]) => ({
                    type: ComponentType.Button,
                    style: settings?.[key] ? ButtonStyle.Success : ButtonStyle.Danger,
                    customId: `::banshares/settings/toggle:${key}:${settings?.[key] ? "off" : "on"}`,
                    label: `${label}: ${settings?.[key] ? "on" : "off"}`,
                })),
            },
            {
                type: ComponentType.ActionRow,
                components: [
                    {
                        type: ComponentType.StringSelect,
                        customId: "::banshares/settings/autoban",
                        minValues: 0,
                        maxValues: 8,
                        options: ["non-members", "members"]
                            .flatMap((category) => ["P0", "P1", "P2", "DM Scams"].map((severity) => `${severity} against ${category}`))
                            .map((label, index) => ({ label, value: `${1 << index}`, default: !!(autoban & (1 << index)) })),
                    },
                ],
            },
        ],
        ephemeral: true,
    };
}

export function crosspostComponents(id: string): ActionRowData<MessageActionRowComponentData>[] {
    return [
        {
            type: ComponentType.ActionRow,
            components: [
                {
                    type: ComponentType.Button,
                    style: ButtonStyle.Danger,
                    customId: `::banshares/report/show:${id}`,
                    label: "Report",
                },
            ],
        },
    ];
}

export function banButton(id: string): ActionRowData<MessageActionRowComponentData>[] {
    return [
        {
            type: ComponentType.ActionRow,
            components: [{ type: ComponentType.Button, style: ButtonStyle.Danger, customId: `::banshares/execute:${id}`, label: "Execute" }],
        },
    ];
}

export function executedButton(partial: boolean) {
    return greyButton(partial ? "Partially Executed" : "Executed");
}

export async function logExecution(guildId: string, origin: string, reason: string, banned: User[], failed: User[], invalid: string[]) {
    const prefix = `Banshare executed: banned ${banned.length} user${banned.length === 1 ? "" : "s"}.\nOrigin: ${origin}\nReason: ${reason}`;

    const text = `${prefix}\nSuccess: ${banned.join(", ") || "(none)"}\nFailed: ${failed.join(", ") || "(none)"}\nInvalid IDs: ${
        invalid.map((id) => `\`${id}\``).join(", ") || "(none)"
    }`;

    const logData: MessageCreateOptions =
        text.length <= 2000
            ? { content: text }
            : {
                  content: prefix,
                  files: [
                      {
                          name: "banshare.txt",
                          attachment: Buffer.from(
                              `Success: ${banned.map((x) => `${x.tag} (${x.id})`).join(", ") || "(none)"}\nFailed: ${
                                  failed.map((x) => `${x.tag} (${x.id})`).join(", ") || "(none)"
                              }\nInvalid IDs: ${invalid.join(", ") || "(none)"}`,
                              "utf-8",
                          ),
                      },
                  ],
              };

    for (const id of await api(`GET /banshares/${guildId}/logs`)) {
        try {
            const log = await bot.channels.fetch(id);
            if (!log?.isTextBased()) continue;

            await log.send(logData);
        } catch {}
    }
}

export async function updateDashboard() {
    const message = (await channels.BANSHARE_DASHBOARD.messages.fetch({ limit: 1 })).first();

    const pending: string[] = [];

    for (const id of await api(`GET /banshares/pending`)) {
        try {
            await channels.BANSHARE_LOGS.messages.fetch(id);
            pending.push(id);
        } catch {
            await api(`DELETE /banshares/${id}`);
        }
    }

    const data = pending.map((x) => `- ${channels.BANSHARE_LOGS.url}/${x}`).join("\n") || "No banshares are pending!";

    if (message) await message.edit(data);
    else await channels.BANSHARE_DASHBOARD.send(data);
}
