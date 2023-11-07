import robotAnimations from "./sacredtexts/robotAnimations.json" assert { type: "json" };
import gameSheet from "./sacredtexts/gameSheet.json" assert { type: "json" };
import colors from "./sacredtexts/colors.json" assert { type: "json" };
import forms from "./sacredtexts/forms.json" assert { type: "json" };

import hardcodedUnlocks from "./extradata/hardcodedUnlocks.json" assert { type: "json" };
import iconCredits from "./extradata/iconCredits.json" assert { type: "json" };
import colorOrder from "./extradata/colorOrder.json" assert { type: "json" };
import shops from "./extradata/shops.json" assert { type: "json" };

import { IExtraData, IIconData } from "../types/icons.js";
import { __dirname } from "../lib/templateHandle.js";
import { resolve } from "node:path";
import fs from "node:fs";

const previewIcons = fs.readdirSync(resolve(__dirname, 'iconkit/premade'));
const newPreviewIcons = fs.readdirSync(resolve(__dirname, 'iconkit/newpremade'));

const previewCounts = {};
previewIcons.forEach(iconFileName => {
	if (iconFileName.endsWith("_0.png")) return;
	const iconType = forms[iconFileName.split("_")[0]]?.form || "";
	if (!previewCounts[iconType]) previewCounts[iconType] = 1;
	else previewCounts[iconType]++;
});

const newIcons = fs.readdirSync(resolve(__dirname, 'iconkit/newicons'));
const newIconCounts: Record<string, number> = {};
newIcons.forEach(iconFileName => {
	if (iconFileName.endsWith(".plist")) {
		newIcons.push(iconFileName.split("-")[0]);
		let formName = iconFileName.split(/_\d/g)[0];
		if (!newIconCounts[formName]) newIconCounts[formName] = 1;
		else newIconCounts[formName]++;
	}
});

export const sacredTexts: IIconData = {
    forms,
    robotAnimations,
    colors,
    gameSheet,
    newIconCounts,
    newIcons
}

export const extraData: IExtraData = {
    colorOrder,
    hardcodedUnlocks,
    iconCredits,
    shops,
    previewIcons,
    newPreviewIcons
}