import { ButtonInteraction } from "discord.js";
import { confirm } from "../../../lib/responses.ts";
import { ensureObserver } from "../../../lib/permissions.ts";

export default async function (button: ButtonInteraction) {
    await ensureObserver(button);
    return confirm("banshares/confirm-publish");
}
