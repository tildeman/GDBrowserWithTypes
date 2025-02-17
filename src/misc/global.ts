interface ServerMetadata {
	gdps: string | null;
	onePointNine: boolean;
}

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

/**
 * Sanitize potentially dangerous code.
 * @param text The text to replace characters.
 * @returns The sanitized text that is safe to display.
 */
export function clean(text: string | number | undefined) {
	return String(text)
		.replace(/&/g, "&#38;")
		.replace(/</g, "&#60;")
		.replace(/>/g, "&#62;")
		.replace(/=/g, "&#61;")
		.replace(/"/g, "&#34;")
		.replace(/'/g, "&#39;");
}

export const serverMetadata: ServerMetadata = {
	gdps: null,
	onePointNine: false
};

/**
 * Wrapper function for the Fetch API to check for 1.9 features.
 * @param link The URL to fetch data from.
 * @returns The JSON data.
 */
export async function Fetch(link: RequestInfo | URL) {
	const resp = await fetch(link);
	if (!resp.ok) throw new Error("Malformed response");
	serverMetadata.gdps = resp.headers.get('gdps');
	// TODO: Use a better check method for 1.9 servers
	if (serverMetadata.gdps && serverMetadata.gdps.startsWith('1.9/')) {
		serverMetadata.onePointNine = true;
		serverMetadata.gdps = serverMetadata.gdps.slice(4);
	}
	const returnValue = await resp.json();
	return returnValue;
}

// stolen from stackoverflow
/**
 * Check if an element is within the (vertical) viewport.
 * @param that The jQuery selection.
 * @returns A boolean indicating the visibility of the element in the viewport.
 */
export function isInViewport(that: JQuery<HTMLElement>) {
	const elementTop = $(that).offset()?.top || 0;
	const elementBottom = (elementTop || 0) + ($(that).outerHeight() || 0);
	const viewportTop = $(window).scrollTop() || 0;
	const viewportBottom = viewportTop + ($(window).height() || 0);
	return elementBottom > viewportTop && elementTop < viewportBottom;
}

/**
 * Toggle the `Esc` keyboard functionality.
 * @param state The state of whether to allow using the `Esc` key.
 * @param popup Whether the state is to escape popups.
 */
export function toggleEscape(state: boolean, popup?: boolean) {
	if (popup) popupEsc = state;
	else allowEsc = state;
}

/**
 * Adds all necessary elements into the tab index (all buttons and links that aren't natively focusable).
 */
const inaccessibleLinkSelector = "*:not(a) > img.gdButton, .leaderboardTab, .gdcheckbox, .diffDiv, .lengthDiv";

let allowEsc = true;
let popupEsc = true;

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

// Warning to be displayed because the HTML is so bad that I cannot fix it so that it works with vertical displays
$('body').append(`
	<div data-nosnippet id="tooSmall" class="brownBox center supercenter" style="display: none; width: 80%">
	<h1>Yikes!</h1>
	<p>Your <cg>screen</cg> isn't <ca>wide</ca> enough to <cy>display</cy> this <cg>page</cg>.<br>
	Please <cy>rotate</cy> your <cg>device</cg> <ca>horizontally</ca> or <cy>resize</cy> your <cg>window</cg> to be <ca>longer</ca>.
	</p>
	<p style="font-size: 1.8vh">Did I color too many words? I think I colored too many words.</p>
	</div>
`);

$(document).on("keydown", function(k) {
	if (k.which == 27) { // esc
		if (!allowEsc) return;
		k.preventDefault();
		if (popupEsc && $('.popup').is(":visible")) $('.popup').hide();
		else $('#backButton').trigger('click');
	}
});

// reset scroll
while ($(window).scrollTop() != 0) {
	$(window).scrollTop(0);
}

$(document).on("ready", function() {
	$(window).trigger('resize');
});

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

$("body").on("beforeunload", saveUrl);
$("#backButton").on("click", backButton);