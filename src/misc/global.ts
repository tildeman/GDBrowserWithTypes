export type Color3B = {
	r: number;
	g: number;
	b: number;
}

export interface AchievementItem {
	id: string;
	game: string;
	name: string;
	rewardType: string;
	rewardID: number;
	description: string;
	achievedDescription: string;
	trueID: string;
}

export interface AchievementAPIResponse {
	achievements: AchievementItem[];
	types: Record<string, [string, string[]]>;
	colors: Record<number, Color3B>;
}

// Warning to be displayed when the viewport is vertical
$('body').append(`
	<div data-nosnippet id="tooSmall" class="brownBox center supercenter" style="display: none; width: 80%">
	<h1>Yikes!</h1>
	<p>Your <cg>screen</cg> isn't <ca>wide</ca> enough to <cy>display</cy> this <cg>page</cg>.<br>
	Please <cy>rotate</cy> your <cg>device</cg> <ca>horizontally</ca> or <cy>resize</cy> your <cg>window</cg> to be <ca>longer</ca>.
	</p>
	<p style="font-size: 1.8vh">Did I color too many words? I think I colored too many words.</p>
	</div>
`);

$(window).on("resize", function () {
	if (window.innerHeight > window.innerWidth - 75) {
		$('#everything').hide();
		$('#tooSmall').show();
	}

	else {
		$('#everything').show();
		$('#tooSmall').hide()
	}
});

/**
 * Save the previous URL into the session storage.
 */
function saveUrl() {
	if (window.location.href.endsWith('?download')) return;
	sessionStorage.setItem('prevUrl', window.location.href);
}

/**
 * Go back a page.
 */
function backButton() {
	if (window.history.length > 1 && document.referrer.startsWith(window.location.origin)) {
			if (window.location.href.endsWith('?download') && sessionStorage.getItem('prevUrl') === window.location.href.replace('?download', '')) {
				window.history.go(-2);
			}
			else window.history.back();
		}
	else window.location.href = "/";
}

let gdps: string | null = null;
let onePointNine = false;

/**
 * Wrapper function for the Fetch API to check for 1.9 features.
 * @param link The URL to fetch data from.
 * @returns The JSON data.
 */
export async function Fetch(link: RequestInfo | URL) {
	const resp = await fetch(link);
	if (!resp.ok) throw Error("Malformed response");
	gdps = resp.headers.get('gdps');
	// TODO: Use a better check method for 1.9 servers
	if (gdps && gdps.startsWith('1.9/')) {
		onePointNine = true;
		gdps = gdps.slice(4);
	}
	const returnValue = await resp.json();
	return returnValue;
}

let allowEsc = true;
let popupEsc = true;

/**
 * Toggle the `Esc` keyboard functionality.
 * @param state The state of whether to allow using the `Esc` key.
 * @param popup Whether the state is to escape popups.
 */
export function toggleEscape(state: boolean, popup?: boolean) {
	if (popup) popupEsc = state;
	else allowEsc = state;
}

$(document).on("keydown", function(k) {
	if (k.keyCode == 27) { //esc
		if (!allowEsc) return
		k.preventDefault()
		if (popupEsc && $('.popup').is(":visible")) $('.popup').hide();
		else $('#backButton').trigger('click')
	}
});

// reset scroll
while ($(window).scrollTop() != 0) {
	$(window).scrollTop(0);
}

$(document).on("ready", function() {
	$(window).trigger('resize');
});

/**
 * Adds all necessary elements into the tab index (all buttons and links that aren't natively focusable)
 */
const inaccessibleLinkSelector = "*:not(a) > img.gdButton, .leaderboardTab, .gdcheckbox, .diffDiv, .lengthDiv";

document.querySelectorAll(inaccessibleLinkSelector).forEach(elem => {
  elem.setAttribute('tabindex', "0");
});

document.getElementById('backButton')?.setAttribute('tabindex', "1"); // Prioritize back button, first element to be focused

// Event listener to run a .click() function if
window.addEventListener("keydown", e => {
  if(e.key !== 'Enter') return;

  const active = document.activeElement;
  if (!active) return;
  const isUnsupportedLink = active.hasAttribute('tabindex'); // Only click on links that aren't already natively supported to prevent double clicking
  if (isUnsupportedLink) (active as HTMLAnchorElement).click();
});

// stolen from stackoverflow
/**
 * Check if an element is within the (vertical) viewport.
 * @param that The jQuery selection.
 * @returns A boolean indicating the visibility of the element in the viewport.
 */
export function isInViewport(that: JQuery<HTMLElement>) {
	let elementTop = $(that).offset()?.top || 0;
	let elementBottom = (elementTop || 0) + ($(that).outerHeight() || 0);
	let viewportTop = $(window).scrollTop() || 0;
	let viewportBottom = viewportTop + ($(window).height() || 0);
	return elementBottom > viewportTop && elementTop < viewportBottom;
};

$("body").on("beforeunload", saveUrl);
$("#backButton").on("click", backButton);