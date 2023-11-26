/**
 * @fileoverview Site-specific script for the level comments page.
 */

import { Fetch, toggleEscape, serverMetadata } from "../misc/global.js";
import { ErrorObject } from "../types/miscellaneous.js";
import { renderIcons } from "../iconkit/icon.js";
import { Handlebars } from "../vendor/index.js";
import { Player } from "../classes/Player.js";
import { Level } from "../classes/Level.js";
import { ICommentContent } from "../types/comments.js";

const commentEntryTemplateString = await fetch("/templates/comments_commentEntry.hbs").then(res => res.text());
const commentEntryTemplate = Handlebars.compile(commentEntryTemplateString);

/**
 * Interface for a comment preset.
 */
interface ICommentPreset {
	/**
	 * The comment filtering mode.
	 * 
	 * @example "top"
	 */
	mode: string;
	/**
	 * Whether compact mode is enabled.
	 */
	compact: boolean;
}
/**
 * Append comments to the display.
 * @param res A list of comments, or an error object.
 */
function addComments(res: ErrorObject | (ICommentContent | (ICommentContent & Player))[]) {
   if (("commentHistory" in lvl) && history && lvl.commentHistory != "all") $('#pageUp').hide();

   if ("error" in res || (("commentHistory" in lvl) && history && lvl.commentHistory != "all")) {
	   loadingComments = false;
	   $('#loading').hide();
	   return;
   }

   commentCache[page] = res;

   res.forEach((comment, index) => {
	   $(`#date-${comment.ID}`).html(comment.date);
	   $(`#likes-${comment.ID}`).html(comment.likes.toString());
	   // TODO: Avoid these raw HTML manipulations
	   $(`#thumb-${comment.ID}`)
		   .attr('style', comment.likes < 0 ? `transform: translateY(${compact ? '15' : '25'}%); margin-right: 0.4%; height: 4vh;` : 'height: 4vh;')
		   .attr('src', `/assets/${comment.likes < 0 ? "dis" : ""}like.png`);
	   if ($(`.comment[commentID=${comment.ID}]`).length) return; // auto mode, ignore duplicates

	   const noAutoBgCol = index % 2 ? "evenComment" : "oddComment";
	   const autoBgCol = $('.commentBG').first().hasClass('oddComment') ? "evenComment" : "oddComment";
	   const bgCol = auto ? autoBgCol : noAutoBgCol;

	   const userName = (!history && "username" in comment) ? comment.username : ("username" in lvl ? lvl.username : "");
	   const modNumber = ("moderator" in comment ? comment.moderator : 0) || ("moderator" in lvl ? lvl.moderator : 0);
	   const equivalentPlayerIDs = !history && "playerID" in comment && comment.playerID == lvl.playerID;

	   if (comment.pages) {
		   lastPage = comment.pages;
		   $('#pagenum').html(`Page ${page + 1} of ${comment.pages}`);
		   if (page + 1 >= comment.pages) $('#pageUp').hide();
		   else $('#pageUp').show();
	   }

	   const commentHTML = commentEntryTemplate({
		   compact,
		   bgCol,
		   comment,
		   notRegistered: !("accountID" in comment) || !comment.accountID || comment.accountID == "0",
		   userName,
		   moderator: modNumber > 0,
		   moderatorRole: modNumber > 2 ? "-extra" : modNumber == 2 ? "-elder" : "",
		   commentColor: equivalentPlayerIDs ? "255,255,75" : comment.browserColor ? "255,180,255" : comment.color,
		   history,
		   disliked: comment.likes < 0
	   });

	   if (auto) $('#commentBox').prepend(commentHTML);
	   else $('#commentBox').append(commentHTML);
   });

   $('.commentText').each(function() {
	   if ($(this).text().length > 100) {
		   let overflow = ($(this).text().length - 100) * 0.01;
		   $(this).css('font-size', (3.5 - (overflow)) + 'vh');
	   }
   });

   renderIcons();
   $('#loading').hide();
   loadingComments = false;
}

/**
 * Wrapper function for inserting comments/profile posts.
 * @param auto Whether to auto-load comments.
 * @param noCache Whether to cache comment data.
 */
function appendComments(auto?: boolean, noCache?: boolean) {
	if (loadingComments) return;
	else loadingComments = true;

	if (!auto) {
		$('#commentBox').html(`<div class="supercenter" id="loading" style="height: 12%;"><img class="spin noSelect" src="/assets/loading.png" style="height: 105%;"></div>`);
	}

	if (page == 0) {
		$('#pageDown').hide();
		$('#firstPage').hide();
		$('#refreshButton').show();
	}
	else {
		$('#pageDown').show();
		if (!history) {
			$('#firstPage').show();
			$('#refreshButton').hide();
		}
	}

	if (!noCache && commentCache[page]) addComments(commentCache[page]);
	fetch(`/api${!history ? window.location.pathname : "/comments/" + lvl.playerID}?count=${compact && !auto ? 20 : 10}&page=${page}${history ? "&type=commentHistory" : ""}&${mode}`)
		.then((res) => res.json())
		.then(addComments);
}

/**
 * Reset all sorting options (live mode, compact mode, etc.).
 */
function resetSort() {
	page = 0;
	auto = false;
	if (interval) clearInterval(interval);
	Object.keys(commentCache).forEach(function(k) {
		delete commentCache[k];
	});
	$('#liveText').hide();
	$('#autoMode').attr('src', `/assets/playbutton.png`);
}

const messageText = 'Your <cy>Geometry Dash password</cy> will <cg>not be stored</cg> anywhere on the site, both <ca>locally and server-side.</ca> You can view the code used for posting a comment <a class="menuLink" target="_blank" href="https://github.com/GDColon/GDBrowser/blob/master/api/post/postComment.js">here</a>.';
let { mode, compact }: ICommentPreset = JSON.parse(localStorage.getItem('commentPreset') || '{"mode": "top", "compact": true}');
$('#message').html(messageText);
$('#likeMessage').html(messageText.replace("posting", "liking").replace("postComment", "like"));


const rawLvlID = window.location.pathname.split('/')[2];
if (+rawLvlID > 999999999 || +rawLvlID < -999999999) {
	window.location.href = window.location.href.replace("comments", "search");
}
const lvlID = Number.isInteger(+rawLvlID) ? Math.round(+rawLvlID).toString(): rawLvlID;

let page = 0;
let loadingComments = true;
let like = true;
let lastPage = 0;
let auto = false;
let interval: null | NodeJS.Timeout = null;

const commentCache: Record<number, ICommentContent[]> = {};
const history = !Number.isInteger(+lvlID);
const target = Number.isInteger(+lvlID) ? `/api/level/${lvlID}` : `/api/profile/${lvlID}`;

if (mode == "top") {
	mode = "top";
	$('#topSort').attr('src', "/assets/sorting/likes-on.png")
}
else $('#timeSort').attr('src', "/assets/sorting/time-on.png")

$('#compactMode').attr('src', `/assets/compact-${compact ? "on" : "off"}.png`);

const lvl: Level | Player = await Fetch(target).catch(e => {
	loadingComments = false;
	console.error(e.message);
});

if (serverMetadata.gdps) {
	$('#leaveComment').hide();
	$('#postComment').remove();
}

if (history) {
	$('#autoMode').remove();
	$('#lastPage').hide();

	if (!("username" in lvl)) {
		window.location.href = window.location.href.replace("comments", "search");
		throw new Error("Can't redirect to the search page!");
	}

	$('#levelName').text(lvl.username + "'s comments");
	$('#leaveComment').hide();
	document.title = lvl.username + "'s comments";

	$('#meta-title').attr('content', lvl.username + "'s comment history");
	$('#meta-desc').attr('content',  `View all of ${lvl.username}'s Geometry Dash comments!`);
}

else {
	if (lvl.accountID == undefined) $('#levelAuthor').remove();
	else if (lvl.accountID == "0") {
		$('#levelAuthor').addClass("green").addClass("unregistered");
		$('#authorLink').attr('href', '/search/' + lvl.playerID + "?user");
	}
	else $('#authorLink').attr('href', `/u/${lvl.accountID}.`);
	if ("name" in lvl) {
		$('#levelName').text(lvl.name || ("Nonexistent level " + lvlID));
		$('#levelAuthor').text("By " + (lvl.author || "-"));
		$('#levelVersion').text("Version: " + (lvl.version || 0));
		document.title = "Comments for " + (lvl.name || lvlID);

		$('#levelID').text("ID: " + lvlID);
		if (lvl.name) {
			$('#meta-title').attr('content', `Comments for ${lvl.name}`);
			$('#meta-desc').attr('content',  `View all the comments for ${lvl.name} by ${lvl.author || "Unknown"}!`);
		}
		if (!lvl.name) $('#leaveComment').hide();
		if (lvl.accountID && lvl.author != "-") {
			if (lvl.id) $('#levelLink').attr('href', '/level/' + lvl.id);
			else $('#levelID').removeClass("gdButton");
		}
	}
}

loadingComments = false;
appendComments();

$('#pageUp').on("click", function() {
	if (loadingComments) return;
	page += 1;
	appendComments();
});
$('#pageDown').on("click", function() {
	if (loadingComments) return;
	page -= 1;
	appendComments();
});
$('#lastPage').on("click", function() {
	if (loadingComments || auto) return;
	page = lastPage - 1;
	appendComments();
});

$('#topSort').on("click", function() {
	if (mode == "top" || loadingComments) return;
	resetSort();
	mode = "top";
	$('#timeSort').attr('src', "/assets/sorting/time.png");
	$('#topSort').attr('src', "/assets/sorting/likes-on.png");
	appendComments();
});

$('#timeSort').on("click", function() {
	if (mode == "time" || loadingComments) return;
	resetSort();
	mode = "time";
	$('#timeSort').attr('src', "/assets/sorting/time-on.png");
	$('#topSort').attr('src', "/assets/sorting/likes.png");
	appendComments();
});

$('#compactMode').on("click", function() {
	if (loadingComments) return;
	compact = !compact;
	lastPage = 0;
	page = 0;
	$('#compactMode').attr('src', `/assets/compact-${compact ? "on" : "off"}.png`);
	appendComments();
});

$('#autoMode').on("click", function() {
	if (loadingComments) return;
	auto = !auto;
	mode = "time";
	page = 0;
	$('#timeSort').attr('src', "/assets/sorting/time-on.png");
	$('#topSort').attr('src', "/assets/sorting/likes.png");

	if (auto) {
		document.title = "[LIVE] " + document.title;
		$('#liveText').show();
		$('#autoMode').attr('src', `/assets/stopbutton.png`);
		interval = setInterval(function() {
			appendComments(true);
		}, 3000);
	}
	else {
		document.title = document.title.slice(6);
		$('#liveText').hide();
		$('#autoMode').attr('src', `/assets/playbutton.png`);
		if (interval) clearInterval(interval);
	}
	appendComments(true, true);
});

$(document).on('click', '.refreshBtn', function () {
	if (loadingComments) return;
	lastPage = 0;
	page = 0;
	appendComments(false, true);
});

$('#content').on('input', function() {
	let remaining = 150 - $('#content').val()!.toString().length;
	$('#charcount').text(remaining);
});

$('#submitComment').on("click", function() {
	const comment = $('#content').val();
	const username = $('#username').val();
	const password = $('#password').val();
	const levelID = window.location.pathname.split('/')[2];
	let accountID = 0;

	// Was `content` intentional
	if (!comment || !username || !password || loadingComments) {
		return $('#postComment').hide();
	}

	$('#message').text("Posting comment...");
	$('.postbutton').hide();
	toggleEscape(false);

	fetch(`/api/profile/${username}`).then(res => res.json()).then(res => {
		if (!res || "error" in res) {
			toggleEscape(true);
			$('.postbutton').show();
			return $('#message').text("The username you provided doesn't exist!");
		}
		else accountID = res.accountID;

		$.post("/postComment",  {comment, username, password, levelID, accountID, color: true}).done(() => {
			$('#content').val("");
			$('#postComment').hide();
			$('.postbutton').show();
			$('#message').html(messageText);
			$('#timeSort').attr('src', "/assets/sorting/time-on.png");
			$('#topSort').attr('src', "/assets/sorting/likes.png");
			toggleEscape(true);
			mode = "time";
			page = 0;
			appendComments();
		}).fail(e => {
			toggleEscape(true);
			$('.postbutton').show();
			$('#message').text(e.responseText.includes("DOCTYPE") ? "Something went wrong..." : e.responseText);
		});
	});
});

// Man, Colon's addicted to that random TheFatRat song.
$('#likebtn').on("click", function() {
	$('#likebtn').removeClass('youAreNotTheOne');
	$('#dislikebtn').addClass('youAreNotTheOne');
	like = true;
});

$('#dislikebtn').on("click", function() {
	$('#likebtn').addClass('youAreNotTheOne');
	$('#dislikebtn').removeClass('youAreNotTheOne');
	like = false;
});

let commentID = "0";
let lvID = "0";
let likeCount: JQuery<HTMLElement>, likeImg: JQuery<HTMLImageElement>;
let likedComments: string[];

$(document).on('click', '.likeComment', function(cmnt) {
	if (serverMetadata.gdps) return;
	commentID = $(this).attr('commentID') || "0";

	likedComments = localStorage.likedComments ? JSON.parse(localStorage.likedComments) : [];
	if (likedComments.includes(commentID)) return;

	lvID = $(this).attr('levelID') || "0";
	likeImg = $(this).find('img');
	likeCount = $(this).parent().find('h3:not(.gold)');
	$('#likeComment').show();
});

$('#submitVote').on("click", function() {
	// The thing is: this is insecure. But the game itself also does this.
	if (likedComments.includes(commentID)) {
		return $('#likeMessage').text("You've already liked/disliked this comment!");
	}

	const ID = commentID;
	const username = $('#like-username').val();
	const password = $('#like-password').val();
	const extraID = lvID || window.location.pathname.split('/')[2];
	const likeType = like ? "1" : "0";
	let accountID = 0;

	if (!ID || !username || !password || loadingComments) {
		return $('#postComment').hide();
	}

	$('#likeMessage').text(like ? "Liking..." : "Disliking... :(");
	$('.postbutton').hide();
	toggleEscape(false);

	fetch(`/api/profile/${username}`).then(res => res.json()).then(res => {
		if (!res || "error" in res) {
			toggleEscape(true);
			$('.postbutton').show();
			return $('#likeMessage').text("The username you provided doesn't exist!");
		}
		else accountID = res.accountID;

		$.post("/like",  { ID, accountID, password, like: likeType, type: 2, extraID }).done(() => {
			let newCount = parseInt(likeCount.text()) + (like ? 1 : -1);
			likeCount.text(newCount);
			if (newCount < 0) likeImg.attr('src', '/assets/dislike.png').css('transform', compact ? 'translateY(15%)' : 'translateY(25%)');
			else likeImg.attr('src', '/assets/like.png').removeAttr('style');
			likeImg.css("height", "4vh");
			$('#likeComment').hide();
			$('#likebtn').trigger('click');
			$('.postbutton').show();
			$('#likeMessage').html(messageText.replace("posting", "liking").replace("postComment", "like"));
			toggleEscape(true);
			likedComments.push(commentID);
			localStorage.setItem('likedComments', JSON.stringify(likedComments));
		}).fail(e => {
			toggleEscape(true);
			$('.postbutton').show();
			$('#likeMessage').text(e.responseText.includes("DOCTYPE") ? "Something went wrong..." : e.responseText);
		});
	});
});

$(window).on('beforeunload ', function() {
	localStorage.setItem('commentPreset', JSON.stringify({mode, compact}));
});

$('#postComment').on("change keyup keydown paste click", "textarea", function () {
	$('#content').val($('#content').val()!.toString().replace(/[^\S ]+/g, ""));
});

$(document).on("keydown", function(k) {
	if ($('#content').is(':visible')) {
		if (k.which == 13) k.preventDefault(); //enter
	}

	if (loadingComments || $('.popup').is(":visible")) return;

	if (k.which == 37 && $('#pageDown').is(":visible")) { //left
		$('#pageDown').trigger('click');
	}

	if (k.which == 39 && $('#pageUp').is(":visible")) { //right
		$('#pageUp').trigger('click');
	}
});

export {};