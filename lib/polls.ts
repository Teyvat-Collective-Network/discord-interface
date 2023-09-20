import { ActionRowData, ButtonStyle, ComponentType, MessageActionRowComponentData, MessageComponentInteraction, ModalSubmitInteraction } from "discord.js";
import api from "./api.ts";
import { greyButton } from "./components.ts";
import { embed } from "./responses.ts";
import { MessageLike } from "./types.ts";

type Poll = {
    id: number;
    duration: number;
    close: number;
    closed: boolean;
    dm: boolean;
    live: boolean;
    restricted: boolean;
    quorum: number;
    voters?: string[];
} & (
    | { mode: "induction"; preinduct: boolean; server: string }
    | { mode: "proposal"; question: string }
    | { mode: "election"; wave: number; seats: number; candidates: string[] }
    | { mode: "selection"; question: string; min: number; max: number; options: string[] }
);

type PollVote = {
    poll: number;
    user: string;
    mode: "induction" | "proposal" | "election" | "selection";
    missing: boolean;
    abstain: boolean;
    yes: boolean;
    verdict: string;
    ranked: string[];
    countered: string[];
    abstained: string[];
    selected: string[];
};

export async function getVoters(restricted: boolean): Promise<string[]> {
    const users = await api(`GET /users`);

    return users.filter((user: any) => (restricted ? user.owner : user.council)).map((user: any) => user.id);
}

export function pollComponents(id: number, closed: boolean): ActionRowData<MessageActionRowComponentData>[] {
    return [
        {
            type: ComponentType.ActionRow,
            components: [
                {
                    type: ComponentType.Button,
                    style: ButtonStyle.Secondary,
                    customId: `::polls/vote/abstain:${id}`,
                    label: "Abstain",
                    disabled: closed,
                },
                {
                    type: ComponentType.Button,
                    style: ButtonStyle.Secondary,
                    customId: `::polls/view-vote:${id}`,
                    label: "View Your Vote",
                },
                {
                    type: ComponentType.Button,
                    style: ButtonStyle.Link,
                    url: `${Bun.env.WEBSITE}/vote/edit/${id}`,
                    label: "Edit Poll",
                },
                {
                    type: ComponentType.Button,
                    style: ButtonStyle.Danger,
                    customId: `::polls/delete:${id}`,
                    label: "Delete",
                },
            ],
        },
    ];
}

export async function displayPoll(poll: Poll): Promise<MessageLike> {
    const voters = poll.voters ?? (await getVoters(poll.restricted));
    const votes = ((await api(`GET /polls/${poll.id}/votes`)) as PollVote[]).filter((vote) => voters.includes(vote.user));

    const turnout = ((votes.length ?? 0) * 100) / voters.length;

    const valid = turnout >= poll.quorum;

    let abstain = -1;
    let results = "";

    let question =
        poll.mode === "induction"
            ? `Induct ${poll.server}?`
            : poll.mode === "proposal"
            ? poll.question
            : poll.mode === "election"
            ? `Wave ${poll.wave} Election`
            : poll.question;

    if (poll.live || (poll.closed && valid)) {
        abstain = votes.filter((vote) => vote.abstain).length;
        const ballots = votes.filter((vote) => !vote.abstain);
        const ballotCount = ballots.length;

        if (poll.mode === "induction") {
            let inductNow = 0,
                inductLater = 0,
                reject = 0,
                extend = 0;
            for (const vote of ballots)
                if (vote.verdict === "induct-now") inductNow++;
                else if (vote.verdict === "induct-later")
                    if (poll.preinduct) inductLater++;
                    else inductNow++;
                else if (vote.verdict === "reject") reject++;
                else if (vote.verdict === "extend") extend++;

            results = `- Induct${poll.preinduct ? " Now" : ""}: ${inductNow}${
                poll.preinduct ? `\n- Induct Later: ${inductLater}` : ""
            }\n- Reject: ${reject}\n- Extend: ${extend}\n\n`;

            const ratio = inductNow + inductLater + reject + extend > 0 ? (inductNow + inductLater) / (inductNow + inductLater + reject + extend || 1) : 0.5;

            if (ratio > 0.4 && ratio < 0.6) results += "Approval and non-approval are too close and therefore count as a tie. A full re-vote is required.";
            else if (inductNow + inductLater > reject + extend) {
                const subratio = inductNow / (inductNow + inductLater || 1);

                if (subratio > 0.4 && subratio < 0.6)
                    results += `${poll.server} was approved, but induction timing was a tie. A re-vote between these two options is required.`;
                else if (inductNow > inductLater) results += `${poll.server} was approved for induction!`;
                else results += `${poll.server} was approved to be inducted upon official confirmation of their mascot's playability.`;
            } else {
                const subratio = reject / (reject + extend || 1);

                if (subratio > 0.4 && subratio < 0.6)
                    results += `${poll.server} was not approved, but whether to reject or extend was a tie. A re-vote between these two options is required.`;
                else if (reject > extend) results += `${poll.server} was rejected.`;
                else results += `The verdict is to extend observation for ${poll.server}. A new observer will carry out another 28 days of observation.`;
            }
        } else if (poll.mode === "proposal") {
            let yes = 0,
                no = 0;

            for (const vote of ballots)
                if (vote.yes) yes++;
                else no++;

            results = `${yes} :arrow_up: `;

            if (yes || no) {
                const green = (yes * 10) / (ballotCount || 1);
                results += ":green_square:".repeat(green) + ":red_square:".repeat(10 - green);
            } else results += ":white_large_square:".repeat(10);

            results += ` :arrow_down: ${no}`;

            const approval = yes + no > 0 ? (yes / (yes + no)) * 100 : 50;

            results += `\n\n(Approval: ${approval.toFixed(2)}%${approval > 40 && approval < 60 ? " - tie" : ""})`;
        } else if (poll.mode === "election") {
            const points: Record<string, number> = poll.candidates.reduce((o, x) => ({ ...o, [x]: 0 }), {});
            const disapproval = structuredClone(points);

            for (const vote of ballots) {
                vote.ranked.forEach((x, i) => (points[x] += poll.seats < poll.candidates.length ? poll.candidates.length - i : 1));
                vote.countered.forEach((x) => disapproval[x]++);
            }

            const eligible = poll.candidates.filter((x) => disapproval[x] * 2 <= ballotCount);
            eligible.sort((x, y) => points[y] - points[x]);

            let elected: string[];
            let tie: string[] = [];

            if (eligible.length > poll.seats && points[eligible[poll.seats - 1]] === points[eligible[poll.seats]]) {
                elected = eligible.filter((x) => points[x] > points[eligible[poll.seats]]);
                tie = eligible.filter((x) => points[x] === points[eligible[poll.seats]]);
            } else elected = eligible.slice(0, poll.seats);

            results = `Elected candidates in arbitrary order: ${elected
                .sort()
                .map((x) => `<@${x}>`)
                .join(" ")}${
                tie.length > 0
                    ? `\n\nThere was a tie between the following candidates for the remaining seat${elected.length === poll.seats - 1 ? "" : "s"}: ${tie
                          .sort()
                          .map((x) => `<@${x}>`)
                          .join(" ")}`
                    : ""
            }`;
        } else if (poll.mode === "selection") {
            const totals: Record<string, number> = poll.options.reduce((o, x) => ({ ...o, [x]: 0 }), {});
            for (const vote of ballots) for (const x of vote.selected) totals[x]++;

            results = poll.options
                .map(
                    (x, i) =>
                        `\`${"ABCDEFGHIJ"[i]}\` ${"█".repeat((totals[x] * 20) / (ballotCount || 1)).padEnd(20, "░")} (${(
                            (totals[x] * 100) /
                            (ballotCount || 1)
                        ).toFixed(2)}%)`,
                )
                .join("\n");
        }
    } else if (poll.closed) results = "Results are hidden because this poll failed to reach quorum. An observer needs to restart it.";
    else results = "Results are hidden until this poll concludes.";

    return {
        embeds: [
            {
                title: `${turnout.toFixed(2)}% Turnout Reached`,
                description: question,
                color: 0x2b2d31,
                fields: [
                    ...(poll.mode === "selection" ? [{ name: "Options", value: poll.options.map((x, i) => `- \`${"ABCDEFGHIJ"[i]}\`: ${x}`).join("\n") }] : []),
                    { name: "Results", value: results },
                    { name: "Deadline", value: `<t:${Math.floor(poll.close / 1000)}:F>` },
                    {
                        name: "Details",
                        value: `- ${poll.restricted ? "This poll is restricted to designated voters." : "This poll is open to all council members."}`,
                    },
                ],
                footer: abstain === -1 ? undefined : { text: `${abstain} ${abstain === 1 ? "person" : "people"} abstained.` },
            },
        ],
        components: [
            ...pollComponents(poll.id, poll.closed),
            poll.mode === "induction"
                ? {
                      type: ComponentType.ActionRow,
                      components: [
                          {
                              type: ComponentType.StringSelect,
                              customId: `::polls/vote/induction:${poll.id}`,
                              disabled: poll.closed,
                              options: [
                                  { value: "induct-now", label: `Induct${poll.preinduct ? " Now" : ""}`, emoji: "🟩" },
                                  ...(poll.preinduct ? [{ value: "induct-later", label: "Induct Later", emoji: "🟨" }] : []),
                                  { value: "reject", label: "Reject", emoji: "🟥" },
                                  { value: "extend", label: "Extend Observation", emoji: "🟪" },
                              ],
                          },
                      ],
                  }
                : poll.mode === "proposal"
                ? {
                      type: ComponentType.ActionRow,
                      components: [
                          {
                              type: ComponentType.Button,
                              customId: `::polls/vote/yes:${poll.id}`,
                              style: ButtonStyle.Success,
                              emoji: "⬆️",
                              disabled: poll.closed,
                          },
                          {
                              type: ComponentType.Button,
                              customId: `::polls/vote/no:${poll.id}`,
                              style: ButtonStyle.Danger,
                              emoji: "⬇️",
                              disabled: poll.closed,
                          },
                      ],
                  }
                : poll.mode === "election"
                ? {
                      type: ComponentType.ActionRow,
                      components: [
                          {
                              type: ComponentType.Button,
                              customId: `::polls/vote/election:${poll.id}`,
                              style: ButtonStyle.Success,
                              label: "Open Voting Modal",
                              disabled: poll.closed,
                          },
                          { type: ComponentType.Button, customId: "::polls/election-help", style: ButtonStyle.Primary, label: "Election Help" },
                      ],
                  }
                : poll.mode === "selection"
                ? {
                      type: ComponentType.ActionRow,
                      components: [
                          {
                              type: ComponentType.StringSelect,
                              customId: `::polls/vote/selection:${poll.id}`,
                              disabled: poll.closed,
                              options: poll.options.map((x, i) => ({
                                  value: x,
                                  label: x,
                                  emoji: ["🇦", "🇧", "🇨", "🇩", "🇪", "🇫", "🇬", "🇭", "🇮", "🇯"][i],
                              })),
                              minValues: poll.min,
                              maxValues: poll.max,
                          },
                      ],
                  }
                : greyButton("...")[0],
        ],
    };
}

export function displayVote(vote: PollVote): MessageLike {
    if (vote.missing) return embed({ title: "Vote Missing", description: "You have not voted on this poll." });
    if (vote.abstain) return embed({ title: "Abstained", description: "You have __abstained__ on this poll." });

    switch (vote.mode) {
        case "induction":
            return embed({
                title: { reject: "Reject", extend: "Extend Observation", "induct-now": "Induct", "induct-later": "Induct Later" }[vote.verdict],
                description: `You have voted to ${
                    {
                        reject: "__reject__ the server",
                        extend: "__extend__ the server's observation",
                        "induct-now": "__induct__ the server",
                        "induct-later": "__induct__ the server __later__ (on official confirmation of their mascot's playability)",
                    }[vote.verdict]
                }.`,
            });
        case "proposal":
            return embed({ title: vote.yes ? "Approve" : "Oppose", description: `You have voted __in ${vote.yes ? "favor" : "opposition"}__ of the motion.` });
        case "election":
            return embed({
                title: "Election Vote",
                description: `Here is your election vote:\n${vote.ranked.map((x, i) => `\`${i + 1}.\` <@${x}>`).join("\n")}${
                    vote.countered.length > 0 ? `\nCounter-votes: ${vote.countered.map((x) => `<@${x}>`).join(", ")}` : ""
                }${vote.abstained.length > 0 ? `\nAbstained: ${vote.abstained.map((x) => `<@${x}>`).join(", ")}` : ""}`,
            });
        case "selection":
            return embed({
                title: "Your Vote",
                description:
                    vote.selected.length === 0
                        ? "You did not vote for any options."
                        : `You voted for the following option${vote.selected.length === 1 ? "" : "s"}:\n${vote.selected.map((x) => `- ${x}`).join("\n")}`,
            });
    }
}

export async function applyVote(component: MessageComponentInteraction | ModalSubmitInteraction, id: string, data: any) {
    if (!component.deferred && !component.replied) await component.deferReply({ ephemeral: true });

    const req = await api(`!PUT /polls/${id}/vote/di`, { ...data, user: component.user.id });
    if (!req.ok) throw (await req.json()).message;

    return displayVote(await req.json());
}
