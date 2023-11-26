/**
 * @fileoverview Site-specific script for the level info page.
 */

import { ErrorObject } from "../types/miscellaneous.js";

const levelID: string = $('#dataBlock').data('id');
const levelNextDaily: string = $('#dataBlock').data('nextdaily');
const levelSongID: string = $('#dataBlock').data('songid');

const messageText = 'Your <cy>Geometry Dash password</cy> will <cg>not be stored</cg> anywhere on the site, both <ca>locally and server-side.</ca> You can view the code used for liking a level <a class="menuLink" target="_blank" href="https://github.com/GDColon/GDBrowser/blob/master/api/post/like.js">here</a>.';
$('#message').html(messageText);

let levelSaved = false;
let copies = 0;
let animated = false;
let freeze = false;
let dailyTime = Number(levelNextDaily) || 0;

/**
 * Format a duration in Colon's favorite format.
 * @param secs The total number of seconds.
 * @param timeUp If set to `true`, return "Time's up!" if the number of seconds is 0.
 * @returns The formatted time string.
 */
function colonize(secs: number, timeUp: boolean) {
	if (secs < 0) {
		if (timeUp) return "Time's up!";
		else secs = 0;
	}
	const days = Math.floor(secs / 86400);
	if (days) secs -= days * 86400;
	return `${days ? `${days}d + ` : ""}${[Math.floor(+secs / 3600), Math.floor(+secs / 60) % 60, +secs % 60].map(v => v < 10 ? "0" + v : v).filter((v,i) => v !== "00" || i > 0).join(":")}`;
}

if (window.location.href.endsWith('?download')) {
	$('#infoDiv').show();
}

const copyMessages = [
	"ID copied to clipboard", "ID copied x[C]!", "ID copied again!",
	"ID copied once more!", "ID clipboard to copied!", "ID copied yet again!",
	"As you wish", "Copy that!", "This one actually works", "You can't play levels, son",
	"Keep it coming", "Click again, I dare you", "C-C-C-C-COPIED!", "Get a life", "...",
	"bruh moment", "Etched into thy's memory!", "h", "I feel physical pain",
	"Play it in GD!", levelID, "go away", "Every copy costs 2 cents!", "Un-copied!",
	"Copied++", "C O P I E D", "help me please", "Open GD to play the level!",
	"pretend you're playing it", "Anotha one!"
];

$('#playButton').on("click", function () {
	if (!($('#copied').is(':animated')) && !animated) {
		animated = true;
		copies += 1;
		$('#copied').stop().fadeIn(200).delay(500).fadeOut(500, function() {
			animated = false;
			if (copies > 1) {
				$('#copiedText')
					.text(copyMessages[Math.floor(Math.random() * (copies > 4 ? copyMessages.length : 6))]
					.replace("[C]", copies.toString()));
			}
		});
	}
	var temp = $("<input>");
	$("body").append(temp);
	temp.val(levelID).select();
	document.execCommand("copy");
	temp.remove();
});

$('.closeWindow').on("click", function () {
	if (!freeze) {
		$(".popup").attr('style', 'display: none;');
	}
});

if (dailyTime) {
	$('#dailyTime').html(` (${colonize(dailyTime, true)})`);
	setInterval(() => {
		dailyTime -= 1;
		$('#dailyTime').html(` (${colonize(dailyTime, true)})`);
	}, 1000);
}

if ($("#additional").hasClass('downloadDisabled')) {
	$('#analyzeLink').removeAttr('href');
	$('#analyzeBtn').on("click", function() {
		$('#analyzeDisabled').show();
	});
}

if (window.location.pathname == "/level/weekly") {
	$('body').addClass('darkBG');
	$('.cornerPiece').addClass('grayscale');
}

$(window).on('load', function() {
	const boxWidth = $('#songBox').width();
	const nameWidth = $('#songname')[0].scrollWidth;
	if (nameWidth > (boxWidth || 0)) {
		let overflow = (nameWidth - (boxWidth || 0)) * 0.007;
		if (overflow > 3) overflow = 3;
		$('#songname').addClass('smaller').css('font-size', (6 - (overflow)) + 'vh');
	}
});

let savedLevels: string[] = JSON.parse(localStorage.getItem('saved') || '[]');
let deleteMode = false;
if (savedLevels.includes(levelID)) {
	$('#saveButton').attr('src', '/assets/delete.png');
	levelSaved = true
}

/**
 * Push this level into the saved levels list.
 */
function saveLevel() {
  savedLevels.push(levelID);
  localStorage.setItem('saved', JSON.stringify(savedLevels));
}

/**
 * If the level is saved, modify the button to delete the level from the saved list instead.
 */
function savedLevel() {
	$('#saveButton').attr('src', '/assets/delete.png');
	$('.popup').hide();
	levelSaved = true;
}

/**
 * Delete this level from the saved levels list.
 */
function deleteLevel() {
	savedLevels = savedLevels.filter(function(el) {
		return el != levelID;
	});
	localStorage.setItem('saved', JSON.stringify(savedLevels));
	$('#saveButton').attr('src', '/assets/plus.png');
	$('.popup').hide();
	levelSaved = false;
}

$('#checkSong').on("click", function() {
	$('#checkSong').hide();
	$('#songLoading').show();
	fetch(`/api/song/${ levelSongID }`).then(res => res.json()).then((info: boolean | ErrorObject) => {
		$('#songLoading').hide();
		$(info && !(typeof(info) == "object") ? '#songAllowed' : '#songNotAllowed').show().addClass('songStatus');
	});
});

$('.artistIcon').hover(function() {
	const title = $(this).attr('title') || "";
	$('#artistInfo').css('color', title?.includes("NOT") ? "red" : "lime");
	$('.songStatus').hide();
	$('#artistInfo').show();
	$('#artistInfo').text(title);
}, function() {
	$('#artistInfo').hide();
	$('.songStatus').show();
});

$("#confirmDelete").on("click", deleteLevel);

$("#saveButton").on("click", function() {
	if (levelSaved) {
		$("#deleteDiv").show();
	} 
	else {
		saveLevel();
		$("#saveDiv").show();
	}
});

$("#infoButton").on("click", function() {
	$("#infoDiv").show();
});

$("#checkSaved").on("click", savedLevel);

export {};