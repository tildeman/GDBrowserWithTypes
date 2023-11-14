/**
 * @fileoverview Independent script to parse property lists for achievements.
 */

const path = "/extra/";

const files = ["AchievementsDesc", "AchievementsDescMD", null, "AchievementsDescSZ"];
const gameNames = ["gd", "meltdown", "world", "subzero"];
const achString = "geometry.ach.";
const rewardTypes = { color: "color1", icon: "cube", bird: "ufo", dart: "wave", special: "trail", death: "deathEffect" };
const games = { "md": "meltdown", "world.": "world", "subzero.": "subzero" };

import plist from 'plist';
import fs from 'node:fs';

let achArray: { id: string, game: string, trueID: string }[] = [];

files.forEach((file, fileNum) => {
	if (!file) return;
	let data = plist.parse(fs.readFileSync(path + file + '.plist', 'utf8'));

	console.log(`Converting ${file}.plist...`)

	for (const key in (data as any)) {
		if (!achArray.find(x => x.trueID == key)) {
			const fileData = data[key];
			const reward = fileData.icon ? fileData.icon.split("_") : [];
			const achObj = {
				id: key.slice(achString.length),
				game: gameNames[fileNum],
				name: fileData.title,
				rewardType: rewardTypes[reward[0]] || reward[0] || "misc",
				rewardID: +reward[1] || -1,
				description: fileData.unachievedDescription,
				achievedDescription: fileData.achievedDescription,
				trueID: key
			};
			Object.keys(games).forEach(x => {
				if (key.startsWith(achString + x)) achObj.game = games[x];
			});
			if (key == achString + "rate") achObj.id = "rating";
			if (achObj.id.startsWith("subzero.coins")) achObj.id = achObj.id.replace("subzero.coins", "szcoin");
			if (achObj.id.includes("demoncoin")) achObj.id = achObj.id.replace("demoncoin", "ultimatedemon");
			achArray.push(achObj);
		}
	}
});

achArray = achArray.filter(x => !x.id.startsWith("lite"));
let final = achArray.filter(x => x.game == "gd");
gameNames.slice(1).forEach(g => final = final.concat(achArray.filter(x => x.game == g)));

fs.writeFileSync('./parsed/achievements.json', JSON.stringify(final, null, 2).replace(/\[\n.+?(-?\d+),\n.+?(-?\d+)\n.+]/g, "[$1, $2]")); // regex to make it easier to read
console.log("Successfully parsed!");