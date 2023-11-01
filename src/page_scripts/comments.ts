/**
 * @fileoverview Site-specific script for the level comments page.
 */

import { Level } from "../classes/Level.js";
import { Player, PlayerIcon } from "../classes/Player.js";

interface CommentItem {
	content: string;
	ID: string;
	likes: number;
	date: string;
	username: string;
	playerID: string;
	accountID?: string;
	icon: PlayerIcon;
	col1RGB: Color3B;
	col2RGB: Color3B;
	levelID: string;
	moderator?: number;
	color?: string;
	results?: number;
	pages?: number;
	range?: string;
	percent?: number;
	browserColor?: boolean;
}

let {mode, compact} = JSON.parse(localStorage.getItem('commentPreset') || '{"mode": "top", "compact": true}');
let messageText = 'Your <cy>Geometry Dash password</cy> will <cg>not be stored</cg> anywhere on the site, both <ca>locally and server-side.</ca> You can view the code used for posting a comment <a class="menuLink" target="_blank" href="https://github.com/GDColon/GDBrowser/blob/master/api/post/postComment.js">here</a>.';
$('#message').html(messageText);
$('#likeMessage').html(messageText.replace("posting", "liking").replace("postComment", "like"));

let lvlID = window.location.pathname.split('/')[2];
let history = false;
let page = 0;
let loadingComments = true;
let like = true;
let lastPage = 0;
let auto = false;
let interval: null | NodeJS.Timeout = null;
let commentCache = {};

let target = `/api/level/${lvlID}`;
if (+lvlID > 999999999 || +lvlID < -999999999) {
	window.location.href = window.location.href.replace("comments", "search");
}

if (!Number.isInteger(+lvlID)) {
	history = true;
	target = `/api/profile/${lvlID}`;
}
else lvlID = Math.round(+lvlID).toString();

if (mode == "top") {
	mode = "top";
	$('#topSort').attr('src', "/assets/sort-likes-on.png")
}
else $('#timeSort').attr('src', "/assets/sort-time-on.png")


// TODO: Avoid defining duplicates of `clean`
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

$('#compactMode').attr('src', `/assets/compact-${compact ? "on" : "off"}.png`);

Fetch(target).then(lvl => buildComments(lvl)).catch(e => {
	loadingComments = false;
	console.log(e.message);
});

function buildComments(lvl: Level | Player) {
	if (gdps) {
		$('#leaveComment').hide();
		$('#postComment').remove();
	}

	if (history) {
		$('#autoMode').remove();
		$('#lastPage').hide();

		if (!("username" in lvl)) {
			return window.location.href = window.location.href.replace("comments", "search");
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
		fetch(`/api${!history ? window.location.pathname : "/comments/" + lvl.playerID}?count=${compact && !auto ? 20 : 10}&page=${page}${history ? "&type=commentHistory" : ""}&${mode}`).then((res) => {
			if (res.status === 204) return [];
			return res.json();
		}).then(addComments);

		function addComments(res: -1 | CommentItem[]) {
			if (("commentHistory" in lvl) && history && lvl.commentHistory != "all") $('#pageUp').hide();

			if (res == -1 || (("commentHistory" in lvl) && history && lvl.commentHistory != "all")) {
				loadingComments = false;
				return $('#loading').hide();
			}

			commentCache[page] = res;

			res.forEach((x, index) => {
				$(`#date-${x.ID}`).html(x.date);
				$(`#likes-${x.ID}`).html(x.likes.toString());
				// TODO: Avoid these raw HTML manipulations
				$(`#thumb-${x.ID}`).attr('style', x.likes < 0 ? `transform: translateY(${compact ? '15' : '25'}%); margin-right: 0.4%; height: 4vh;` : 'height: 4vh;').attr('src', `/assets/${x.likes < 0 ? "dis" : ""}like.png`);
				if ($(`.comment[commentID=${x.ID}]`).length) return; // auto mode, ignore duplicates

				let bgCol = index % 2 ? "evenComment" : "oddComment";

				if (auto) bgCol = $('.commentBG').first().hasClass('oddComment') ? "evenComment" : "oddComment";

				const userName = !history ? x.username : ("username" in lvl ? lvl.username : "");
				const modNumber = x.moderator || ("moderator" in lvl ? lvl.moderator : 0);

				if (x.pages) {
					lastPage = x.pages;
					$('#pagenum').html(`Page ${page+1} of ${x.pages}`);
					if (page+1 >= x.pages) $('#pageUp').hide();
					else $('#pageUp').show();
				}

				////// NORMAL MODE //////

				const commentHTML = !compact ? `
					<div class="commentBG ${bgCol}">
						<div class="comment" commentID="${x.ID}">
							<div class="commentRow">
								<gdicon class="commentIcon inline" cacheID=${x.playerID} iconID=${x.icon.icon} iconForm="${x.icon.form}" col1="${x.icon.col1}" col2="${x.icon.col2}" glow="${x.icon.glow}"></gdicon>
								<a href=/${x.accountID == "0" ? `search/${x.playerID}?user` : `/u/${x.accountID}.`}>
								<h2 class="inline gdButton ${(!x.accountID || x.accountID == "0") ? "green unregistered" : ""}">${userName}</h2></a>
								${modNumber > 0 ? `<img class="inline" src="/assets/mod${modNumber > 2 ? "-extra" : modNumber == 2 ? "-elder" : ""}.png" style="margin-left: 1%; width: 3.5%">` : ""}
								<p class="commentPercent inline">${x.percent ? x.percent + "%" : ""}</p>
							</div>

							<div class="commentAlign">
								<p class="pre commentText" style="color: rgb(${!history && x.playerID == lvl.playerID ? "255,255,75" : x.browserColor ? "255,180,255" : x.color})">${clean(x.content)}</p>
							</div>
						</div>
						<p class="commentDate" id="date-${x.ID}">${x.date}</p>
						<div class="commentLikes">
							${history ? `<h3 style="margin-right: 1.5vh; pointer-events: all;" class="gold inline"><a href="/level/${x.levelID}">(${x.levelID})</a></h3>` : ""}
							<div class="inline gdButton likeComment" commentID="${x.ID}" ${x.levelID ? `levelID="${x.levelID}"` : ""}">
								<img id="thumb-${x.ID}" class="inline gdButton" ${x.likes < 0 ? "style='transform: translateY(25%); margin-right: 0.4%; height: 4vh;'" : "style='height: 4vh;'"} src="/assets/${x.likes < 0 ? "dis" : ""}like.png">
							</div>
							<h3 id="likes-${x.ID}" class="inline">${x.likes}</h3>
						</div>
					</div>`

				////// COMPACT  MODE //////

					:  `
					<div class="commentBG compactBG ${bgCol}">
						<div class="comment compact" commentID="${x.ID}">
							<div class="commentRow">
								<gdicon class="commentIcon inline" cacheID=${x.playerID} iconID=${x.icon.icon} iconForm="${x.icon.form}" col1="${x.icon.col1}" col2="${x.icon.col2}" glow="${x.icon.glow}"></gdicon>
								<a href=/${x.accountID == "0" ? `search/${x.playerID}?user` : `/u/${x.accountID}.`}>
								<h2 class="inline gdButton ${x.accountID == "0" ? "green unregistered" : ""}">${userName}</h2></a>
								${modNumber > 0 ? `<img class="inline" src="/assets/mod${modNumber > 2 ? "-extra" : modNumber == 2 ? "-elder" : ""}.png" style="margin-left: 1.2%; width: 3.2%">` : ""}
								<p class="commentPercent inline">${x.percent ? x.percent + "%" : ""}</p>
							</div>

							<div class="commentAlign">
								<p class="pre commentText" style="color: rgb(${!history && x.playerID == lvl.playerID ? "255,255,75" : x.browserColor ? "255,180,255" : x.color})">${clean(x.content)}</p>
							</div>
						</div>
						<p class="commentDate compactDate" id="date-${x.ID}">${x.date}</p>
						<div class="commentLikes">
							${history ? `<h3 style="margin-right: 0.5vh; pointer-events: all;" class="gold inline"><a href="/level/${x.levelID}">(${x.levelID})</a></h3>` : ""}
							<div class="inline gdButton likeComment" commentID="${x.ID}"${x.levelID ? `levelID="${x.levelID}"` : ""}>
								<img id="thumb-${x.ID}" class="inline" ${x.likes < 0 ? "style='transform: translateY(15%); margin-right: 0.4%; height: 4vh;'" : "style='height: 4vh;'"} src="/assets/${x.likes < 0 ? "dis" : ""}like.png">
							</div>
							<h3 id="likes-${x.ID}" class="inline">${x.likes}</h3>
						</div>
					</div>`;

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
			return;
		}
	}

	loadingComments = false;
	appendComments();

	$('#pageUp').click(function() {
		if (loadingComments) return;
		page += 1;
		appendComments();
	});
	$('#pageDown').click(function() {
		if (loadingComments) return;
		page -= 1;
		appendComments();
	});
	$('#lastPage').click(function() {
		if (loadingComments || auto) return;
		page = lastPage - 1;
		appendComments();
	});

	function resetSort() {
		page = 0;
		auto = false;
		if (interval) clearInterval(interval);
		commentCache = {};
		$('#liveText').hide();
		$('#autoMode').attr('src', `/assets/playbutton.png`);
	}

	$('#topSort').click(function() {
		if (mode == "top" || loadingComments) return;
		resetSort();
		mode = "top";
		$('#timeSort').attr('src', "/assets/sort-time.png");
		$('#topSort').attr('src', "/assets/sort-likes-on.png");
		appendComments();
	});

	$('#timeSort').click(function() {
		if (mode == "time" || loadingComments) return;
		resetSort();
		mode = "time";
		$('#timeSort').attr('src', "/assets/sort-time-on.png");
		$('#topSort').attr('src', "/assets/sort-likes.png");
		appendComments();
	});

	$('#compactMode').click(function() {
		if (loadingComments) return;
		compact = !compact;
		lastPage = 0;
		page = 0;
		$('#compactMode').attr('src', `/assets/compact-${compact ? "on" : "off"}.png`);
		appendComments();
	});

	$('#autoMode').click(function() {
		if (loadingComments) return;
		auto = !auto;
		mode = "time";
		page = 0;
		$('#timeSort').attr('src', "/assets/sort-time-on.png");
		$('#topSort').attr('src', "/assets/sort-likes.png");

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

	$('#submitComment').click(function() {
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
		allowEsc = false;

		fetch(`/api/profile/${username}`).then(res => res.json()).then(res => {
			if (!res || res == "-1") {
				allowEsc = true;
				$('.postbutton').show();
				return $('#message').text("The username you provided doesn't exist!");
			}
			else accountID = res.accountID;

			$.post("/postComment",  {comment, username, password, levelID, accountID, color: true}).done((x: unknown) => {
				$('#content').val("");
				$('#postComment').hide();
				$('.postbutton').show();
				$('#message').html(messageText);
				$('#timeSort').attr('src', "/assets/sort-time-on.png");
				$('#topSort').attr('src', "/assets/sort-likes.png");
				allowEsc = true;
				mode = "time";
				page = 0;
				appendComments();
			}).fail(e => {
				allowEsc = true;
				$('.postbutton').show();
				$('#message').text(e.responseText.includes("DOCTYPE") ? "Something went wrong..." : e.responseText);
			});
		});
	});

	// Man, Colon's addicted to that random TheFatRat song.
	$('#likebtn').click(function() {
		$('#likebtn').removeClass('youAreNotTheOne');
		$('#dislikebtn').addClass('youAreNotTheOne');
		like = true;
	});

	$('#dislikebtn').click(function() {
		$('#likebtn').addClass('youAreNotTheOne');
		$('#dislikebtn').removeClass('youAreNotTheOne');
		like = false;
	});

	let commentID = "0";
	let lvID = "0";
	let likeCount: JQuery<HTMLElement>, likeImg: JQuery<HTMLImageElement>;
	let likedComments: string[];

	$(document).on('click', '.likeComment', function(cmnt) {
		if (gdps) return;
		commentID = $(this).attr('commentID') || "0";

		likedComments = localStorage.likedComments ? JSON.parse(localStorage.likedComments) : [];
		if (likedComments.includes(commentID)) return;

		lvID = $(this).attr('levelID') || "0";
		likeImg = $(this).find('img');
		likeCount = $(this).parent().find('h3:not(.gold)');
		$('#likeComment').show();
	});

	$('#submitVote').click(function() {
		// The thing is: this is insecure. But the game itself also does this.
		if (likedComments.includes(commentID)) {
			return $('#likeMessage').text("You've already liked/disliked this comment!");
		}

		const ID = commentID;
		const username = $('#like-username').val();
		const password = $('#like-password').val();
		const extraID = lvID || window.location.pathname.split('/')[2];
		let accountID = 0;
		let likeType = like ? "1" : "0";

		if (!ID || !username || !password || loadingComments) {
			return $('#postComment').hide();
		}

		$('#likeMessage').text(like ? "Liking..." : "Disliking... :(");
		$('.postbutton').hide();
		allowEsc = false;

		fetch(`/api/profile/${username}`).then(res => res.json()).then(res => {
			if (!res || res == "-1") {
				allowEsc = true;
				$('.postbutton').show();
				return $('#likeMessage').text("The username you provided doesn't exist!");
			}
			else accountID = res.accountID;

			$.post("/like",  { ID, accountID, password, like: likeType, type: 2, extraID }).done(x => {
				let newCount = parseInt(likeCount.text()) + (like ? 1 : -1);
				likeCount.text(newCount);
				if (newCount < 0) likeImg.attr('src', '/assets/dislike.png').css('transform', compact ? 'translateY(15%)' : 'translateY(25%)');
				else likeImg.attr('src', '/assets/like.png').removeAttr('style');
				$('#likeComment').hide();
				$('#likebtn').trigger('click');
				$('.postbutton').show();
				$('#likeMessage').html(messageText.replace("posting", "liking").replace("postComment", "like"));
				allowEsc = true;
				likedComments.push(commentID);
				localStorage.setItem('likedComments', JSON.stringify(likedComments));
			}).fail(e => {
				allowEsc = true;
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

	$(document).keydown(function(k) {
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
}

export {};