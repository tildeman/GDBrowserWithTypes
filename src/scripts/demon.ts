/**
 * @fileoverview Site-specific script for the demon leaderboard page.
 */

import { IListEntry, IListEntryOverview } from "../types/demonlist.js";
import { IServerInfo } from "../types/servers.js";
import { Fetch } from "../misc/global.js";
import { Handlebars } from "../vendor/index.js";

const searchResultTemplateString = await (await fetch("/templates/demon_searchResult.hbs")).text();
const searchResultTemplate = Handlebars.compile(searchResultTemplateString);

const max = 250;
const trophies = [1, 5, 10, 25, 50, 100, max];

const demonID = Math.round(+window.location.pathname.split('/')[2]);
const illegal = (!demonID || demonID > max || demonID < 1);

if (demonID > 1) $('#pageDown').attr('href', `./${demonID - 1}`);
else $('#pageDown').hide();

if (demonID < max) $('#pageUp').attr('href', `./${demonID + 1}`);
else $('#pageUp').hide();

try {
	const server: IServerInfo = await Fetch(`/api/gdps?current=1`);
	if (illegal || !server.demonList) throw new Error("Server does not have a demon list!");

	const rawDemonStr = await fetch(`${server.demonList}api/v2/demons/listed?after=${demonID - 1}&before=${demonID + 1}`);
	const rawDemon: IListEntryOverview = await rawDemonStr.json();
	if (!rawDemon || !rawDemon[0]) {
		throw new Error("Can't find the specified demon!");
	}
	const demonResStr = await fetch(`${server.demonList}api/v2/demons/${rawDemon[0].id}`);
	const demonRes: { data: IListEntry } = await demonResStr.json();
	const demon = demonRes.data;
	if (!demon.id) window.location.href = "/";

	document.title = "Demon Leaderboard for " + demon.name;
	$('#header').html(`${demon.name} <span class="smallerer" style="vertical-align: middle">(#${demonID})</span>`);
	$('#realLeaderboardLink').attr('href', `/leaderboard/${demon.level_id}`);
	$('#pointercrate').attr('href', `${server.demonList}demonlist/${demonID}`);

	$('#meta-title').attr('content', "Demon Leaderboard for " + demon.name);
	$('#meta-desc').attr('content', 'View the challengers and victors of' + demon.name);

	demon.records.forEach((demonEntry, recordIndex) => {
		let videoIcon = "site";
		if (demonEntry.video && demonEntry.video.includes("youtube.com")) videoIcon = "youtube";
		else if (demonEntry.video && demonEntry.video.includes("twitch.tv")) videoIcon = "twitch";

		$("#searchBox").append(searchResultTemplate({
			indexScale: 1 - (Math.max(0, String(recordIndex + 1).length - 1) * 0.2),
			oneBasedIndex: recordIndex + 1,
			trophyIcon: trophies.findIndex(trophyIndex => recordIndex + 1 <= trophyIndex) + 1,
			demonEntry,
			videoIcon
		}));
	});

	$('#searchBox').append('<div style="height: 4.5%"></div>');
}
finally { 
	$('#loading').hide();
}

$(document).on("keydown", function(k) {
	if (k.which == 37 && demonID > 1) window.location.href = $('#pageDown').attr('href') || "";	// left
	if (k.which == 39 && demonID < max) window.location.href = $('#pageUp').attr('href') || "";	// right
});

export {};