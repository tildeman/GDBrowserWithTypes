import colors from "./sacredtexts/colors.json" assert { type: "json" }
import forms from "./sacredtexts/forms.json" assert { type: "json" }
import gameSheet from "./sacredtexts/gameSheet.json" assert { type: "json" }
import robotAnimations from "./sacredtexts/robotAnimations.json" assert { type: "json" }

import colorOrder from "./extradata/colorOrder.json" assert { type: "json" }
import hardcodedUnlocks from "./extradata/hardcodedUnlocks.json" assert { type: "json" }
import iconCredits from "./extradata/iconCredits.json" assert { type: "json" }
import shops from "./extradata/shops.json" assert { type: "json" }

import fs from "node:fs";
import { IconData } from "./icon.js"
// TODO: Move ExtraData out of `page_scripts`
import { ExtraData } from "../page_scripts/iconkit.js"

const previewIcons = fs.readdirSync('./iconkit/premade');
const newPreviewIcons = fs.readdirSync('./iconkit/newpremade');

const previewCounts = {};
previewIcons.forEach(x => {
	if (x.endsWith("_0.png")) return;
	const iconType = forms[x.split("_")[0]]?.form || "";
	if (!previewCounts[iconType]) previewCounts[iconType] = 1;
	else previewCounts[iconType]++;
});

const newIcons = fs.readdirSync('./iconkit/newicons');
const newIconCounts: Record<string, number> = {};
newIcons.forEach(x => {
	if (x.endsWith(".plist")) {
		newIcons.push(x.split("-")[0]);
		let formName = x.split(/_\d/g)[0];
		if (!newIconCounts[formName]) newIconCounts[formName] = 1;
		else newIconCounts[formName]++;
	}
});

// TODO: make a more rigorous type import model
export const sacredTexts: IconData = {
    forms,
    robotAnimations,
    colors,
    gameSheet,
    newIconCounts,
    newIcons
}

export const extraData: ExtraData = {
    colorOrder,
    hardcodedUnlocks,
    iconCredits,
    shops,
    previewIcons,
    newPreviewIcons
}