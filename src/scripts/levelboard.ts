/**
 * @fileoverview Site-specific script for the level leaderboard page.
 */

import { ILevelLeaderboardEntry } from "../types/leaderboards.js";
import { ErrorObject } from "../types/miscellaneous.js";
import { isInViewport } from "../misc/global.js";
import { buildIcon } from "../iconkit/icon.js";
import { Level } from "../classes/Level.js";
import { Handlebars } from "../vendor/index.js";

/**
 * Fetch the leaderboard status for a level, and fill in the entries into the main box.
 */
function leaderboard() {
	if (loading == true) return;

	$('#error').hide();
	$('#searchBox').html(`<div style="height: 4.5%"></div>`);
	loading = true;
	$('#loading').show();

	fetch(`/api/level/${lvlID}`).then(lvl => lvl.json()).then((lvl: ErrorObject | Level) => {
		if ("error" in lvl) return $('#header').html("Nonexistent level " + lvlID);

		document.title = "Leaderboards for " + lvl.name;
		$('#header').html(lvl.name);
		$('#meta-title').attr('content', "Leaderboards for " + lvl.name);
		$('#meta-desc').attr('content', 'View the leaderboard for ' + lvl.name + ' by ' + lvl.author + '!');
	});

	fetch(`/api/leaderboardLevel/${lvlID}?count=200${weekly ? "&week" : ""}`).then(res => res.json()).then((res: ILevelLeaderboardEntry[] | ErrorObject) => {
		if (!res || "error" in res) {
			loading = false;
			$('#loading').hide();
			$('#lastWorked').html(res.error ? res.lastWorked + " ago": "Unknown");
			$('#error').show();
			return;
		}

		res.forEach((player) => {
			$("#searchBox").append(searchResultTemplate({
				rankScale: 1 - (Math.max(0, String(player.rank).length - 1) * 0.2),
				player,
				coinList: Array(player.coins).fill("coin :-)")
			}));
		});

		$('#searchBox').append('<div style="height: 4.5%"></div>');
		loading = false;
		$('#loading').hide();
		lazyLoadIcons();
	});
}

/**
 * Get rid of the `dontload` attribute on icons that have it and load them anyway.
 */
function lazyLoadIcons() {
	$('gdicon[dontload]').each(function() {
		if (isInViewport($(this))) {
			$(this).removeAttr('dontload');
			buildIcon($(this));
		}
	});
}

const searchResultTemplateString = await (await fetch("/templates/levelboard_searchResult.hbs")).text();
const searchResultTemplate = Handlebars.compile(searchResultTemplateString);

const lvlID = Math.round(+window.location.pathname.split('/')[2]);

let loading = false;
let weekly = false;

if (!lvlID || lvlID > 99999999 || lvlID < -99999999) {
	window.location.href = window.location.href.replace("leaderboard", "search");
}

leaderboard();

$('#topMode').on("click", function() {
	if (!weekly || loading) return;
	weekly = false;
	leaderboard();
	$('#weekMode').removeClass('darken');
	$('#topMode').addClass('darken');
});

$('#weekMode').on("click", function() {
	if (weekly || loading) return;
	weekly = true;
	leaderboard();
	$('#topMode').removeClass('darken');
	$('#weekMode').addClass('darken');
});

$('#searchBox').on("scroll", lazyLoadIcons);

export {};