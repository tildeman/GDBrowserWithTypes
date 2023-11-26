/**
 * @fileoverview Site-specific script for the leaderboard page.
 */

import { Fetch, isInViewport, serverMetadata } from "../misc/global.js";
import { ErrorObject } from "../types/miscellaneous.js";
import { buildIcon } from "../iconkit/icon.js";
import { Player } from "../classes/Player.js";
import { Handlebars } from "../vendor/index.js";

const searchResultTemplateString = await (await fetch("/templates/leaderboard_searchResult.hbs")).text();
const searchResultTemplate = Handlebars.compile(searchResultTemplateString);

/**
 * Weekly progress data (for 1.9 servers that use the weekly leaderboard).
 */
interface WeeklyProgressItem {
	/**
	 * The number of stars gained in the week.
	 */
	stars: number;
	/**
	 * The number of diamonds gained in the week.
	 */
	diamonds: number;
	/**
	 * The number of user coins gained in the week.
	 */
	userCoins: number;
	/**
	 * The number of demons gained in the week.
	 */
	demons: number;
}

/**
 * Cosmetics data (for 1.9 servers).
 * Currently sits unused.
 */
interface CosmeticsData {
	/**
	 * The background color of the entry.
	 */
	bgColor: number[];
	/**
	 * The name color of the entry.
	 */
	nameColor: number[];
}

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

	Fetch("/api/leaderboard?" + (leaderboardParams || `count=250&${val}&type=${sort}${modMode ? "&mod=1" : ""}`)).then((res: Player[] | ErrorObject) => {
		if (serverMetadata.gdps && !didGDPSStuff) {
			didGDPSStuff = true;
			$('#accurateTabOn').remove();
			$('#accurateTabOff').remove();

			Fetch('/api/gdps?current=1').then(ps => {
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

		if (modMode && sort == "cp" && !("error" in res)) res = res.sort(function(a, b) {
			return b.cp - a.cp;
		});
		const wk = type == "weekly";

		if ((leaderboardParams ? true : val == type) && !("error" in res) && res.length) res.forEach((lbItem, lbIndex) => {
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

			$("#searchBox").append(searchResultTemplate({
				bgString,
				accurateLeaderboards: lbItem.icon.icon == -1 && type == "accurate",
				alTrophyIcon: trophies.findIndex(z => lbIndex + 1 <= z) + 1,
				lbItem,
				rankScale: 1 - (Math.max(0, String(lbItem.rank).length - 1) * 0.1),
				elderMod: lbItem.moderator == 2,
				properNameString: nameString || (lbItem.moderator == 2 ? "; color: #FF9977;" : ""),
				onePointNine: serverMetadata.onePointNine,
				wk,
				wk19: wk || serverMetadata.onePointNine,
				allTime: {
					stars: lbItem.stars >= 100000,
					starGain: lbItem.stars >= 1000,
					diamonds: lbItem.diamonds >= 65535,
					coins: lbItem.coins >= 149,
					silvercoin: lbItem.userCoins >= 10000,
					demons: lbItem.demons >= 1000,
					cp: lbItem.cp >= 100
				},
				poor: lbItem.cp <= 0,
				weekly: {
					diamonds: wp.diamonds >= 250,
					stars: wp.stars >= 1000,
					userCoins: wp.userCoins >= 250,
					demons: wp.demons >= 25
				},
				gained: {
					diamonds: `${wp.diamonds >= 0 ? "+" : ""}${wp.diamonds}`,
					stars: `${wp.stars >= 0 ? "+" : ""}${wp.stars}`,
					userCoins: `${wp.userCoins >= 0 ? "+" : ""}${wp.userCoins}`,
					demons: `${wp.demons >= 0 ? "+" : ""}${wp.demons}`
				}
			}));
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
			const foundElement = $(`#searchBox .leaderboardName a[accountID=${scrollTo}]`);
			if (foundElement.length) {
				const foundParent = foundElement.parent().parent();
				$('#searchBox').scrollTop(foundParent.offset()!.top - (foundParent.height() || 0));
			}
		}

		lazyLoadIcons();
		$('#loading').hide();
	}).catch(e => {
		console.error(e);
		$('#loading').hide();
	});
}

/**
 * Get rid of the `dontload` attribute on icons that have it and load them anyway.
 */
function lazyLoadIcons() {
	$('gdicon[dontload]').each(function() {
		if (isInViewport($(this))) {
			$(this).removeAttr('dontload');
			buildIcon($(this));
		}
	});
}

/**
 * Adjust the browser CSS to include the weekly tab.
 */
function weeklyAdjust() {
	const weekEnabled = showWeek && type == "accurate";
	$('.leaderboardSlot').css('height', weekEnabled ? '33%' : '25%');
	$('.weeklyStuff').css('display', weekEnabled ? 'block' : 'none');
}

const trophies = [1, 3, 10, 25, 50, 75, 100];
const boomColors = ["red", "orange", "yellow", "green", "teal", "blue", "pink"];
const gdTop250Text = `The <cg>Stars</cg> leaderboard contains the <cg>top 100 players</cg>, sorted by <cy>star</cy> value. It was formerly <co>inaccurate</co> but should be much more <cb>reliable</cb> now.`;
const topGDPSText = `The <cg>Stars</cg> leaderboard contains the <cg>top players</cg>, sorted by <cy>star</cy> value.`;
const top250Text = serverMetadata.gdps ? topGDPSText : gdTop250Text;
const weeklyText = `The <cg>Weekly</cg> leaderboard displays the players who have gained the most <cy>stars</cy> in the <cb>past week</cb>. It was officially <co>removed</co> in update 2.0, but lives on in some GDPS'es.`;
const accurateText = `The <cg>Accurate Leaderboard</cg> is an <cy>externally managed</cy> leaderboard which aims to provide <ca>detailed</ca> and hacker-proof stats on top players. It also once provided a way to view an <cg>accurate</cg> list of players with the most <cy>stars</cy> when the official leaderboards were <ca>frozen</ca>. It is managed by <cb>XShadowWizardX, Pepper360, Octeract</cb>, and many many other helpers.`;
const creatorText = `The <cg>Creators Leaderboard</cg> is sorted by <cg>creator points</cg>, rather than stars. A player's <cg>creator points</cg> (CP) is calculated by counting their number of <cy>star rated</cy> levels, plus an extra point for every level that has been <cb>featured</cb>, plus an additional point for <co>epic rated</co> levels.`;

let type: string;
let sort = "stars";
let modMode = false;
let weekly = false;
let didGDPSStuff = false;
let showWeek = localStorage.weeklyStats == "1";

if (showWeek) $('#weeklyStats').attr('src', '/assets/sorting/week-on.png');

infoText(top250Text);

// $('#boomling').attr('src', `/assets/boomlings/${boomColors[Math.floor(Math.random() * boomColors.length)]}.png`);

$(document).on('click', '.sortButton', function () {
	if ($('#loading').is(":visible")) return;
	sort = $(this).attr('sort') || "";
	$('.sortButton').each(function() {
		$(this).attr('src', $(this).attr('src')!.replace('-on', '').replace('.png', '') + ($(this).attr('sort') == sort ? "-on" : "") + ".png");
	});
	return leaderboard("accurate");
});

$('#topTabOff').on("click", function() {
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

$('#accurateTabOff').on("click", function() {
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

$('#weeklyTabOff').on("click", function() {
	if (type == "weekly" || !serverMetadata.gdps) return;
	type = "weekly";
	leaderboard(type);
	$('.leaderboardTab').hide();
	$('#topTabOff').show();
	$('#weeklyTabOn').show();
	$('#creatorTabOff').show();
	infoText(weeklyText);
	$('.sortDiv').hide();
});

$('#creatorTabOff').on("click", function() {
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

$('#modSort').on("click", function() {
	modMode = !modMode;
	$(this).attr('src', `/assets/sorting/mod${modMode ? "-on" : ""}.png`);
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

$('#weeklyStats').on("click", function() {
	showWeek = !showWeek;
	localStorage.weeklyStats = +showWeek;
	$(this).attr('src', `/assets/sorting/week${showWeek ? "-on" : ""}.png`);
	weeklyAdjust();
});

$('#findRelative').on("click", function() {
	$('#userSearch').show();
	$('#relativeName').trigger("focus").trigger("select");
});

let relativeLoading = false;
$('#relativeSearch').on("click", function() {
	const relativeUsername = $('#relativeName').val();
	if (relativeLoading || !relativeUsername) return;
	relativeLoading = true;
	Fetch("/api/profile/" + relativeUsername).then((foundUser: Player) => {
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

$('#clearRelative').on("click", function() {
	$('#topTabOff').trigger('click');
});

$(document).on("keydown", function(k) {
	if ($('#userSearch').is(':visible') && k.which == 13 && !relativeLoading) $('#relativeSearch').trigger('click'); //enter
});

$("#topTabOff").trigger('click');
$('#searchBox').on("scroll", lazyLoadIcons);

export {};