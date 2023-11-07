/**
 * @fileoverview Site-specific script for the demon leaderboard page.
 */

import { Fetch } from "../misc/global.js";
import { ServerInfo } from "../types/servers.js";

const max = 250;
const trophies = [1, 5, 10, 25, 50, 100, max];

const demonID = Math.round(+window.location.pathname.split('/')[2]);
const illegal = (!demonID || demonID > max || demonID < 1);

if (demonID > 1) $('#pageDown').attr('href', `./${demonID - 1}`);
else $('#pageDown').hide();

if (demonID < max) $('#pageUp').attr('href', `./${demonID + 1}`);
else $('#pageUp').hide();

try {
	const server: ServerInfo = await Fetch(`/api/gdps?current=1`);
	if (illegal || !server.demonList) throw new Error("Server does not have a demon list!");

	// TODO: Define types for both
	const rawDemonStr = await fetch(`${server.demonList}api/v2/demons/listed?after=${demonID - 1}&before=${demonID + 1}`);
	const rawDemon = await rawDemonStr.json();
	if (!rawDemon || !rawDemon[0]) {
		throw new Error("Can't find the specified demon!");
	}
	const demonResStr = await fetch(`${server.demonList}api/v2/demons/${rawDemon[0].id}`);
	const demonRes = await demonResStr.json();
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

		$('#searchBox').append(`<div class="searchresult leaderboardSlot" style="align-items: center; padding-left: 1vh; height: 15%; width: 100%; position: relative;">

			<h2 class="center" style="width: 12%; margin: 0% 0% 0% 0.5%; transform: scale(${1 - (Math.max(0, String(recordIndex + 1).length - 1) * 0.2)}">${recordIndex + 1}</h2>
			<img class="inline spaced" src="/assets/trophies/${trophies.findIndex(z => recordIndex+1 <= z) + 1}.png" style="margin-bottom: 0%; height: 80%;">
			<h2 class="small gdButton" style="font-size: 6.5vh; margin-right: 3%; margin-left: 3%"><a href="/u/${demonEntry.player.name}">${demonEntry.player.name}</a></h2>
			<h3 class="lessSpaced" style="font-size: 4vh; margin-top: 1.3%; margin-right: 2%">${demonEntry.progress}%</h3>

			<div style="${!demonEntry.video ? "display: none; " : ""}position:absolute; margin-top: 1.5%; width: 12.5%; height: 90%; right: 0%;">
				<a target="_blank" href="${demonEntry.video}">
				<img class="gdButton inline spaced" src="/assets/${videoIcon}.png" style="height: 80%;">
				</a>
			</div>

		</div>`);
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