/**
 * @fileoverview Site-specific script for the map pack listing page.
 */

import { IMapPackEntry } from "../types/mappacks.js";

fetch('/api/mappacks').then(res => res.json()).then((packs: IMapPackEntry[]) => {
	$('#loading').hide();
	packs.forEach(packItem => {
		$('#packList').append(`
			<div class="mappack">
			<a href="/search/${packItem.levels.join(",")}?list&header=${encodeURIComponent(packItem.name)}">
			<img src="/assets/difficulties/${packItem.difficulty}.png" style="width: 42%"><br>
			<h3 class="gauntletText"">${packItem.name.replace("Pack", "<br>Pack")}<br>
			<span style="color: rgb(${packItem.textColor})">${packItem.stars}</span><img class="valign" src="/assets/star.png" style="cursor: help; width: 14%; margin-left: 2%; transform: translateY(-10%);" title="Stars">
			<span style="color: rgb(${packItem.barColor})">${packItem.coins}</span><img class="valign" src="/assets/coin.png" style="cursor: help; width: 14%; margin-left: 2%; transform: translateY(-10%);" title="Secret Coins">
			</h3></div></a>`);
	});
});

export {};