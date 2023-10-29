type Color3B = {
	r: number,
	g: number,
	b: number
}

interface IconColor {
	/**
	 * Primary color.
	 */
    1: number;
	/**
	 * Secondary color.
	 */
    2: number;
	/**
	 * Glow outline.
	 */
    g: number;
	/**
	 * Values that (should be) always white.
	 */
    w: number;
	/**
	 * UFO dome color.
	 */
    u: number;
}

interface IconPartSection {
	glow?: IconLayer;
	ufo?: IconLayer;
	col1?: IconLayer;
	col2?: IconLayer;
	white?: IconLayer
}

interface IconConfiguration {
	id: number;
	form: string;
	col1: number;
	col2: number;
	colG?: number;
	colW?: number;
	colU?: number;
	colg?: number;
	colw?: number;
	colu?: number;
	glow: boolean;
	app: PIXI.Application | null;
	new?: boolean;
	noUFODome?: boolean;
	animationSpeed?: number;
	animation?: string;
	animationForm?: string;
}

/**
 * For robots and spiders, this determines the position of the icon parts
 */
interface PartForSpecialIcons {
	part: number;
	pos: [number, number];
	scale: [number, number];
	rotation: number;
	flipped: [boolean, boolean];
	z: number;
	name: string;
}

interface ExtraSettings {
	new?: boolean;
	noDome?: boolean;
	ignoreGlow?: boolean;
}

interface AnimationObject {
	/**
	 * Information about the animation.
	 */
	info: {
		/**
		 * How long the animation should last.
		 */
		duration: number;
		/**
		 * If the animation ends, should it replay from the beginning?
		 */
		loop: boolean;
	};
	/**
	 * The frame data for the animation.
	 */
	frames: PartForSpecialIcons[][];
}

/**
 * Data for all the icons and their properties.
 */
interface IconData {
	/**
	 * The (internal) form names of each icon.
	 */
	forms: Record<string, {
		/**
		 * The index of the form.
		 * Either -1 or more than 20.
		 */
		index: number;
		/**
		 * The internal name of the form (dart).
		 */
		form: string;
		/**
		 * The user-visible name of the form (wave).
		 */
		name: string;
		/**
		 * Whether this form contains extra animations.
		 */
		spicy: boolean;
	}>;
	/**
	 * Animations for "spicy" forms.
	 */
	robotAnimations: {
		/**
		 * Information about each part of the animation.
		 */
		info: Record<string, {
			/**
			 * The name of the part.
			 */
			names: string[];
			/**
			 * A tint value.
			 * Its use is unknown.
			 */
			tints: number[];
		}>;
		/**
		 * The actual keyframes that define the animation.
		 */
		animations: Record<string, Record<string, AnimationObject>>;
	};
	/**
	 * A list of colors in RGB format.
	 */
	colors: Color3B[];
	/**
	 * The number of 2.2 icons for each gamemode.
	 * The trailer says around 800.
	 */
	newIconCounts: Record<string, number>;
	/**
	 * The position of icon parts in the game sheet.
	 */
	gameSheet: Record<string, {
		/**
		 * The offset x and y values for the icon part.
		 */
		spriteOffset: [number, number];
		/**
		 * The size of the icon part.
		 */
		spriteSize: [number, number];
	}>;
	/**
	 * A list of all the new icons.
	 */
	newIcons: string[];
}

interface ExtraData {
	colorOrder: number[];
	hardcodedUnlocks: {
		form: string;
		id: number;
		type?: string;
		keys?: number;
		chests?: number;
		unlock?: string;
		gauntlet?: string;
	}[];
	iconCredits: {
		name: string;
		form: string;
		id: number;
	}[];
	shops: {
		icon: number;
		type: string;
		price: number;
		shop: number;
	}[];
	previewIcons: string[];
	newPreviewIcons: string[];
}

interface IconKitAPIResponse extends ExtraData {
	sample: string[];
	server?: string;
	noCopy?: boolean;
}

interface AchievementItem {
	id: string;
	game: string;
	name: string;
	rewardType: string;
	rewardID: number;
	description: string;
	achievedDescription: string;
	trueID: string;
}

interface AchievementAPIResponse {
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

// TODO: fix this deprecated usage
$(window).resize(function () {
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
	if (window.history.length > 1 && document.referrer.startsWith(window.location.origin)){
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
async function Fetch(link: RequestInfo | URL) {
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

// TODO: fix this deprecated usage
$(document).keydown(function(k) {
	if (k.keyCode == 27) { //esc
		if (!allowEsc) return
		k.preventDefault()
		if (popupEsc && $('.popup').is(":visible")) $('.popup').hide();   
		else $('#backButton').trigger('click')
	}
});

let iconData: null | IconData = null;
let iconCanvas: HTMLCanvasElement | null = null;
let iconRenderer: PIXI.Application | null = null;
let overrideLoader = false;
let renderedIcons: {
	[cacheID: string]: {
		name: string,
		data: string
	}
} = {};

// very shitty code :) i suck at this stuff

/**
 * Render the selected icon.
 * @returns A promise that resolves to void.
 */
async function renderIcons() {
	if (overrideLoader) return;
	const iconsToRender = $('gdicon:not([rendered], [dontload])');
	if (iconsToRender.length < 1) return;
	if (!iconData) iconData = await Fetch("/api/icons");
	if (!iconCanvas) iconCanvas = document.createElement('canvas');
	if (!iconRenderer) iconRenderer = new PIXI.Application({ view: iconCanvas, width: 300, height: 300, backgroundAlpha: 0});
	if (loader.loading) return overrideLoader = true;
	buildIcon(iconsToRender, 0);
}

/**
 * Auxiliary function to render icons in a page.
 * @param elements The list of GDIcon elements.
 * @param current The current index of the element.
 */
function buildIcon(elements: JQuery<HTMLElement>, current: number) {
	if (current >= elements.length) return;
	const currentIcon = elements.eq(current);

	const cacheID = currentIcon.attr('cacheID');
	const foundCache = renderedIcons[cacheID || ""];
	if (foundCache) {
		finishIcon(currentIcon, foundCache.name, foundCache.data);
		return buildIcon(elements, current + 1);
	}

	const iconConfig: IconConfiguration = {
		id: +(currentIcon.attr('iconID') || "0"),
		form: parseIconForm(currentIcon.attr('iconForm') || ""),
		col1: parseIconColor(currentIcon.attr('col1') || ""),
		col2: parseIconColor(currentIcon.attr('col2') || ""),
		glow: currentIcon.attr('glow') == "true",
		app: iconRenderer
	};

	loadIconLayers(iconConfig.form, iconConfig.id, function(a: unknown, b: unknown, c: boolean) {
		if (c) iconConfig.new = true;
		if (!iconData) {
			iconData = {
				forms: {},
				robotAnimations: {
					info: {},
					animations: {}
				},
				colors: [],
				newIconCounts: {},
				gameSheet: {},
				newIcons: []
			};
		}
		new Icon(iconConfig, function(icon: Icon) {
			if (!iconData) {
				return;
			}
			let dataURL = icon.toDataURL();
			let titleStr = `${Object.values(iconData.forms).find(x => x.form == icon.form)?.name} ${icon.id}`;
			if (cacheID) renderedIcons[cacheID] = {name: titleStr, data: dataURL};
			finishIcon(currentIcon, titleStr, dataURL);
			if (overrideLoader) {
				overrideLoader = false;
				renderIcons();
			}
			else buildIcon(elements, current + 1);
		});
	});
}

/**
 * Finish the icon render.
 * @param currentIcon The icon to be displayed.
 * @param name The name of the icon.
 * @param data The icon image in Base64 format.
 */
function finishIcon(currentIcon, name, data) {
	currentIcon.append(`<img title="${name}" style="${currentIcon.attr("imgStyle") || ""}" src="${data}">`)
	currentIcon.attr("rendered", "true")
}

// reset scroll
while ($(this).scrollTop() != 0) {
	$(this).scrollTop(0);
} 

// TODO: fix this deprecated usage
$(document).ready(function() {
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
  if(isUnsupportedLink) (active as HTMLAnchorElement).click();
});

// stolen from stackoverflow
/**
 * Check if an element is within the (vertical) viewport.
 * @param that The jQuery selection.
 * @returns A boolean indicating the visibility of the element in the viewport.
 */
function isInViewport(that: JQuery<HTMLElement>) {
	let elementTop = $(that).offset()?.top || 0;
	let elementBottom = (elementTop || 0) + ($(that).outerHeight() || 0);
	let viewportTop = $(window).scrollTop() || 0;
	let viewportBottom = viewportTop + ($(window).height() || 0);
	return elementBottom > viewportTop && elementTop < viewportBottom;
};

