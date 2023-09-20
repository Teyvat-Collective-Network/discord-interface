import { ButtonInteraction, Colors } from "discord.js";
import { ensureObserver } from "../../../lib/permissions.ts";
import { confirm } from "../../../lib/responses.ts";

export default async function (button: ButtonInteraction, id: string) {
    await ensureObserver(button);

    return {
        embeds: [
            {
                title: "Are you sure?",
                description:
                    "Deleting a poll cannot be undone. Doing so will purge all data related to the poll from the database entirely, including any votes.",
                color: Colors.Red,
            },
        ],
        ...confirm(`polls/confirm-delete:${id}`),
    };
}
