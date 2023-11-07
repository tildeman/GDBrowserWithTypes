/**
 * @fileoverview Site-specific script for the home page.
 */

import { Player } from "../classes/Player.js";
import { buildIcon } from "../iconkit/icon.js";
import { Fetch } from "../misc/global.js";
import { IBrowserCredits } from "../types/miscellaneous.js";

let page = 1;
$('#browserlogo').css('filter', `hue-rotate(${Math.floor(Math.random() * (330 - 60)) + 60}deg) saturate(${Math.floor(Math.random() * (150 - 100)) + 100}%)`);

let xButtonPos = '43%';
let lastPage: number;

const noDaily = (window.location.search == "?daily=1");
const noWeekly = (window.location.search == "?daily=2");

if (noDaily || noWeekly) {
	if (noWeekly) $('#noLevel').html("weekly");
	$('#noDaily').fadeIn(200).delay(500).fadeOut(500);
	window.history.pushState(null, "", "/");
}

/**
 * Load the credit text into the button.
 */
function loadCredits() {
	$('.subCredits').hide();
	$('#credits' + page).show();
	$('#credits').show();
	if (page == lastPage) $('#closeCredits').css('height', '52%');
	else $('#closeCredits').css('height', xButtonPos);
	$('.creditsIcon:not(".creditLoaded"):visible').each(async function(this: HTMLElement) { // only load icons when necessary
		$(this).addClass('creditLoaded');
		let profile: Player = await Fetch(`/api/profile/${$(this).attr('ign')}?forceGD=1`).catch(e => {}) || {};
		$(this).append(`<gdicon cacheID=${profile.playerID} iconID=${profile.icon} col1="${profile.col1}" col2="${profile.col2}" glow="${profile.glow}"></gdicon>`);
		buildIcon($(`gdicon[cacheID=${profile.playerID}]`));
	} as any);
}


Fetch(`/api/credits`).then(async (res: IBrowserCredits) => {
	lastPage = res.credits.length + 1;
	res.credits.forEach(async (creditItem, creditIndex) => {
		$('#credits').append(`<div id="credits${creditIndex + 1}" class="subCredits" style="display: none;">
		<img class="gdButton creditsPrevPage" src="/assets/arrow-left.png" style="${creditIndex == 0 ? "display: none; " : ""}position: absolute; top: 45%; right: 75%; width: 4.5%" tabindex="0">
		<div class="brownBox center supercenter" style="width: 80vh; height: 43%; padding-top: 1.5%; padding-bottom: 3.5%;">
			<h1>${creditItem.header}</h1>
			<h2 style="margin-bottom: 1.5%; margin-top: 1.5%" class="gdButton biggerShadow"><a href="https://gdbrowser.com/u/${creditItem.ign || creditItem.name}" title=${creditItem.name}>${creditItem.name}</h2></a>

			<div class="creditsIcon" ign="${creditItem.ign || creditItem.name}"></div>

			<a target=_blank href="${creditItem.youtube[0]}" title="YouTube"><img src="/assets/${creditItem.youtube[1]}.png" style="width: 11%" class="gdButton"></a>
			<a target=_blank href="${creditItem.twitter[0]}" title="Twitter"><img src="/assets/${creditItem.twitter[1]}.png" style="width: 11%" class="sideSpace gdButton"></a>
			<a target=_blank href="${creditItem.github[0]}" title="GitHub"><img src="/assets/${creditItem.github[1]}.png" style="width: 11%" class="sideSpace gdButton"></a>
			<br>
		</div>
		<img class="gdButton creditsNextPage" src="/assets/arrow-right.png" style="position: absolute; top: 45%; left: 75%; width: 4.5%" tabindex="0">
		</div>`);
	});

	$('#credits').append(`<div id="credits${lastPage}" class="subCredits" style="display: none;">
			<div id="specialthanks" class="brownBox center supercenter" style="width: 80vh; height: 55%; padding-top: 1.5%; padding-bottom: 3.5%;">
				<h1>Special Thanks!</h1><br>
			</div>
			<img class="gdButton creditsPrevPage" src="/assets/arrow-left.png" style="position: absolute; top: 45%; right: 75%; width: 4.5%" tabindex="0">
		</div>`);

	res.specialThanks.forEach(async (data, index) => {
		let username = data.split("/");
		$('#specialthanks').append(`<div class="specialThanks">
		<h2 class="gdButton smaller"><a href="https://gdbrowser.com/u/${username[1] || username[0]}" title=${username[0]}>${username[0]}</h2></a>
		<div class="creditsIcon specialThanksIcon" ign="${username[1] || username[0]}"></div>
		</div>`);
	});


	$('#credits').append(`<div id="closeCredits" class="center supercenter" style="z-index: 10; width: 80vh; height: ${xButtonPos}%; pointer-events: none;">
	<img class="closeWindow gdButton" src="/assets/close.png" style="position: absolute; top: -24%; left: -7vh; width: 14%; pointer-events: all;" tabindex="0" title="Close"></div>`);

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
});

$("#creditsButton").on("click", loadCredits);

export {};