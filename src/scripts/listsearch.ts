/**
 * @fileoverview Site-specific script for the search results page for lists.
 */

import { SearchQueryLevelList } from "../types/lists.js";
import { ErrorObject } from "../types/miscellaneous.js";
import { Handlebars } from "../vendor/index.js";
import { Fetch } from "../misc/global.js";

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

	if (!noCache && pageCache[currentPage]) appendLists(pageCache[currentPage]);
	else Fetch(searchFilters.replace("[PAGE]", currentPage.toString())).then(appendLists).catch(e => $('#loading').hide());

	/**
	 * Inner function that appends the matching lists into the selection box.
	 * @param res A list of lists returned by the internal API, or an error object.
	 */
	function appendLists(res: SearchQueryLevelList[] | ErrorObject) {
		if ("error" in res || !res.length) {
			$('#loading').hide();
			$('#pageUp').hide();
			loading = false;
			return;
		}
		pageCache[currentPage] = res;

		if (firstLoad) {
			pages = 1000; // List queries don't return a valid page count
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

		res.forEach((list) => {
			try {
				$("#searchBox").append(searchResultTemplate({
					list,
					disliked: list.likes < 0,
					difficultyText: `${list.difficultyFace}${list.featured ? " (Featured)" : ""}`,
					ratingScale: list.featured ? 1.1 : 1, // TODO: Produce human-readable difficulty values
					shortenedDifficulty: list.difficultyName.includes('Demon') ? "Demon" : list.difficultyName
				}));
			}
			catch (e) {
				console.log(e.message);
			}
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

const searchResultTemplateString = await fetch("/templates/listsearch_searchResult.hbs").then(res => res.text());
const searchResultTemplate = Handlebars.compile(searchResultTemplateString, {strict: true});

const path = location.pathname.replace('/listsearch/', "");
const url = new URL(window.location.href);
const userMode = url.searchParams.get('user');
const type = url.searchParams.get('type') || "";
const count = url.searchParams.get('count');
const rawHeader = url.searchParams.get('header');
const superSearch = ['*', '*?type=mostliked', '*?type=mostdownloaded', '*?type=recent'].includes(window.location.href.split('/')[4].toLowerCase());
const pageCache: Record<number, SearchQueryLevelList[]> = {};

const max = 9999;
const min = 1;

let loading = false;

let currentPage = Math.max(1, Number(url.searchParams.get('page') || 0)) - 1;
let pages = 0;
let results = 0;

let searchFilters = `/api/listsearch/${path}?page=[PAGE]${count ? "" : "&count=10"}${window.location.search.replace(/\?/g, "&").replace("currentPage", "nope")}`;

$('#pageDown').hide();
$('#pageUp').hide();

if (type == "followed") {
	const followed = localStorage.followed ? JSON.parse(localStorage.followed) : [];
	searchFilters += ("&creators=" + followed.join());
}

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
	const header = rawHeader.slice(0, 32) || "List Search";
	$('#header').text(header);
	document.title = header;
}
else {
	if (type == "1" || type == 'mostdownloaded') $('#header').text("Most Downloaded (Lists)");
	if (type == "2" || type == 'mostliked') $('#header').text("Most Liked (Lists)");
	if (type == "4" || type == 'recent') $('#header').text("Recent Levels (Lists)");
	if (type == "6" || type == 'featured') {
		$('#header').text("Featured");
		$('#gdWorld').show();
	}
}

if (!$('#header').text() && typeof userMode != "string") {
	if (path != "*") {
		$('#header').text(decodeURIComponent(path));
		$('#tabTitle').text(decodeURIComponent(path) + " - List Search");
	}
	else $('#header').text("Lists");
}

$('.closeWindow').on("click", function() {
	$(".popup").attr('style', 'display: none;');
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
		fetch("/api/listsearch/*page=0&type=recent").then(res => res.json()).then(recent => {
			const mostRecent = recent[0].id;
			/**
			 * Return a random list from the current selection.
			 */
			function fetchRandom() {
				fetch(`/api/list/${Math.floor(Math.random() * (mostRecent)) + 1}`).then(res => res.json()).then((res: ErrorObject | SearchQueryLevelList) => {
					if ("error" in res || !res.id) return fetchRandom();
					else window.location.href = "/list/" + res.id;
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
			window.location.href = "/list/" + res[randomIndex - 1].id;
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


append(true);

export {};