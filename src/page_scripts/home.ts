/**
 * @fileoverview Site-specific script for the home page.
 */

let page = 1;
$('#browserlogo').css('filter', `hue-rotate(${Math.floor(Math.random() * (330 - 60)) + 60}deg) saturate(${Math.floor(Math.random() * (150 - 100)) + 100}%)`);

let xButtonPos = '43%';
let lastPage: number;

let noDaily = (window.location.search == "?daily=1");
let noWeekly = (window.location.search == "?daily=2");

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
	$('.creditsIcon:not(".creditLoaded"):visible').each(async function() { // only load icons when necessary 
		$(this).addClass('creditLoaded');
		let profile: any = await Fetch(`./api/profile/${$(this).attr('ign')}?forceGD=1`).catch(e => {}) || {};
		$(this).append(`<gdicon cacheID=${profile.playerID} iconID=${profile.icon} col1="${profile.col1}" col2="${profile.col2}" glow="${profile.glow}"></gdicon>`);
		renderIcons();
	} as any);
}


Fetch(`./api/credits`).then(async (res: any) => {

	lastPage = res.credits.length + 1;
	res.credits.forEach(async (x, y) => {
			$('#credits').append(`<div id="credits${y+1}" class="subCredits" style="display: none;">
			<img class="gdButton" src="/assets/arrow-left.png" style="${y == 0 ? "display: none; " : ""}position: absolute; top: 45%; right: 75%; width: 4.5%" tabindex="0" onclick="page -= 1; loadCredits()">
			<div class="brownBox center supercenter" style="width: 80vh; height: 43%; padding-top: 1.5%; padding-bottom: 3.5%;">
				<h1>${x.header}</h1>
				<h2 style="margin-bottom: 1.5%; margin-top: 1.5%" class="gdButton biggerShadow"><a href="https://gdbrowser.com/u/${x.ign || x.name}" title=${x.name}>${x.name}</h2></a>
				
				<div class="creditsIcon" ign="${x.ign || x.name}"></div>

				<a target=_blank href="${x.youtube[0]}" title="YouTube"><img src="/assets/${x.youtube[1]}.png" width="11%" class="gdButton"></a>
				<a target=_blank href="${x.twitter[0]}" title="Twitter"><img src="/assets/${x.twitter[1]}.png" width="11%" class="sideSpace gdButton"></a>
				<a target=_blank href="${x.github[0]}" title="GitHub"><img src="/assets/${x.github[1]}.png" width="11%" class="sideSpace gdButton"></a>
				<br>
			</div>
			<img class="gdButton" src="/assets/arrow-right.png" style="position: absolute; top: 45%; left: 75%; width: 4.5%" tabindex="0" onclick="page += 1; loadCredits()">
			</div>`);
	});

	$('#credits').append(`<div id="credits${lastPage}" class="subCredits" style="display: none;">
			<div id="specialthanks" class="brownBox center supercenter" style="width: 80vh; height: 55%; padding-top: 1.5%; padding-bottom: 3.5%;">
				<h1>Special Thanks!</h1><br>
			</div>
			<img class="gdButton" src="/assets/arrow-left.png" style="position: absolute; top: 45%; right: 75%; width: 4.5%" tabindex="0" onclick="page -= 1; loadCredits()">
		</div>`);

	res.specialThanks.forEach(async (x, y) => {
		let n = x.split("/");
		$('#specialthanks').append(`<div class="specialThanks">
		<h2 class="gdButton smaller"><a href="https://gdbrowser.com/u/${n[1] || n[0]}" title=${n[0]}>${n[0]}</h2></a>
		<div class="creditsIcon specialThanksIcon" ign="${n[1] || n[0]}"></div>
		</div>`);
	});


	$('#credits').append(`<div id="closeCredits" class="center supercenter" style="z-index: 10; width: 80vh; height: ${xButtonPos}%; pointer-events: none;">
	<img class="closeWindow gdButton" src="/assets/close.png" width="14%" style="position: absolute; top: -24%; left: -7vh; pointer-events: all;" tabindex="0" onclick="$('#credits').hide(); page = 1;" title="Close"></div>`);

	$(document).keydown(function(k) {
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
});
