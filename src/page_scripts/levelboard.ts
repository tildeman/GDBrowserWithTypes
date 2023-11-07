/**
 * @fileoverview Site-specific script for the level leaderboard page.
 */

import { ILeaderboardEntry } from "../types/leaderboards.js";
import { isInViewport } from "../misc/global.js";
import { buildIcon } from "../iconkit/icon.js";
import { Level } from "../classes/Level.js";

let loading = false;
const lvlID = Math.round(+window.location.pathname.split('/')[2]);

if (!lvlID || lvlID > 99999999 || lvlID < -99999999) {
	window.location.href = window.location.href.replace("leaderboard", "search");
}

/**
 * Fetch the leaderboard status for a level, and fill in the entries into the main box.
 */
function leaderboard() {
	if (loading == true) return;

	$('#error').hide();
	$('#searchBox').html(`<div style="height: 4.5%"></div>`);
	loading = true;
	$('#loading').show();

	fetch(`/api/level/${lvlID}`).then(lvl => lvl.json()).then((lvl: "-1" | Level) => {
		if (lvl == "-1") return $('#header').html("Nonexistent level " + lvlID);

		document.title = "Leaderboards for " + lvl.name;
		$('#header').html(lvl.name);
		$('#meta-title').attr('content', "Leaderboards for " + lvl.name);
		$('#meta-desc').attr('content', 'View the leaderboard for ' + lvl.name + ' by ' + lvl.author + '!');
	});

	fetch(`/api/leaderboardLevel/${lvlID}?count=200${weekly ? "&week" : ""}`).then(res => res.json()).then(res => {
		if (!res || res.error || res == "-1") {
			loading = false;
			$('#loading').hide();
			$('#lastWorked').html(res.error ? res.lastWorked + " ago": "Unknown");
			$('#error').show();
			return;
		}

		res.forEach((player: ILeaderboardEntry) => {
			$('#searchBox').append(`<div class="searchResult leaderboardSlot levelboardSlot" style="align-items: center; padding-left: 1vh; height: 15%; width: 100%; position: relative">

				<h2 class="center" style="width: 12%; margin: 0% 0% 0% 0.5%; transform: scale(${1 - (Math.max(0, String(player.rank).length - 1) * 0.2)}">${player.rank}</h2>
				<gdicon dontload="true" iconID=${player.icon.icon} cacheID=${player.playerID} iconForm="${player.icon.form}" col1="${player.icon.col1}" col2="${player.icon.col2}" glow="${player.icon.glow}" style="width: 7%; margin-bottom: 1%" imgStyle="width: 100%"></gdicon>
				<h2 class="small gdButton" style="font-size: 6.5vh; margin-right: 3%; margin-left: 3%"><a href="/u/${player.accountID}.">${player.username}</a></h2>
				<h3 class="lessSpaced" style="margin-top: 1.3%; margin-right: 2%">${player.percent}%</h3>
				${'<div style="width: 2%"><img class="valign" src="/assets/silvercoin.png" style="height: 6vh"></div>'.repeat(player.coins)}

				<div class="center" style="text-align: right; position:absolute; right: 1.25%; height: 10%; width: 12.5%; top: 100%;">
					<p class="commentDate">${player.date}</p>
				</div>

			</div>`);
		});

		$('#searchBox').append('<div style="height: 4.5%"></div>');
		loading = false;
		$('#loading').hide();
		lazyLoadIcons();
	});
}

let weekly = false;
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

$('#searchBox').on("scroll", lazyLoadIcons);

export {};