/**
 * @fileoverview Site-specific script for the Boomlings leaderboard page.
 */

import { IBoomlingsUser } from "../types/leaderboards.js";
import { ErrorObject } from "../types/miscellaneous.js";
import { Handlebars } from "../vendor/index.js";

const leaderboardEntryTemplateString = await (await fetch("/templates/boomlings_leaderboardEntry.hbs")).text();
const leaderboardEntryTemplate = Handlebars.compile(leaderboardEntryTemplateString);

$('#boomerbox').html('');
$('#loading').show();

fetch(`/api/boomlings`).then(res => res.json()).then((res: ErrorObject | IBoomlingsUser[]) => {
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