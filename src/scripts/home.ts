/**
 * @fileoverview Site-specific script for the home page.
 */

import { buildIcon } from "../iconkit/icon.js";
import { Player } from "../classes/Player.js";
import { Fetch } from "../misc/global.js";

/**
 * Load the credit text into the button.
 */
function loadCredits() {
	$('.subCredits').hide();
	$('#credits' + page).show();
	$('#credits').show();
	if (page == lastPage) $('#closeCredits').css('height', '52%');
	else $('#closeCredits').css('height', '43%');
	$('.creditsIcon:not(".creditLoaded"):visible').each(async function(this: HTMLElement) { // only load icons when necessary
		$(this).addClass('creditLoaded');
		let profile: Player = await Fetch(`/api/profile/${$(this).attr('ign')}?forceGD=1`).catch(e => {}) || {};
		$(this).append(`<gdicon cacheID=${profile.playerID} iconID=${profile.icon} col1="${profile.col1}" col2="${profile.col2}" glow="${profile.glow}"></gdicon>`);
		buildIcon($(`gdicon[cacheID=${profile.playerID}]`));
	} as any);
}

let page = 1;
$('#browserlogo').css('filter', `hue-rotate(${Math.floor(Math.random() * (330 - 60)) + 60}deg) saturate(${Math.floor(Math.random() * (150 - 100)) + 100}%)`);

const lastPage = $(".subCredits").length;

const noDaily = (window.location.search == "?daily=1");
const noWeekly = (window.location.search == "?daily=2");

if (noDaily || noWeekly) {
	if (noWeekly) $('#noLevel').html("weekly");
	$('#noDaily').fadeIn(200).delay(500).fadeOut(500);
	window.history.pushState(null, "", "/");
}

$("#closeCredits").on("click", function() {
	$('#credits').hide();
	page = 1;
});

$(document).on("keydown", function(k) {
	if ($('#credits').is(':hidden')) return;

	if (k.which == 37 && page > 1) { //left
		page -= 1;
		loadCredits();
	}

	if (k.which == 39 && page < lastPage) { //right
		page += 1;
		loadCredits();
	}
});

$(".creditsNextPage").on("click", () => {
	page += 1;
	loadCredits();
});

$(".creditsPrevPage").on("click", () => {
	page -= 1;
	loadCredits();
});

$("#creditsButton").on("click", loadCredits);

export {};