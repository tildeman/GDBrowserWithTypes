/**
 * @fileoverview Site-specific script for the user profile page.
 */

import { Fetch, toggleEscape } from "../misc/global.js";
import { ErrorObject } from "../types/miscellaneous.js";
import { ICommentContent } from "../types/comments.js";
import { renderIcons } from "../iconkit/icon.js";
import { Handlebars } from "../vendor/index.js";
import { Player } from "../classes/Player.js";

/**
 * Add comment items to the container box.
 */
function appendComments() {
	if (loadingComments) return;
	else loadingComments = true;

	$('#statusDiv').html(`<div class="supercenter" id="loading" style="height: 12%; top: 62%;"><img class="spin noSelect" src="/assets/loading.png" style="height: 105%;"></div>`);

	if (profilePage == 0) $('#pageDown').hide();
	else $('#pageDown').show();

	Fetch(`/api/comments/${accountID}?type=profile&page=${profilePage}`).then(res => {

		if (res.length != 10) $('#pageUp').hide();
		else $('#pageUp').show();

		if ("error" in res) return $('#loading').hide();

		res.forEach((commentItem: ICommentContent) => {
			$("#statusDiv").append(commentEntryTemplate({
				statusIcon: $('#mainIcon').find('img').attr('src') || "",
				compactMode,
				accountUsername,
				commentColor: accountUsername == "RobTop" ? "50, 255, 255" : accountModerator == "2" ? "75, 255, 75" : commentItem.browserColor ? "255, 180, 255" : "255, 255, 255",
				commentItem,
				disliked: commentItem.likes < 0
			}));
		});

		$('.commentText').each(function() {
			if ($(this).text().length > 100) {
				let overflow = ($(this).text().length - 100) * 0.01;
				$(this).css('font-size', (3.5 - (overflow)) + 'vh');
			}
		});
		$('#loading').hide();
	});
	loadingComments = false;
}

const commentEntryTemplateString = await fetch("/templates/profile_commentEntry.hbs").then(res => res.text());
const commentEntryTemplate = Handlebars.compile(commentEntryTemplateString);

const messageText = 'Your <cy>Geometry Dash password</cy> will <cg>not be stored</cg> anywhere on the site, both <ca>locally and server-side.</ca> You can view the code used for profile posts <a class="menuLink" target="_blank" href="https://github.com/GDColon/GDBrowser/blob/master/api/post/postProfileComment.js">here</a>.';
const accountID: string = $('#dataBlock').data('accountid').toString();
const accountUsername: string = $('#dataBlock').data('username');
const accountModerator: string = $('#dataBlock').data('moderator');

let followed: string[] = localStorage.followed ? JSON.parse(localStorage.followed) : [];
let profilePage = 0;
let loadingComments = false;

let commentID = "0", lvID: number;
let likeCount: JQuery<HTMLElement>, likeImg: JQuery<HTMLImageElement>;
let likedComments: string[];
let like = true;

// TODO: Use URI paramters instead
// remove ID from URL
if (window.location.pathname.endsWith(".")) {
	window.history.pushState({}, "", window.location.origin + `/u/${accountUsername}`);
}

// icons! (god this code sucks)
renderIcons();

// set favicon
$('#mainIcon').on('DOMNodeInserted', 'img', function () {
	$("link[rel='icon']").attr("href", $(this).attr("src") || "");
});

$('#message').html(messageText);
$('#likeMessage').html(messageText.replace("profile posts", "liking posts").replace("postProfileComment", "like"));

if (followed.includes(accountID)) {
	$('#followOff').hide();
	$('#followOn').show();
}

appendComments();

$('#followOff').on("click", function() {
	followed = localStorage.followed ? JSON.parse(localStorage.followed) : [];
	followed.push(accountID);
	localStorage.followed = JSON.stringify(followed);
	$('#followOff').hide();
	$('#followOn').show();
});

$('#followOn').on("click", function() {
	followed = localStorage.followed ? JSON.parse(localStorage.followed) : [];
	localStorage.followed = JSON.stringify(followed.filter(followedID => followedID != accountID));
	$('#followOff').show();
	$('#followOn').hide();
});

$('#content').on('input', function() {
	const contentValue = $('#content').val();
	let remaining: number;
	if (!contentValue) return 0;
	if (typeof(contentValue) == "number") {
		remaining = 180 - contentValue;
	}
	else {
		remaining = 180 - contentValue.length;
	}
	$('#charcount').text(remaining);
});

$('#submitComment').on("click", function () {
	const comment = $('#content').val();
	const username = accountUsername;
	const password = $('#password').val();
	if (!comment || !password || loadingComments) return $('#leavePost').hide();
	$('#message').text("Posting...");
	$('.postbutton').hide();
	toggleEscape(false);
	$.post("/postProfileComment", { comment, username, password, accountID, color: true })
		.done(() => {
			$('#content').val("");
			$('#leavePost').hide();
			$('.postbutton').show();
			$('#message').html(messageText);
			toggleEscape(true);
			profilePage = 0;
			appendComments();
		})
		.fail(e => {
			toggleEscape(true);
			$('.postbutton').show();
			$('#message').text(e.responseText.includes("DOCTYPE") ? "Something went wrong..." : e.responseText);
		});
});

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

$(document).on('click', '.likeComment', function() {
	commentID = $(this).attr('commentID') || "0";

	likedComments = localStorage.likedComments ? JSON.parse(localStorage.likedComments) : [];
	if (likedComments.includes(commentID)) return;

	lvID = +($(this).attr('levelID') || "") || 0;
	likeImg = $(this).find('img');
	likeCount = $(this).parent().find('h3:not(.gold)');
	$('#likeComment').show();
});

$('#submitVote').on("click", function() {
	// This is how the game itself identifies voters. It's insecure.
	if (likedComments.includes(commentID)) {
		return $('#likeMessage').text("You've already liked/disliked this comment!");
	}

	const ID = commentID;
	const username = $('#like-username').val();
	const password = $('#like-password').val();
	const likeType = like ? "1" : "0";
	let accountID = "0";

	if (!ID || !username || !password || loadingComments) {
		return $('#postComment').hide();
	}

	$('#likeMessage').text(like ? "Liking..." : "Disliking... :(");
	$('.postbutton').hide();
	toggleEscape(false);

	Fetch(`/api/profile/${username}`).then((res: Player | ErrorObject) => {
		if (!res || "error" in res) {
			toggleEscape(true);
			$('.postbutton').show();
			return $('#likeMessage').text("The username you provided doesn't exist!");
		}
		else accountID = res.accountID;

		$.post("/like",  { ID, accountID, password, like: likeType, type: 3, extraID: accountID })
			.done(() => {
				const newCount = parseInt(likeCount.text()) + (like ? 1 : -1);
				likeCount.text(newCount);
				if (newCount < 0) likeImg.attr('src', '/assets/dislike.png').css('transform', compactMode ? 'translateY(15%)' : 'translateY(25%)');
				else likeImg.attr('src', '/assets/like.png').removeAttr('style');
				$('#likeComment').hide();
				$('#likebtn').trigger('click');
				$('.postbutton').show();
				$('#likeMessage').html(messageText.replace("profile posts", "liking posts").replace("postProfileComment", "like"));
				toggleEscape(true);
				likedComments.push(commentID);
				localStorage.setItem('likedComments', JSON.stringify(likedComments));
			})
			.fail(e => {
				toggleEscape(true);
				$('.postbutton').show();
				$('#likeMessage').text(e.responseText.includes("DOCTYPE") ? "Something went wrong..." : e.responseText);
			});
	});
});

let compactMode = false;
$('#compactMode').on("click", function() {
	compactMode = !compactMode;
	if (compactMode) {
		$('.profilePostHide').hide();
		$('.statusIcon').show();
		$('#statusDiv').css('height', $('#statusDiv').attr('compactHeight') || "");
		$(this).attr('src', "/assets/expanded-on.png");
	}

	else {
		$('.profilePostHide').show();
		$('.statusIcon').hide();
		$('#statusDiv').css('height', $('#statusDiv').attr('normalHeight') || "0");
		$(this).attr('src', "/assets/expanded-off.png");
	}
});

$('#leavePost').on("change keyup keydown paste click", "textarea", function () {
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