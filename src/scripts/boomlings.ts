/**
 * @fileoverview Site-specific script for the Boomlings leaderboard page.
 */

import { ErrorObject } from "../types/miscellaneous.js";
import { Handlebars } from "../vendor/index.js";

const leaderboardEntryTemplateString = await (await fetch("/templates/boomlings_leaderboardEntry.hbs")).text();
const leaderboardEntryTemplate = Handlebars.compile(leaderboardEntryTemplateString);

$('#boomerbox').html('');
$('#loading').show();

/**
 * Entry for the leaderboard in Boomlings (RobTop's discontinued game).
 */
interface BoomlingsLeaderboardEntry {
	boomling: string;
	name: string;
	level: number;
	score: number;
	powerups: [number, number, number];
	boomlingLevel: number;
	rank: number;
}

fetch(`/api/boomlings`).then(res => res.json()).then((res: ErrorObject | BoomlingsLeaderboardEntry[]) => {
	if ("error" in res) res = [];
	$('#boomerbox').html('');
	$('.ranking').remove();

	res.forEach((leaderboardItem) => {
		$('#boomerbox').append(leaderboardEntryTemplate({ leaderboardItem }));
	});

	$('#boomerbox').append('<div style="height: 4.5%"></div>');
	$('#loading').hide();
});

export {};