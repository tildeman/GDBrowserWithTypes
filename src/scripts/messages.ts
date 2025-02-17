/**
 * @fileoverview Site-specific script for the private message management page.
 */

import { ErrorObject } from "../types/miscellaneous.js";
import { IMessageObject } from "../types/messages.js";
import { toggleEscape } from "../misc/global.js";
import { Handlebars } from "../vendor/index.js";
import { Player } from "../classes/Player.js";

/**
 * Append messages into the HTML display box.
 * @param dontCheckPages Whether to check for pagination.
 */
function appendMessages(dontCheckPages?: boolean) {
	if (!dontCheckPages) {
		if (page > 0) $('#pageDown').show();
		else $('#pageDown').hide();

		if (messages.length >= 48) $('#pageUp').show();
		else $('#pageUp').hide();
	}

	$('#selectCount').hide();
	$('#selectAll').show();
	$('#selectNone').hide();
	$('#msgList').html('');
	messages.forEach((messageItem, messageIndex) => {
		$("#msgList").append(itemOverviewTemplate({
			messageItem,
			messageIndex,
			titleFontSize: messageItem.subject.length > 35 ? "3" : messageItem.subject.length > 30 ? "3.5" : messageItem.subject.length > 25 ? "3.75" : "4"
		}));
	});

	loading = false;
}

/**
 * Auxiliary function to retrieve messages from the GD servers.
 */
function getMessages() {
	loading = true
	$('#selectCount').hide();
	$('#selectAll').show();
	$('#selectNone').hide();
	$('#msgList').html('<img src="/assets/loading.png" class="spin noSelect" style="margin-top: 20%; height: 20%;">');
	$.post("/messages", { password, accountID, page }).done((msgs: IMessageObject[]) => {
			messages = msgs;
			appendMessages();
	}).fail(e => {
		$('#msgList').html("");
	});
}

const itemOverviewTemplateString = await fetch("/templates/messages_itemOverview.hbs").then(res => res.text());
const itemOverviewTemplate = Handlebars.compile(itemOverviewTemplateString);

const messageText = 'Your <cy>Geometry Dash password</cy> will <cg>be stored</cg> <ca>locally</ca> in order to access RobTop\'s servers. For security, it will be <cy>forgotten</cy> when you exit this page.';
const messageStatus: Record<string, [string ,string]> = {};
const cache: Record<string, [string, boolean]> = {};

let accountID: string;
let password: string;
let page = 0;
let messageID: string = "0";
let playerID: string = "0";
let messages: IMessageObject[] = [];
let loading = false;

$('#message').html(messageText);

$('#logIn').on("click", function() {
	const username = $('#username').val()?.toString() || "";
	password = $('#password').val()?.toString() || "";
	accountID = "0";

	if (!username || !password) return;

	$('#message').text("Logging in...");
	$('.postbutton').hide();

	fetch(`/api/profile/${username}`).then(res => res.json()).then((res: Player | ErrorObject) => {
		if (!res || "error" in res) {
			$('.postbutton').show();
			return $('#message').text("The username you provided doesn't exist!");
		}
		else accountID = res.accountID;

		$.post("/messages", { password, accountID }).done((msgs: IMessageObject[]) => {
			messages = msgs;
			$('#access').hide();
			appendMessages();
			$('#messages').show();

			const targetUser = window.location.search.match(/(\?|&)sendTo=(.+)/);
			if (targetUser) {
				const targetUserStr = decodeURIComponent(targetUser[2]);
				fetch(`/api/profile/${targetUserStr}`).then(res => res.json()).then((res: Player | ErrorObject) => {
					if ("error" in res || !res) return;
					$('#replyAuthor').html(`<a href="/u/${res.accountID}." target="_blank">To: ${res.username}</a>`);
					messageStatus[res.accountID] = [res.messages, res.username];
					playerID = res.accountID;
					if (res.messages == "all") {
						$('#messageStatus').html(`<cy>${res.username}</cy> has messages <cg>enabled</cg>`);
					}
					else if (res.messages == "friends") {
						$('#messageStatus').html(`<cy>${res.username}</cy> has messages set to <co>friends only</co>`);
					}
					else {
						$('#messageStatus').html(`<cy>${res.username}</cy> has messages <cr>disabled</cr>`);
						$('#postMessage').addClass('grayscale');
					}
					$('#sendMessage').show();
					$('#sendreply').text("Send Message");
				});
			}
		}).fail(e => {
			$('.postbutton').show();
			$('#message').text(e.responseText.includes("DOCTYPE") ? "Something went wrong..." : e.responseText);
		});
	});
});

$(document).on('click', '.hitbox', function (event) {
	event.stopImmediatePropagation();
});

$(document).on('mouseover', '.hitbox', function (event) {
	$('.gdMessage').css('border', '0.6vh solid transparent');
});

$(document).on('mouseleave', '.hitbox', function (event) {
	$('.gdMessage').removeAttr('style');
});

$(document).on('change', '.chk', function () {
	const checked = $(document).find('.chk:checked').length;
	if (checked == 0) $('#selectCount').hide();
	else $('#selectCount').show().children().text(checked);
});

$(document).on('click', '.gdMessage', function () {
	messageID = $(this).attr('messageID') || "0";
	playerID = $(this).attr('playerID') || "0";
	const subject = $(this).find('h3:first');
	subject.html(subject.html().replace('<cg>!</cg>', "")); //lazy way to mark as read

	$('#theMfMessage').attr('style', '');
	$('#messageSubject').attr('style', `color: ${$(this).attr('browserColor') ? 'rgb(120, 200, 255)' : "white"}`).html(subject.text().trim().length ? subject.text() : "&nbsp;");
	$('#messageAuthor').html($(this).find('.gdButton').html());
	$('#replyButton').hide();
	$('#deleteButton').hide();
	$('#messageBody').text('').hide();
	$('#messageLoad').show();
	$('#selectedMessage').show();

	$('textarea').val('');;
	$('#replyAuthor').html($(this).find('.gdButton').html().replace("From:", "To:"));
	$('#postSubject').val("Re: " + subject.text());

	if (cache[messageID]) {
		$('#messageBody').attr('style', `color: ${cache[messageID][1] ? 'rgb(255, 140, 255)' : "white"}`).text(cache[messageID][0]).show();
		$('#messageLoad').hide();
		$('#replyButton').show();
		$('#deleteButton').show();
	}

	else $.post("/messages/" + messageID, { password, accountID }).done((msg: IMessageObject) => {
		cache[messageID] = [msg.content || "", msg.browserColor];

		/**
		 * Once message loading is completed, hide the loading bar and display the main menu.
		 */
		function loadMsg() {
			$('#messageBody').attr('style', `color: ${msg.browserColor ? 'rgb(255, 140, 255)' : "white"}`).text(msg.content || "").show();
			$('#messageLoad').hide();
			$('#replyButton').show();
			$('#deleteButton').show();
		}

		if (!messageStatus[msg.accountID]) {
			fetch(`/api/profile/${msg.author}`).then(res => res.json()).then((res: Player) => {
				messageStatus[msg.accountID] = [res.messages, msg.author];
				loadMsg();
			});
		}
		else {
			loadMsg();
		}
	}).fail(e => {
		$('#messageAuthor').html('&nbsp;');
		$('#messageSubject').html('&nbsp;');
		$('#messageLoad').hide() ;
		$('#messageBody').html(e.responseText).show();
		$('#theMfMessage').attr('style', 'background-color: rgba(0, 0, 0, 0)');
	});
});

$('#deleteCurrentMessage').on("click", function() {
	toggleEscape(false);
	$('#preDelete').hide();
	$('#deleting').show();

	$.post("/deleteMessage/", { password, accountID, id: messageID }).done(() => {
		messages = messages.filter(messageItem => messageItem.id != messageID);
		appendMessages(true);
		toggleEscape(true);
		$('#selectedMessage').hide();
		$('#confirmDelete').hide();
		$('#preDelete').show();
		$('#deleting').hide();
	}).fail(e => {
		$('#deleting').hide();
		$('#delete-error').show();
		$('#delError').html(e.responseText);
	});
});

$('#purge').on("click", function() {
	const checked = $(document).find('.chk:checked').length;
	if (checked == 0) return;
	const selectStr = checked + " message" + (checked != 1 ? "s" : "");
	$('.selectedAmount').text(selectStr);
	$('#bulkDelete').show();
});

$('#bulkDeleteMessages').on("click", function() {
	toggleEscape(false);
	const msgIDs: string[] = [];
	$('.chk:checked').each(function () {
		msgIDs.push($(this).attr('messageID') || "");
	});
	$('#preBulkDelete').hide();
	$('#bulkDeleting').show();

	$.post("/deleteMessage/", { password, accountID, id: msgIDs }).done(() => {
		if (msgIDs.length > 10) getMessages();
		else {
			messages = messages.filter(messageItem => !msgIDs.includes(messageItem.id));
			appendMessages(true);
		}
		toggleEscape(true);
		$('#bulkDelete').hide();
		$('#bulkDeleting').hide();
		$('#preBulkDelete').show();
	}).fail(e => {
		$('#bulkDeleting').hide();
		$('#bd-error').show();
		$('#bdError').html(e.responseText);
	});
});

$('#replyButton').on("click", function() {
	if (!messageStatus[playerID]) return;
	const status = messageStatus[playerID][0];
	const name = messageStatus[playerID][1];
	$('#postMessage').removeClass('grayscale');
	if (status == "all") $('#messageStatus').html(`<cy>${name}</cy> has messages <cg>enabled</cg>`);
	else if (status == "friends") $('#messageStatus').html(`<cy>${name}</cy> has messages set to <co>friends only</co>`);
	else {
		$('#messageStatus').html(`<cy>${name}</cy> has messages <cr>disabled</cr>`);
		$('#postMessage').addClass('grayscale');
	}
	$('#sendreply').text("Send Reply");
	$('#sendMessage').show();
});

$('#postMessage').on("click", function() {
	const subject = $('#postSubject').val();
	const message = $('#postContent').val();
	if (!subject || !message || !messageStatus[playerID] || messageStatus[playerID][0] == "off") return;
	toggleEscape(false);
	$('#reply-loading').show();
	$('#reply-sent').hide();
	$('#reply-error').hide();
	$('#postingMessage').show();

	$.post("/sendMessage/", { password, accountID, subject, message, targetID: playerID, color: true }).done(() => {
		$('#reply-loading').hide();
		$('#reply-sent').show();
		toggleEscape(true);
	}).fail(e => {
		$('#reply-loading').hide();
		$('#reply-error').show();
		toggleEscape(true);
	});
});


$('#pageUp').on("click", function() {
	page += 1;
	getMessages();
});
$('#pageDown').on("click", function() {
	page -= 1;
	getMessages();
});

$('#selectAll').on("click", function() {
	$('#selectAll').hide();
	$('#selectNone').show();
	$('.chk').prop('checked', true).trigger('change');
});
$('#selectNone').on("click", function() {
	$('#selectAll').show();
	$('#selectNone').hide();
	$('.chk').prop('checked', false).trigger('change');
});

$('#textareas').on("change keyup keydown paste click", "textarea", function () {
	$('textarea').each(function () {
		$(this).val(($(this).val() || "").toString().replace(/[^\S ]+/g, ""));
	});
});

$(document).on("keydown", function(k) {
	if (loading) return;

	if ($('#access').is(':visible')) {
		if (k.which == 13) $('#logIn').trigger('click'); //enter
		else return;
	}

	if ($('textarea').is(':visible')) {
		if (k.which == 13) k.preventDefault(); //enter
	}

	if (k.which == 37 && $('#pageDown').is(":visible") && !$('.popup').is(":visible")) { //left
		$('#pageDown').trigger('click');
	}

	if (k.which == 39 && $('#pageUp').is(":visible") && !$('.popup').is(":visible")) { //right
		$('#pageUp').trigger('click');
	}
});

$("#refreshMessages").on("click", function() {
	page = 0;
	getMessages();
});

export {};