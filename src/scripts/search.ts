/**
 * @fileoverview Site-specific script for the search results page.
 */

import { Level, SearchQueryLevel } from "../classes/Level.js";
import { Fetch, serverMetadata } from "../misc/global.js";
import { ErrorObject } from "../types/miscellaneous.js";
import { Handlebars } from "../vendor/index.js";

/**
 * Append results to the selection box.
 * @param firstLoad `true` if this is the first time the results are loaded.
 * @param noCache `true` to ignore cache.
 */
function append(firstLoad?: boolean, noCache?: boolean) {
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

	/**
	 * Inner function that appends the matching levels into the selection box.
	 * @param res A list of levels returned by the internal API, or an error object.
	 */
	function appendLevels(res: SearchQueryLevel[] | ErrorObject) {
		if ("error" in res || !res.length) {
			$('#loading').hide();
			$('#pageUp').hide();
			loading = false;
			return;
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

		if ((pages && currentPage + 1 >= pages) || (!pages && res.length < 9 && type != "recent")) {
			$('#pageUp').hide();
		}
		else $('#pageUp').show();

		if (demonList) {
			demonListLink = res[0].demonList || "";
			res = res.sort(function(a, b) {
				return (a.demonPosition || 0) - (b.demonPosition || 0);
			});
		}
		console.log(res);

		res.forEach((level, levelIndex) => {
			const hasAuthor = (level.accountID != "0");
			const userSearch = (type == "5" || typeof userMode == 'string');
			if (levelIndex == 0 && userSearch) {
				$('#header').text(((!level.author || level.author == "-" ? "Someone" : level.author)) + (level.author.toLowerCase().endsWith('s') ? "'" : "'s") + " levels");
				document.title = $('#header').text();
				accID = level.playerID;
			}

			const filteredSong = level.songName.replace(/[^ -~]/g, "") || level.songName;
			const songColor = level.customSong == 0 ? "blue" : (level.songLink && !level.songLink.match(/^https?:\/\/\audio\.ngfiles\.com\//)) ? "nong" : "whatIfItWasPurple";
			const noLink = songColor != "whatIfItWasPurple";

			$("#searchBox").append(searchResultTemplate({
				level,
				displayAuthor: !level.author || level.author == "-" ? "some nerd" : level.author,
				hasAuthor,
				userSearch,
				inGameAuthor: level.author || "-",
				authorAndOnePointNine: hasAuthor && !serverMetadata.onePointNine,
				original: !level.copiedID || level.copiedID == '0',
				objectCountEstimate: `${level.objects}${level.objects == 65535 ? "+" : ""}`,
				noLink,
				songColor,
				filteredSong,
				ratingDetailsTop: 6.5 + (levelIndex * 33.5) + (level.coins == 0 ? 2.5 : 0),
				ratingDetails: level.difficulty + (level.epic ? " (Epic)" : level.featured ? " (Featured)" : ""),
				shortenedDiff: level.difficulty.includes('Demon') ? "Demon" : level.difficulty,
				starButNotDemonlist: level.stars != 0 && !demonList,
				starsPlural: !(level.stars == 1),
				demonList,
				oneCoin: level.coins > 0,
				twoCoins: level.coins > 1,
				threeCoins: level.coins > 2,
				demonListLink
			}));
		});

		$('#searchBox').append('<div style="height: 4.5%"></div>').scrollTop(0);
		$('#loading').hide();
		loading = false;
	}
}

/**
 * Move the pagination by an amount.
 * @param increment The amount of page to move
 */
function movePageBy(increment: number) {
	$('#pageSelect').val((parseInt(String($('#pageSelect').val() || "0")) || 0) + increment);
	$('#pageSelect').trigger('input');
}

const searchResultTemplateString = await (await fetch("/templates/search_searchResult.hbs")).text();
const searchResultTemplate = Handlebars.compile(searchResultTemplateString, {strict: true});
const path = location.pathname.replace('/search/', "");
const url = new URL(window.location.href);
const gauntlet = url.searchParams.get('gauntlet');
const userMode = url.searchParams.get('user');
const type = url.searchParams.get('type') || "";
const list = url.searchParams.get('list');
const count = url.searchParams.get('count');
const rawHeader = url.searchParams.get('header');
const superSearch = ['*', '*?type=mostliked', '*?type=mostdownloaded', '*?type=recent'].includes(window.location.href.split('/')[4].toLowerCase());
const pageCache: Record<number, SearchQueryLevel[]> = {};
const demonList = ["demonList", "demonlist"].some(linkName => typeof url.searchParams.get(linkName) == "string" || type == linkName);
const gauntlets = [
	"Fire", "Ice", "Poison", "Shadow", "Lava", "Bonus",
	"Chaos", "Demon", "Time", "Crystal", "Magic", "Spike",
	"Monster", "Doom", "Death"
];

const max = 9999;
const min = 1;

let accID = "";
let loading = false;

let currentPage = Math.max(1, Number(url.searchParams.get('page') || 0)) - 1;
let pages = 0;
let results = 0;

let demonListLink = "https://pointercrate.com/";
let searchFilters = `/api/search/${type == 'saved' ? JSON.parse(localStorage.getItem('saved') || '[]').reverse().toString() : accID || path}?page=[PAGE]${count ? "" : "&count=10"}${window.location.search.replace(/\?/g, "&").replace("currentPage", "nope")}`;

$('#pageDown').hide();
$('#pageUp').hide();

if (type == "followed") {
	const followed = localStorage.followed ? JSON.parse(localStorage.followed) : [];
	searchFilters += ("&creators=" + followed.join());
}

if (serverMetadata.gdps) { // gdps check
	$('#gdWorld').remove();
	$('#normalGD').remove();
}

append(true);

$('#pageUp').on("click", function() {
	currentPage += 1;
	if (!loading) append();
});
$('#pageDown').on("click", function() {
	currentPage -= 1;
	if (!loading) append();
});
$('#lastPage').on("click", function() {
	currentPage = (pages - 1);
	if (!loading) append();
});
$('#pageJump').on("click", function() {
	if (loading) return;
	currentPage = parseInt($('#pageSelect').val()?.toString() || "1") - 1;
	append();
});
$('#refreshPage').on("click", function() {
	append(false, true);
});

if (rawHeader) {
	const header = rawHeader.slice(0, 32) || "Level Search";
	$('#header').text(header);
	document.title = header;
}
else {
	if (type == "1" || type == 'mostdownloaded') $('#header').text("Most Downloaded");
	if (type == "2" || type == 'mostliked') $('#header').text("Most Liked");
	if (type == "3" || type == 'trending') $('#header').text("Trending Levels");
	if (type == "4" || type == 'recent') $('#header').text("Recent Levels");
	if (type == "6" || type == 'featured') {
		$('#header').text("Featured");
		$('#gdWorld').show();
	}
	if (type == "7" || type == 'magic') $('#header').text("Magic Levels");
	if (type == "11" || type == 'awarded' || type == 'starred') $('#header').text("Awarded Levels");
	if (type == "16" || type == 'halloffame' || type == 'hof') $('#header').text("Hall of Fame");
	if (type == "17" || type == 'gdw' || type == 'gdworld') {
		$('#header').text("Featured (GD World)");
		$('#normalGD').show();
	}
	if (path != "*" && (type == "10" || list != null)) $('#header').text("Custom List");
	if (type == 'followed') $('#header').text("Followed Creators");

	document.title = $('#header').text() || "Level Search";
	$('#meta-title').attr('content', $('#header').text() || "Level Search");
	if ($('#header').text()) {
		$('#meta-desc').attr('content',  `View Geometry Dash's ${$('#header').text()}${$('#header').text() == "Hall of Fame" ? "" : "list"}!`);
	}
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


$('.closeWindow').on("click", function() {
	$(".popup").attr('style', 'display: none;');
});

$('#purgeSaved').on("click", function() {
	localStorage.removeItem('saved');
	location.reload();
});

$('#pageSelect').on('input', function () {
	const value = $(this).val();
	if ($(this).val() != "") {
		$(this).val(Math.max(Math.min(Math.floor(Number(value) || 0), max), min));
	}
});

$('#pageSelect').on('blur', function () {
	const value = $(this).val();
	if ($(this).val() != "") {
		$(this).val(Math.max(Math.min(Math.floor(Number(value) || 0), max), min));
	}
});

$('#shuffle').on("click", function() {
	if (superSearch) {
		$('#searchBox').html('<div style="height: 4.5%"></div>');
		$('#loading').show();
		fetch("/api/search/*page=0&type=recent").then(res => res.json()).then(recent => {
			const mostRecent = recent[0].id;
			/**
			 * Return a random level from the current selection.
			 */
			function fetchRandom() {
				fetch(`/api/level/${Math.floor(Math.random() * (mostRecent)) + 1}`).then(res => res.json()).then((res: ErrorObject | Level) => {
					if ("error" in res || !res.id) return fetchRandom();
					else window.location.href = "/level/" + res.id;
				});
			}
			fetchRandom();
		});
	}
	else if (pages) {
		const pageCount = +(count || "0") || 10;
		const randomResult = Math.floor(Math.random() * (results)) + 1;
		const randomPage = Math.ceil(randomResult / pageCount);
		const randomIndex = (randomResult % pageCount) || pageCount;
		$('#searchBox').html('<div style="height: 4.5%"></div>');
		$('#loading').show();
		fetch(searchFilters.replace('[PAGE]', (randomPage - 1).toString())).then(res => res.json()).then(res => {
			window.location.href = "/level/" + res[randomIndex - 1].id;
		});
	}
	else return $('#shuffleDiv').show();
});

$(document).on("keydown", function(k) {
	if (loading) return;

	if ($('#pageDiv').is(':visible')) {
		if (k.which == 13) $('#pageJump').trigger('click'); // enter
		else return;
	}

	if (k.which == 37 && $('#pageDown').is(":visible")) $('#pageDown').trigger('click');   // left
	if (k.which == 39 && $('#pageUp').is(":visible")) $('#pageUp').trigger('click');       // right
});

$("#prevResult").on("click", function() {
	movePageBy(-1);
});

$("#nextResult").on("click", function() {
	movePageBy(1);
});

export {};