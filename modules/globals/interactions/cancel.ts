import { ButtonInteraction } from "discord.js";
import { greyButton } from "../../../lib/components.ts";

export default async function (button: ButtonInteraction) {
    await button.update({ components: greyButton("Action Canceled") });
}
