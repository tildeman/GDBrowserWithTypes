/**
 * @fileoverview Site-specific script for the gauntlet listing page.
 */

import { IGauntletEntry } from "../types/gauntlets.js";

fetch('/api/gauntlets').then(res => res.json()).then((gauntlets: IGauntletEntry[]) => {
	$('#loading').hide();
	gauntlets.forEach(gauntletItem => {
		$('#gauntletList').append(`
			<div class="gauntlet">
			<a href="/search/*?gauntlet=${gauntletItem.id}">
			<img src="/assets/gauntlets/${gauntletItem.name.toLowerCase()}.png" style="height: 300%"><br>
			<h3 class="gauntletText">${gauntletItem.name}<br>Gauntlet</h3></div></a>`);
	});
});

export {};