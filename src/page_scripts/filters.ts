/**
 * @fileoverview Site-specific script for the search page.
 */

import { Fetch, serverMetadata } from "../misc/global.js";
import { ISafeServers } from "../types/servers.js";

let filters: string[] = [];
let demonMode = false;
let customSong = true;
let officialSong = 1;

/**
 * Remove duplicate entries in an array.
 * @param array The array to remove duplicates.
 * @returns The array with all duplicates removed.
 */
function undupe<T>(array: T[]) {
  if (!Array.isArray(array)) return [];
  else return array.filter((value, index) => array.indexOf(value) == index);
}

$('#userSearch').on("click", function() {
	const query = encodeURIComponent(($('#levelName').val() || "").toString()).replace(/%2F/gi, "");
	if (query) window.location.href = "./u/" + query;
});

$('.levelSearch').on("click", function() {
	let url = "/search/" + (encodeURIComponent(($('#levelName').val() || "").toString()) || "*") + "?type=" + $(this).attr('search');
	if ($(this).attr('search') == "featured") return window.location.href = url;

	// === DIFFICULTY === //
	let difficulties: string[] = [];
	$('.diffDiv').each(function() {if ($(this).hasClass('selectedFilter')) difficulties.push($(this).attr('diff') || "")});
	const demonFilter = demonMode && (+difficulties[0] > 0);

	if (!difficulties.length) url += "";
	else if (!demonFilter) url += "&diff=" + undupe(difficulties).join(",");
	else url += "&diff=-2&demonFilter=" + difficulties[0];

	// === LENGTH === //
	let lengths: string[] = []
	$('.lengthDiv').each(function() {
		if ($(this).hasClass('selectedFilter') && $(this).attr('len')) {
			lengths.push($(this).attr('len') || "");
		}
	});
	if (lengths.length) url += "&length=" + lengths.join(",");
	if ($('#starCheck').hasClass('selectedFilter')) url += "&starred";

	// === CHECKBOXES === //
	$("input:checked").each(function () {
		url += $(this).attr('url');
	});

	// === SONG === //

	const selectedOfficial = customSong ? null : officialSong;
	const selectedCustom = customSong && $('#songID').val() ? ($('#songID').val() || "").toString().slice(0, 16) : null;
	const selectedSong = selectedCustom || selectedOfficial;

	if (selectedSong) {
		url += "&songID=" + selectedSong;
		if (customSong) url += "&customSong";
	}

	// === FINISHING UP === //

	if (url.endsWith('?type=0')) url = url.slice(0, -7);
	window.location.href = url.replace(/\?type=0&/, "?");
});

/**
 * Get selected difficulty filters.
 * @returns The requested difficulty filter.
 */
function getDiffFilters() {
	return $('.diffDiv.selectedFilter').map(function() {
		return $(this).attr('diff');
	}).toArray();
}

/**
 * Shows the demon sub-difficulties selection panel,
 * and hides the non-demon difficulties.
 */
function showDemonDiffs() {
	$('#difficulties').hide();
	$('#demons').show();
	demonMode = true;
}

/**
 * Shows the non-demon difficulties selection panel,
 * and hides the demon sub-difficulties.
 */
function hideDemonDiffs() {
	$('#difficulties').show();
	$('#demons').hide();
	demonMode = false;
}

$('.diffDiv').on("click", function() {
	if ($(this).hasClass('goBack')) {
		$('#demonBtn').removeClass('selectedFilter');
		$('.demonDiff').removeClass('selectedFilter');
		savedFilters.demonDiff = false;
		savedFilters.diff = [];
		return hideDemonDiffs();
	}

	$(this).toggleClass('selectedFilter');

	filters = getDiffFilters();

	const minusCheck = filters.filter(filterItem => +filterItem < 0);
	if (minusCheck.length || $(this).hasClass('demonDiff')) {
		filters = minusCheck;
		$('.diffDiv').removeClass('selectedFilter');
		$(this).addClass('selectedFilter');
	}

	savedFilters.diff = getDiffFilters();
	savedFilters.demonDiff = demonMode;

	if ($(this).attr('diff') == "-2") showDemonDiffs();
});

$('.lengthDiv').on("click", function() {
	$(this).toggleClass('selectedFilter');
	savedFilters.len = $('.lengthDiv.selectedFilter').map(function() { return $(this).attr('len') }).toArray();
	savedFilters.starred = $('#starCheck').hasClass('selectedFilter');
	if (!savedFilters.starred) delete savedFilters.starred;
});

$(document).on("keydown", function(k) {
	let searchFocus = $(':focus-visible').length == 1 && $(':focus-visible').first().attr('id') == "levelName";
	if ((!$(':focus-visible').length || searchFocus) && k.which == 13) { // enter
		if (!$('#customlist').is(':hidden')) k.preventDefault();
		else if ($('#filters').is(':hidden')) $('#searchBtn').trigger('click');
	}
});

$('#pageSize').on('input blur', function (event) {
	const value = +($(this).val() || "0");
	const max = 250;
	const min = 1;
	if (event.type == "input") {
		if (value > max || value < min) $(this).addClass('red');
		else $(this).removeClass('red');
	}
	else {
		$(this).val(Math.max(Math.min(Math.floor(value), max), min));
		$(this).removeClass('red');
	}
	$('#listLevels').trigger('input');
});

const listMsg = $('#listInfo').html()
$('#listLevels, #listName').on('input blur', function (event) {
	let levels = ($('#listLevels').val() || "")
		.toString()
		.replace(/\n| /g, ",")
		.split(",")
		.map(levelID => levelID.replace(/[^0-9]/g, ""))
		.filter(levelID => +levelID > 0 && +levelID < 100000000000);
	levels = undupe(levels);

	if (levels.length > 1 && levels.length <= 100) {
		$('#listInfo').html(`A list of <cy>${levels.length}</cy> levels will be created.`);
		$('#listLink').attr('href', `/search/${levels.join(",")}?list&count=${+($('#pageSize').val() || "0")}${($('#listName').val() as string[])?.length ? `&header=${encodeURIComponent(($('#listName').val() || "").toString())}` : ""}`);
		$('#createList').removeClass('disabled');
	}

	else {
		$('#createList').addClass('disabled');
		if (levels.length > 100) $('#listInfo').html('Custom lists have a max of 100 levels!');
		else if (levels.length == 1) $('#listInfo').html("Please enter more than one level!");
		else $('#listInfo').html(listMsg);
	}
});

$(document).on('change', 'input[url]', function () {
	savedFilters.checked = $('input[url]:checked').map(function() {
		return $(this).attr('id')?.slice(4);
	}).toArray();
	checkExtraFilters();
});

$('#normalSong').on("click", function() {
	customSong = false;
	savedFilters.defaultSong = true;
	savedFilters.song = officialSong;
	$('#customSong').addClass('gray');
	$('#normalSong').removeClass('gray');
	$('#songSelect').show();
	$('#songID').hide();
	checkExtraFilters();
});

$('#customSong').on("click", function() {
	customSong = true;
	delete savedFilters.defaultSong;
	savedFilters.song = Number(($('#songID').val() || "").toString().slice(0, 16)) || 0;
	$('#normalSong').addClass('gray');
	$('#customSong').removeClass('gray');
	$('#songID').show();
	$('#songSelect').hide();
	checkExtraFilters();
});

$('#songID').on('input change blur', function() {
	savedFilters.song = Number(($(this).val() || "").toString().slice(0, 16));
	checkExtraFilters();
});

/**
 * Retrieve all the current filters, and then put it into LocalStorage.
 */
function saveFilters() {
	localStorage.filters = JSON.stringify(savedFilters);
}

/**
 * Clear all the current filters (songs, difficulties, name, etc.).
 */
function clearFilters() {
	$('.selectedFilter').removeClass('selectedFilter');
	$('input[url]').prop('checked', false);
	$('#songID').val("");
	$('#levelName').val("");
	$('#customSong').trigger("click");
	hideDemonDiffs();
	officialSong = 1;
	savedFilters = { diff: [], len: [], checked: [] };
	delete localStorage.saveFilters;
	checkExtraFilters();
}

/**
 * Check for additional (advanced) options, and turns the plus button blue
 */
function checkExtraFilters() {
	const hasExtra = savedFilters.checked.length || savedFilters.defaultSong || savedFilters.song > 0;
	$('#showFilters').attr('src', `/assets/plus${hasExtra ? "_blue" : ""}.png`);
}

let savedFilters = JSON.parse(localStorage.filters || "{}");
$('input[url]').prop('checked', false);

if (!savedFilters.diff) savedFilters.diff = [];
else if (savedFilters.demonDiff) {
	showDemonDiffs();
	$(`.demonDiff[diff=${savedFilters.diff}]`).trigger('click');
}
else if (savedFilters.diff[0] == -2) {
	$('.diffDiv[diff=-2]').first().addClass('selectedFilter');
	showDemonDiffs();
}
else (savedFilters.diff.forEach(difficulty => $(`.diffDiv:not(.demonDiff)[diff=${difficulty || "-"}]`).addClass('selectedFilter')));

if (!savedFilters.len) savedFilters.len = [];
else (savedFilters.len.forEach(length => $(`.lengthDiv[len=${length}]`).addClass('selectedFilter')));

if (savedFilters.starred) $('#starCheck').addClass('selectedFilter');

if (!savedFilters.checked) savedFilters.checked = [];
else (savedFilters.checked.forEach(checked => $(`input[id=box-${checked}]`).prop('checked', true)));

const hadDefaultSong = savedFilters.defaultSong;
if (savedFilters.defaultSong) {
	officialSong = +savedFilters.song || 1;
	$('#normalSong').trigger('click');
}
else if (+savedFilters.song && +savedFilters.song > 0) $('#songID').val(savedFilters.song);

checkExtraFilters();

Fetch(`/api/music`).then((music: [string, string][]) => {

	$('#songName').html("1: " + music[1][0]);

	$(document).on('click', '.songChange', function () {
		officialSong += Number($(this).attr('jump'));
		if (officialSong < 1) officialSong = 1;
		// There was once a check here
		// If the song ID is `69`, say `Nice` instead of `Unknown`
		// Removed for obvious reasons
		$('#songName').html(`${officialSong}: ${music[officialSong] ? music[officialSong][0] : "Unknown"}`);
		savedFilters.song = officialSong;
		savedFilters.defaultSong = true;
		checkExtraFilters();
	});

	if (hadDefaultSong) {
		checkExtraFilters();
		$('.songChange').trigger('click');
	}

	$(document).on("keydown", function(k) {
		if (customSong) return;
		if (k.which == 37) $('#songDown').trigger('click'); // left
		if (k.which == 39) $('#songUp').trigger('click');   // right
	});

	if (serverMetadata.onePointNine) {
		$('#userSearch').hide();
		$('#followedSearch').addClass('menuDisabled');
		$('#levelName').css('width', '76%');
	}

	if (serverMetadata.gdps) Fetch(`/api/gdps?current=1`).then((res: ISafeServers) => {
		if (res.demonList) $('#demonList').show();
	});
	else $('#demonList').show();
});

$("#clearFilters").on("click", clearFilters);