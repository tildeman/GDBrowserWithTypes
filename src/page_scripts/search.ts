/**
 * @fileoverview Site-specific script for the search results page.
 */

import { SearchQueryLevel } from "../classes/Level";

$('#pageDown').hide();
$('#pageUp').hide();

let accID = "";
let path = location.pathname.replace('/search/', "");
const url = new URL(window.location.href);
const gauntlet = url.searchParams.get('gauntlet');
const userMode = url.searchParams.get('user');
const type = url.searchParams.get('type') || "";
const list = url.searchParams.get('list');
const count = url.searchParams.get('count');
let header = url.searchParams.get('header');
const demonList = ["demonList", "demonlist"].some(x => typeof url.searchParams.get(x) == "string" || type == x);
let loading = false;
const gauntlets = [
	"Fire", "Ice", "Poison", "Shadow", "Lava", "Bonus",
	"Chaos", "Demon", "Time", "Crystal", "Magic", "Spike",
	"Monster", "Doom", "Death"
];

let currentPage = Math.max(1, Number(url.searchParams.get('page') || 0)) - 1;
let pages = 0;
let results = 0;
let legalPages = true;
let gdwMode = false;
const superSearch = ['*', '*?type=mostliked', '*?type=mostdownloaded', '*?type=recent'].includes(window.location.href.split('/')[4].toLowerCase());
let pageCache = {};

let demonListLink = "https://pointercrate.com/";
let searchFilters = `/api/search/${type == 'saved' ? JSON.parse(localStorage.getItem('saved') || '[]').reverse().toString() : accID || path}?page=[PAGE]${count ? "" : "&count=10"}${window.location.search.replace(/\?/g, "&").replace("currentPage", "nope")}`;

/**
 * Sanitize potentially dangerous code.
 * @param text The text to replace characters.
 * @returns The sanitized text that is safe to display.
 */
function clean(text: string | number | undefined) {
	return (text || "").toString()
		.replace(/&/g, "&#38;")
		.replace(/</g, "&#60;")
		.replace(/>/g, "&#62;")
		.replace(/=/g, "&#61;")
		.replace(/"/g, "&#34;")
		.replace(/'/g, "&#39;");
}

if (type == "followed") {
	let followed = localStorage.followed ? JSON.parse(localStorage.followed) : [];
	searchFilters += ("&creators=" + followed.join());
}

// TODO: Use a more rigorous GDPS check
let hostMatch = window.location.host.match(/\./g);
if (hostMatch && hostMatch.length > 1) { // gdps check
	$('#gdWorld').remove();
	$('#normalGD').remove();
}

/**
 * Append results to the selection box
 * @param firstLoad `true` if this is the first time the results are loaded
 * @param noCache `true` to ignore cache
 */
function Append(firstLoad?: boolean, noCache?: boolean) {
	loading = true;
	if (!firstLoad) $('#pagenum').text(`Page ${(currentPage + 1)}${pages ? ` of ${pages}` : ""}`);
	$('#searchBox').html('<div style="height: 4.5%"></div>');
	$('#pageSelect').val(currentPage + 1);
	$('#loading').show();

	if (currentPage == 0) $('#pageDown').hide();
	else $('#pageDown').show();

	if (currentPage == (pages - 1)) $('#lastPage').addClass('grayscale').find('img').removeClass('gdButton');
	else $('#lastPage').removeClass('grayscale').find('img').addClass('gdButton');

	if (!noCache && pageCache[currentPage]) appendLevels(pageCache[currentPage]);
	else Fetch(searchFilters.replace("[PAGE]", currentPage.toString())).then(appendLevels).catch(e => $('#loading').hide());

	function appendLevels(res: SearchQueryLevel[] | "-1") {
		if (res == '-1' || res.length == 0) {
			$('#loading').hide();
			$('#pageUp').hide();
			return loading = false;
		}
		pageCache[currentPage] = res;

		if (firstLoad) {
			pages = res[0].pages || 0;
			results = res[0].results || 0;
			if (!pages || pages == 1000 || pages < 1) {
				pages = 0;
				if (!superSearch) $('#shuffle').addClass('grayscale');
				else $('#shuffle').css('filter', 'hue-rotate(100deg)');
			}
			$('#shuffle').show();
			if (pages > 1) $('#lastPage').show();
			$('#pagenum').text(`Page ${currentPage + 1}${pages ? ` of ${pages}` : ""}`);
		}

		if ((pages && currentPage+1 >= pages) || (!pages && res.length < 9 && type != "recent")) {
			$('#pageUp').hide();
		}
		else $('#pageUp').show();

		if (demonList) {
			demonListLink = res[0].demonList || "";
			res = res.sort(function(a, b){
				return (a.demonPosition || 0) - (b.demonPosition || 0);
			});
		}

		res.forEach((x, y) => {
			let hasAuthor = (x.accountID != "0");
			let userSearch = (type == "5" || typeof userMode == 'string');
			if (y == 0 && userSearch) {
				$('#header').text(((!x.author || x.author == "-" ? "Someone" : x.author)) + (x.author.toLowerCase().endsWith('s') ? "'" : "'s") + " levels");
				document.title = $('#header').text();
				accID = x.playerID;
			}

			let filteredSong = clean(x.songName.replace(/[^ -~]/g, ""));
			if (!filteredSong) filteredSong = clean(x.songName);
			let songColor = x.customSong == 0 ? "blue" : (x.songLink && !x.songLink.match(/^https?:\/\/\audio\.ngfiles\.com\//)) ? "nong" : "whatIfItWasPurple";
			let noLink = songColor != "whatIfItWasPurple";

			// TODO: replace this with a template-based item
			$('#searchBox').append(`<div class="searchResult" title="${clean(x.description)}">
				<h1 class="lessspaced pre" title="${x.name} by ${!x.author || x.author == "-" ? "some nerd" : x.author}" style="width: fit-content; padding-right: 1%">${clean(x.name || " ")}</h1>
				<h2 class="pre smaller inline gdButton help ${hasAuthor ? "" : "green unregistered"}" title="Account ID: ${x.accountID}\nPlayer ID: ${x.playerID}"><!--
					-->${hasAuthor && !onePointNine ? `<a style="margin-right: 0.66vh" href="/u/${x.accountID}.">By ${x.author || "-"}</a>` : `<a ${userSearch ? "" : `href="/search/${x.playerID}?user"`}>By ${x.author || "-"}</a>`}</h2><!--
					--><h2 class="inline" style="margin-left: 1.5%; transform:translateY(10%)"> ${x.copiedID == '0' ? "" : `<a target="_blank" href="/level/${x.copiedID}"><!--
					--><img class="gdButton valign sideSpaceD" title="Original: ${x.copiedID}" src="/assets/copied.png" style="height: 3vh;"></a>`}<!--
					-->${x.large ? `<img class="help valign sideSpaceD" title="${x.objects}${x.objects == 65535 ? "+" : ""} objects" src="/assets/large.png" style="height: 3vh;">` : ''}<!--
					-->${x.twoPlayer ? `<img class="help valign sideSpaceD" title="Two player level" src="/assets/twoPlayer.png" style="height: 3vh;">` : ''}
				</h2>
				<h3 class="lessSpaced help ${noLink ? "" : 'gdButton '}pre ${songColor}" title="${filteredSong} by ${x.songAuthor} (${x.songID})" style="overflow: hidden; max-height: 19%; width: fit-content; padding: 1% 1% 0% 0%">${noLink ? filteredSong : `<a target="_blank" style="width: fit-content" href="https://www.newgrounds.com/audio/listen/${x.songID}">${filteredSong}</a>`}</h3>
				<h3 class="lessSpaced" style="width: fit-content" title="">
					<img class="help valign rightSpace" title="Length" src="/assets/time.png" style="height: 3.5vh;">${x.length}
					<img class="help valign rightSpace" title="Downloads" src="/assets/download.png" style="height: 3.5vh;">${x.downloads}
					<img class="help valign rightSpace" title="Likes" src="/assets/${x.disliked ? 'dis' : ''}like.png" style="height: 3.5vh;">${x.likes}
					${x.orbs != 0 ? `<img class="help valign rightSpace" title="Mana Orbs" src="/assets/orbs.png" style="height: 3.5vh;">${x.orbs}` : ""}
				</h3>

				<div class="center" style="position:absolute; top: ${6.5 + (y * 33.5) + (x.coins == 0 ? 2.5 : 0)}%; left: 4.4%; transform:scale(0.82); height: 10%; width: 12.5%;">
					<img class="help spaced" id="dFace" title="${x.difficulty}${x.epic ? " (Epic)" : x.featured ? " (Featured)" : ""}" src="/assets/difficulties/${x.difficultyFace}.png" style="height: 12vh;" style="margin-bottom: 0%; ${x.epic ? 'transform:scale(1.2)' : x.featured ? 'transform:scale(1.1)' : ''}">
					<h3 title="">${x.difficulty.includes('Demon') ? "Demon" : x.difficulty}</h3>
					${x.stars != 0 && !demonList ? `<h3 class="help" title="${x.stars} star${x.stars == 1 ? "" : "s"}${x.starsRequested ? ` (${x.starsRequested} requested)` : ""}">${x.stars}<img class="valign sideSpaceB" src="/assets/star.png" style="height: 3vh;" style="transform:translateY(-8%)"></h3>` : ""}

					${demonList ? `<h3 class="help yellow" title="Ranked #${x.demonPosition} on the Demon List">#${x.demonPosition}</h3>` : ""}

					<div id="coins" style="margin-top: 3%" title="${x.coins} user coin${x.coins == 1 ? "" : "s"} (${x.verifiedCoins ? "" : "un"}verified)">
						${x.coins > 0 ? `<img src="/assets/${x.verifiedCoins ? 'silver' : 'brown'}coin.png" style="height: 4vh;" class="help">` : ""}
						${x.coins > 1 ? `<img src="/assets/${x.verifiedCoins ? 'silver' : 'brown'}coin.png" style="height: 4vh;" class="help squeezeB">` : ""}
						${x.coins > 2 ? `<img src="/assets/${x.verifiedCoins ? 'silver' : 'brown'}coin.png" style="height: 4vh;" class="help squeezeB">` : ""}
					</div>
				</div>
				<div class="center" style="position:absolute; right: 7%; transform:translateY(-${demonList ? 19.5 : 16.25}vh); height: 10%">
					<a title="View level" href="/level/${x.id}""><img style="margin-bottom: 4.5%; height: 105%;" class="valign gdButton" src="/assets/view.png"></a>
					${demonList ? `<br><a title="View leaderboard" href="/demon/${x.demonPosition}""><img class="valign gdButton" src="/assets/trophyButton.png" style="height: 110%;"></a>
					<a title="View on Pointercrate" href="${demonListLink}demonlist/${x.demonPosition}" target=_blank><img class="valign gdButton" src="/assets/demonButton.png" style="height: 110%;"></a>` : "" }
					<p title="Level ID" style="text-align: right; color: rgba(0, 0, 0, 0.4); font-size: 2.2vh; transform: translate(2.8vh, ${demonList ? -1.8 : 2.5}vh)">#${x.id}</p>
				</div>
			</div>`);
		});

		$('#searchBox').append('<div style="height: 4.5%"></div>').scrollTop(0);
		$('#loading').hide();
		loading = false;
	}
}

Append(true);

$('#pageUp').click(function() {
	currentPage += 1;
	if (!loading) Append();
});
$('#pageDown').click(function() {
	currentPage -= 1;
	if (!loading) Append();
});
$('#lastPage').click(function() {
	currentPage = (pages - 1);
	if (!loading) Append();
});
$('#pageJump').click(function() {
	if (loading) return;
	currentPage = parseInt($('#pageSelect').val()?.toString() || "1") - 1;
	Append();
});
$('#refreshPage').click(function() {
	Append(false, true);
});

if (header) {
	header = header.slice(0, 32) || "Level Search";
	$('#header').text(header);
	document.title = header;
}
else {
	if (type == "1" || type == 'mostdownloaded') $('#header').text("Most Downloaded");
	if (type == "2" || type == 'mostliked') $('#header').text("Most Liked");
	if (type == "3" || type == 'trending') $('#header').text("Trending Levels");
	if (type == "4" || type == 'recent') $('#header').text("Recent Levels");
	if (type == "6" || type == 'featured') { $('#header').text("Featured"); $('#gdWorld').show() };
	if (type == "7" || type == 'magic') $('#header').text("Magic Levels");
	if (type == "11" || type == 'awarded' || type == 'starred') $('#header').text("Awarded Levels");
	if (type == "16" || type == 'halloffame' || type == 'hof') $('#header').text("Hall of Fame");
	if (type == "17" || type == 'gdw' || type == 'gdworld') { $('#header').text("Featured (GD World)"); $('#normalGD').show() };
	if (path != "*" && (type == "10" || list != null)) $('#header').text("Custom List");
	if (type == 'followed') $('#header').text("Followed Creators");
	document.title = $('#header').text() || "Level Search";
	$('#meta-title').attr('content', $('#header').text() || "Level Search");
	if ($('#header').text()) $('#meta-desc').attr('content',  `View Geometry Dash's ${$('#header').text()}${$('#header').text() == "Hall of Fame" ? "" : "list"}!`);
}

if (type == 'saved') {
	$('#header').text("Saved Levels");
	$('#purge').show();
	document.title = "Saved Levels";
	$('#meta-title').attr('content', `Saved Levels`);
	$('#meta-desc').attr('content', `View your collection of saved Geometry Dash levels!`);
}

if (gauntlet) {
	$('body').addClass('darkBG');
	$('.cornerPiece').addClass('grayscale');
	$('#header').text((gauntlets[parseInt(gauntlet) - 1] || "Unknown") + " Gauntlet");
	$('#meta-title').attr('content', (gauntlets[parseInt(gauntlet) - 1] || "Unknown") + " Gauntlet");
	$('#meta-desc').attr('content',  `View the 5 levels in the ${(gauntlets[parseInt(gauntlet) - 1] || "Unknown") + " Gauntlet"}!`);
}

if (demonList) {
	$('body').addClass('darkBG');
	$('.cornerPiece').addClass('grayscale');
	$('#header').text("Demon List");
	$('#meta-title').attr('content', "Demon List");
	$('#meta-desc').attr('content',  "View the hardest demons in Geometry Dash!");
}

if (!$('#header').text() && typeof userMode != "string") {
	if (path != "*") {
		$('#header').text(decodeURIComponent(path));
		$('#tabTitle').text(decodeURIComponent(path) + " - Level Search");
	}
	else $('#header').text("Online Levels");
}


$('.closeWindow').click(function() {
	$(".popup").attr('style', 'display: none;');
});

$('#purgeSaved').click(function() {
	localStorage.removeItem('saved');
	location.reload();
});

const max = 9999;
const min = 1;

$('#pageSelect').on('input', function () {
	const x = $(this).val();
	if ($(this).val() != "") {
		$(this).val(Math.max(Math.min(Math.floor(Number(x) || 0), max), min));
	}
});

$('#pageSelect').on('blur', function () {
	const x = $(this).val();
	if ($(this).val() != "") {
		$(this).val(Math.max(Math.min(Math.floor(Number(x) || 0), max), min));
	}
});

$('#shuffle').click(function() {
	if (superSearch) {
		$('#searchBox').html('<div style="height: 4.5%"></div>');
		$('#loading').show();
		fetch("/api/search/*page=0&type=recent").then(res => res.json()).then(recent => {
			let mostRecent = recent[0].id;
			function fetchRandom() {
				fetch(`/api/level/${Math.floor(Math.random() * (mostRecent)) + 1}`).then(res => res.json()).then(res => {
					if (res == "-1" || !res.id) return fetchRandom();
					else window.location.href = "/level/" + res.id;
				});
			}
			fetchRandom();
		});
	}
	else if (pages) {
		const random = {};
		const pageCount = +(count || "0") || 10;
		const randomResult = Math.floor(Math.random() * (results)) + 1;
		const randomPage = Math.ceil(randomResult / pageCount);
		let randomIndex = randomResult % pageCount;
		if (randomIndex == 0) randomIndex = pageCount;
		$('#searchBox').html('<div style="height: 4.5%"></div>');
		$('#loading').show();
		fetch(searchFilters.replace('[PAGE]', (randomPage - 1).toString())).then(res => res.json()).then(res => {
			window.location.href = "/level/" + res[randomIndex-1].id;
		});
	}
	else return $('#shuffleDiv').show();
});

$(document).keydown(function(k) {
	if (loading) return;

	if ($('#pageDiv').is(':visible')) {
		if (k.which == 13) $('#pageJump').trigger('click'); //enter
		else return;
	}

	if (k.which == 37 && $('#pageDown').is(":visible")) $('#pageDown').trigger('click');   // left
	if (k.which == 39 && $('#pageUp').is(":visible")) $('#pageUp').trigger('click');       // right
});
