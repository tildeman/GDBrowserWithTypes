/**
 * @fileoverview Site-specific script for the leaderboard page.
 */

import { Player } from "../classes/Player";

/**
 * Weekly progress data (for 1.9 servers that use the weekly leaderboard).
 */
interface WeeklyProgressItem {
	stars: number;
	diamonds: number;
	userCoins: number;
	demons: number;
}

/**
 * Cosmetics data (for 1.9 servers).
 */
interface CosmeticsData {
	bgColor: number[];
	nameColor: number[];
}

let type: string;
let sort = "stars";
let modMode = false;
let weekly = false;
let showWeek = localStorage.weeklyStats == "1";
const trophies = [1, 3, 10, 25, 50, 75, 100];
const boomColors = ["red", "orange", "yellow", "green", "teal", "blue", "pink"];

let top250Text =
`The <cg>Stars</cg> leaderboard contains the <cg>top 100 players</cg>, sorted by <cy>star</cy> value. It was formerly <co>inaccurate</co> but should be much more <cb>reliable</cb> now.`;

const topGDPSText =
`The <cg>Stars</cg> leaderboard contains the <cg>top players</cg>, sorted by <cy>star</cy> value.`;

const weeklyText =
`The <cg>Weekly</cg> leaderboard displays the players who have gained the most <cy>stars</cy> in the <cb>past week</cb>. It was officially <co>removed</co> in update 2.0, but lives on in some GDPS'es.`;

const accurateText =
`The <cg>Accurate Leaderboard</cg> is an <cy>externally managed</cy> leaderboard which aims to provide <ca>detailed</ca> and hacker-proof stats on top players. It also once provided a way to view an <cg>accurate</cg> list of players with the most <cy>stars</cy> when the official leaderboards were <ca>frozen</ca>. It is managed by <cb>XShadowWizardX, Pepper360, Octeract</cb>, and many many other helpers.`;

const creatorText =
`The <cg>Creators Leaderboard</cg> is sorted by <cg>creator points</cg>, rather than stars. A player's <cg>creator points</cg> (CP) is calculated by counting their number of <cy>star rated</cy> levels, plus an extra point for every level that has been <cb>featured</cb>, plus an additional point for <co>epic rated</co> levels.`;

if (showWeek) $('#weeklyStats').attr('src', '/assets/sort-week-on.png');

/**
 * Change the information text.
 * @param text The information text to display.
 * @param altDiscord Whether to display the alternative Discord link button.
 */
function infoText(text: string, altDiscord?: boolean) {
	$('#infoText').html(text)
	if (altDiscord) {
		$('#discord').hide();
		$('#altDiscord').show();
	}
	else {
		$('#discord').show();
		$('#altDiscord').hide();
	}
}

infoText(top250Text);

let didGDPSStuff = false;

/**
 * Load the selected leaderboard.
 * @param val The leaderboard type.
 * @param leaderboardParams Additional parameters for the API call.
 * @param scrollTo The account ID to focus the menu onto.
 */
function leaderboard(val?: string | null, leaderboardParams?: string, scrollTo?: string) {
	$('#searchBox').html(`<div style="height: 4.5%"></div>`);
	$('#clearRelative').hide();
	$('#loading').show();

	Fetch("/api/leaderboard?" + (leaderboardParams || `count=250&${val}&type=${sort}${modMode ? "&mod=1" : ""}`)).then((res: Player[] | -1) => {
		if (gdps && !didGDPSStuff) {
			didGDPSStuff = true;
			top250Text = topGDPSText;
			$('#accurateTabOn').remove();
			$('#accurateTabOff').remove();

			Fetch('../api/gdps?current=1').then(ps => {
				if (weekly) return;
				else if (ps.weeklyLeaderboard) {
					$('#weeklyTabOff').show();
					weekly = true;
				}
				else $('#scoreTabs').css('margin-left', '-29vh');

				if (ps.link.includes("https://discord.gg")) {
					$('#discord').attr('href', ps.link).attr('title', `${ps.name} Discord!`);
					$('#discordLinks').show();
				}
			});
		}
		else {
			// $('#boomling').show();
			$('#discordLinks').show();
		}

		$('#searchBox').html(`<div style="height: 4.5%"></div>`);
		$('.ranking').remove();

		if (modMode && sort == "cp" && res != -1) res = res.sort(function(a, b) {
			return b.cp - a.cp;
		});
		const wk = type == "weekly";

		if ((leaderboardParams ? true : val == type) && res != -1 && res.length) res.forEach((lbItem, lbIndex) => {
			// Quick and dirty method, just in case
			if (typeof(lbItem.icon) == "number") return;

			// Zombie code
			const wp = "weeklyProgress" in lbItem ? lbItem.weeklyProgress as WeeklyProgressItem : {
				stars: 0,
				diamonds: 0,
				userCoins: 0,
				demons: 0
			};
			const cosmetics = "cosmetics" in lbItem ? lbItem.cosmetics as CosmeticsData : {
				bgColor: [],
				nameColor: []
			};

			const bgCol = cosmetics.bgColor;
			const bgString = bgCol ? ` style="background-color: rgb(${bgCol.join()})"` : "";

			const nameCol = cosmetics.nameColor;
			const nameString = nameCol ? `; color: rgb(${nameCol.join()}) ;` : null;

			if (lbItem.userCoins) lbItem.userCoins = lbItem.userCoins;
			if (wp.userCoins) wp.userCoins = wp.userCoins;

			$('#searchBox').append(`<div class="searchResult leaderboardSlot"${bgString}>

				<div class="center ranking">
					${lbItem.icon.icon == -1 && type == "accurate" ? `<img class="spaced" src="./assets/trophies/${trophies.findIndex(z => lbIndex + 1 <= z) + 1}.png" height="150%" style="margin-bottom: 0%; transform:scale(1.1)">` :
					`<gdicon dontload="true" class="leaderboardIcon" iconID=${lbItem.icon.icon} cacheID=${lbItem.playerID} iconForm="${lbItem.icon.form}" col1="${lbItem.icon.col1}" col2="${lbItem.icon.col2}" glow="${lbItem.icon.glow}"></gdicon>`}
					<h2 class="slightlySmaller" style="transform: scale(${1 - (Math.max(0, String(lbItem.rank).length - 1) * 0.1)})">${lbItem.rank}</h2>
				</div>

				<div class="leaderboardSide">
					<div class="leaderboardStars">
						${lbItem.moderator ? `<img title="${lbItem.moderator == 2 ? "Elder " : ""}Moderator" src="/assets/mod${lbItem.moderator == 2 ? "-elder" : ""}.png" style="width: 9%; cursor: help; padding-right: 1.6%; transform: translateY(0.7vh)">` : ""}
						<h2 class="leaderboardName small inline gdButton" style="margin-top: 1.5%${nameString || (lbItem.moderator == 2 ? "; color: #FF9977;" : "")}"><a href="${onePointNine ? `../search/${lbItem.playerID}?user` : `../u/${lbItem.accountID}.`}" accountID="${lbItem.accountID}">${lbItem.username}</a></h2>
						<h3 class="inline${lbItem.stars >= 100000 ? " yellow" : ""}" style="margin-left: 4%; margin-top: 2%; font-size: 4.5vh${type == "weekly" ? "; display: none" : ""};">${lbItem.stars} <img class="help valign" src="/assets/star.png"style="width: 4vh; transform: translate(-25%, -10%);" title="Stars"></h3>
					</div>

					<h3 class="lessSpaced leaderboardStats">
						${type != "weekly" ? "" : `<span${lbItem.stars >= 1000 ? " class='yellow'" : ""}>+${lbItem.stars}</span> <img class="help valign" src="/assets/star.png" title="Star Gain">`}
						${wk || onePointNine ? "" : `<span${lbItem.diamonds >= 65535 ? ` class='blue'>` : ">"}${lbItem.diamonds}</span> <img class="help valign" src="/assets/diamond.png" title="Diamonds">`}
						${wk ? "&nbsp;" : `<span${lbItem.coins >= 149 ? " class='yellow'" : ""}>${lbItem.coins}</span> <img class="help valign" src="/assets/coin.png" title="Secret Coins">`}
						${wk || onePointNine ? "" : `<span${lbItem.userCoins >= 10000 ? " class='brightblue'" : ""}>${lbItem.userCoins}</span> <img class="help valign" src="/assets/silvercoin.png" title="User Coins">`}
						${wk ? "" : `<span${lbItem.demons >= 1000 ? " class='brightred'" : ""}>${lbItem.demons}</span> <img class="help valign" src="/assets/demon.png" title="Demons">`}
						${lbItem.cp <= 0 ? "" : `<span${lbItem.cp >= 100 ? " class='yellow'" : ""}>${lbItem.cp}</span> <img class="help valign" src="/assets/cp.png" title="Creator Points">`}
					</h3>

					<h3 class="lessSpaced leaderboardStats weeklyStuff"}>
						<span${wp.diamonds >= 250 ? " class='blue'" : ""}>${wp.diamonds >= 0 ? "+" : ""}${wp.diamonds}</span> <img class="help valign" src="/assets/diamond.png" title="Diamond Gain">
						<span${wp.stars >= 1000 ? " class='yellow'" : ""}>${wp.stars >= 0 ? "+" : ""}${wp.stars}</span> <img class="help valign" src="/assets/star.png" title="Star Gain">
						<span${wp.userCoins >= 250 ? " class='brightblue'" : ""}>${wp.userCoins >= 0 ? "+" : ""}${wp.userCoins}</span> <img class="help valign" src="/assets/silvercoin.png" title="User Coin Gain">
						<span${wp.demons >= 25 ? " class='brightred'" : ""}>${wp.demons >= 0 ? "+" : ""}${wp.demons}</span> <img class="help valign" src="/assets/demon.png" title="Demon Gain">
					</h3>
				</div>

			</div>`);
		});

		// Code to display if the accurate leaderboard is disabled
		/* else if (type == "accurate") {
		 	$('#searchBox').append(`<div style="width: 100%">
		 		<h1 style="margin-top: 14%"class="center">The Accurate Leaderboard<br>is temporarily disabled</h1>
		 		<p class="center" style="padding: 0% 10%">Due to RobTop's new <cy>API enforcements</cy>, the Accurate Leaderboard is <ca>no longer able to load reliably</ca>. A fix is being worked on and will hopefully be released in <cg>a day or two</cg>.</p>
		 	</div>`);
		} */

		weeklyAdjust();
		$('#searchBox').append('<div style="height: 4.5%"></div>');

		if (scrollTo) {
			let foundElement = $(`#searchBox .leaderboardName a[accountID=${scrollTo}]`);
			if (foundElement.length) {
				let foundParent = foundElement.parent().parent();
				$('#searchBox').scrollTop(foundParent.offset()!.top - (foundParent.height() || 0));
			}
		}

		lazyLoadIcons();
		$('#loading').hide();
	}).catch(e => {
		console.log(e);
		$('#loading').hide();
	});
}

// $('#boomling').attr('src', `/assets/boomlings/${boomColors[Math.floor(Math.random() * boomColors.length)]}.png`);

$(document).on('click', '.sortButton', function () {
	if ($('#loading').is(":visible")) return;
	sort = $(this).attr('sort') || "";
	$('.sortButton').each(function() {
		$(this).attr('src', $(this).attr('src')!.replace('-on', '').replace('.png', '') + ($(this).attr('sort') == sort ? "-on" : "") + ".png");
	});
	return leaderboard("accurate");
});

$('#topTabOff').click(function() {
	if (type == "top") return;
	type = "top";
	leaderboard(type);
	$('.leaderboardTab').hide();
	$('#topTabOn').show();
	$(weekly ? '#weeklyTabOff' : '#accurateTabOff').show();
	$('#creatorTabOff').show();
	infoText(top250Text);
	$('.sortDiv').hide();
	$('#relativeUser').show();
});

$('#accurateTabOff').click(function() {
	if (type == "accurate") return;
	type = "accurate";
	leaderboard(type);
	$('.leaderboardTab').hide();
	$('#topTabOff').show();
	$('#accurateTabOn').show();
	$('#creatorTabOff').show();
	infoText(accurateText, true);
	$('.sortDiv').show();
	$('#relativeUser').hide();
});

$('#weeklyTabOff').click(function() {
	if (type == "weekly" || !gdps) return;
	type = "weekly";
	leaderboard(type);
	$('.leaderboardTab').hide();
	$('#topTabOff').show();
	$('#weeklyTabOn').show();
	$('#creatorTabOff').show();
	infoText(weeklyText);
	$('.sortDiv').hide();
});

$('#creatorTabOff').click(function() {
	if (type == "creator") return;
	type = "creator";
	leaderboard(type);
	$('.leaderboardTab').hide();
	$('#topTabOff').show();
	$(weekly ? '#weeklyTabOff' : '#accurateTabOff').show();
	$('#creatorTabOn').show();
	infoText(creatorText);
	$('.sortDiv').hide();
});

$('#modSort').click(function() {
	modMode = !modMode;
	$(this).attr('src', `/assets/sort-mod${modMode ? "-on" : ""}.png`);
	if (modMode) {
		$('#cpSort').show();
		$('#statSort').css('transform', 'translateY(-26.7%');
	}
	else {
		$('#cpSort').hide();
		$('#statSort').css('transform', 'translateY(-33.3%');
		if (sort == "cp") $('#starSort').trigger('click');
	}
	leaderboard(type);
});

/**
 * Adjust the browser CSS to include the weekly tab.
 */
function weeklyAdjust() {
	const weekEnabled = showWeek && type == "accurate";
	$('.leaderboardSlot').css('height', weekEnabled ? '33%' : '25%');
	$('.weeklyStuff').css('display', weekEnabled ? 'block' : 'none');
}

$('#weeklyStats').click(function() {
	showWeek = !showWeek;
	localStorage.weeklyStats = +showWeek;
	$(this).attr('src', `/assets/sort-week${showWeek ? "-on" : ""}.png`);
	weeklyAdjust();
});

$('#findRelative').click(function() {
	$('#userSearch').show();
	$('#relativeName').focus().select();
});

let relativeLoading = false;
$('#relativeSearch').click(function() {
	const relativeUsername = $('#relativeName').val();
	if (relativeLoading || !relativeUsername) return;
	relativeLoading = true;
	Fetch("../api/profile/" + relativeUsername).then(foundUser => {
		if (foundUser && foundUser.accountID && foundUser.rank) {
			leaderboard(null, "type=relative&accountID=" + foundUser.accountID, foundUser.accountID);
			$('#userSearch').hide();
			$('#relativeStatus').hide();
			$('#clearRelative').show();
			type = "relative";
			relativeLoading = false;
		}
		else {
			$('#relativeStatus').html(`${foundUser.username ? `<cy>${foundUser.username}</cy>` : "That user"} doesn't have a global rank!`).show();
			relativeLoading = false;
		}
	}).catch(e => {
		$('#relativeStatus').text("That account doesn't seem to exist!").show();
		relativeLoading = false;
	});
});

$('#clearRelative').click(function() {
	$('#topTabOff').trigger('click');
});

$(document).keydown(function(k) {
	if ($('#userSearch').is(':visible') && k.which == 13 && !relativeLoading) $('#relativeSearch').trigger('click'); //enter
});

$("#topTabOff").trigger('click');

/**
 * Get rid of the `dontload` attribute on icons that have it and load them anyway.
 */
function lazyLoadIcons() {
	let newIconFound = false;
	$('gdicon[dontload]').each(function() {
		if (isInViewport($(this))) {
			$(this).removeAttr('dontload');
			newIconFound = true;
		}
	});
	if (newIconFound) renderIcons();
}

$('#searchBox').scroll(lazyLoadIcons);