import { embed } from "../../../lib/responses.ts";

export default async function () {
    return embed({
        title: "Election Help",
        description:
            "Elections are held as one of two types of votes. In the event that there are more candidates than available positions, it will be a ranked vote, and the input field title will say `Rank Candidates (1 = best)`. Otherwise, you will just vote for which candidates you want and don't want, and the input field will say `Select Favored Candidates`.\n\nIn both cases, the input field will be populated with the candidates' names followed by a colon. You should put your vote after each one of these colons.\n\nIf it is a ranked vote, rank the candidates you wish to vote in favor of starting from 1 being the best. Then, place a 0 next to candidates you wish to abstain on and -1 next to candidates you wish to vote against. For example, to rank A > B > C, abstain D, reject E, you would write the following:\n```\nA: 1\nB: 2\nC: 3\nD: 0\nE: -1\n```\n\nFor non-ranked votes, just put 1 next to candidates you wish to vote for, 0 to abstain, and -1 to vote against.\n\nIn both cases, the order of the lines themselves do not matter.",
    });
}
