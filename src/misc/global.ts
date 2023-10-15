// Ambient declarations - only do typechecks

type Color3B = {
	r: number,
	g: number,
	b: number
}

interface IconColor {
	/**
	 * Primary color
	 */
    "1": number;
	/**
	 * Secondary color
	 */
    "2": number;
	/**
	 * Glow outline
	 */
    g: number;
	/**
	 * Values that (should be) always white
	 */
    w: number;
	/**
	 * UFO dome color
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
	animation: string;
	animationForm: string;
}

interface ExtraSettings {
	new?: boolean;
	noDome?: boolean;
	ignoreGlow?: boolean;
}

interface IconData {
	forms: {
		[formItem: string]: {
			form: string;
			name: string;
		};
	};
	robotAnimations: {
		info: any;
		animations: any;
	};
	colors: number[];
	newIconCounts: any;
	gameSheet: {
		[frameName: string]: {}
	};
	newIcons: string[];
}

$('body').append(`
	<div data-nosnippet id="tooSmall" class="brownBox center supercenter" style="display: none; width: 80%">
	<h1>Yikes!</h1>
	<p>Your <cg>screen</cg> isn't <ca>wide</ca> enough to <cy>display</cy> this <cg>page</cg>.<br>
	Please <cy>rotate</cy> your <cg>device</cg> <ca>horizontally</ca> or <cy>resize</cy> your <cg>window</cg> to be <ca>longer</ca>.
	</p>
	<p style="font-size: 1.8vh">Did I color too many words? I think I colored too many words.</p>
	</div>
`)

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

function saveUrl() {
		if (window.location.href.endsWith('?download')) return;
	sessionStorage.setItem('prevUrl', window.location.href);
}

function backButton() {
	if (window.history.length > 1 && document.referrer.startsWith(window.location.origin)){
			if (window.location.href.endsWith('?download') && sessionStorage.getItem('prevUrl') === window.location.href.replace('?download', '')) window.history.go(-2);
			else window.history.back()
		}
	else window.location.href = "../../../../../"
}

let gdps: string | null = null
let onePointNine = false

function Fetch(link: RequestInfo | URL) {
	return new Promise<null>(function (res, rej) {
		fetch(link).then(resp => {
			if (!resp.ok) return rej(resp);
			gdps = resp.headers.get('gdps');
			if (gdps && gdps.startsWith('1.9/')) {
				onePointNine = true;
				gdps = gdps.slice(4);
			}
			resp.json().then(res).catch(rej);
		}).catch(rej)
	})
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

let iconData: null | IconData = null
let iconCanvas: HTMLCanvasElement | null = null
let iconRenderer: PIXI.Application | null = null
let overrideLoader = false
let renderedIcons: {
	[cacheID: string]: {
		name: string,
		data: string
	}
} = {};

// very shitty code :) i suck at this stuff

/**
 * Render the selected icon
 * @returns A promise that resolves to void
 */
async function renderIcons() {
	if (overrideLoader) return;
	let iconsToRender = $('gdicon:not([rendered], [dontload])');
	if (iconsToRender.length < 1) return;
	if (!iconData) iconData = await Fetch("../api/icons");
	if (!iconCanvas) iconCanvas = document.createElement('canvas');
	if (!iconRenderer) iconRenderer = new PIXI.Application({ view: iconCanvas, width: 300, height: 300, backgroundAlpha: 0});
	if (loader.loading) return overrideLoader = true;
	buildIcon(iconsToRender, 0);
}

function buildIcon(elements: JQuery<HTMLElement>, current: number) {
	if (current >= elements.length) return
	let currentIcon = elements.eq(current)

	let cacheID = currentIcon.attr('cacheID')
	let foundCache = renderedIcons[cacheID || ""]
	if (foundCache) {
		finishIcon(currentIcon, foundCache.name, foundCache.data)
		return buildIcon(elements, current + 1)
	}

	let iconConfig: IconConfiguration = {
		id: +(currentIcon.attr('iconID') || "0"),
		form: parseIconForm(currentIcon.attr('iconForm') || ""),
		col1: parseIconColor(currentIcon.attr('col1') || ""),
		col2: parseIconColor(currentIcon.attr('col2') || ""),
		glow: currentIcon.attr('glow') == "true",
		app: iconRenderer,
		animation: "",
		animationForm: ""
	}

	loadIconLayers(iconConfig.form, iconConfig.id, function(a, b, c: boolean) {
		if (c) iconConfig.new = true
		if (!iconData) {
			iconData = {
				forms: {},
				robotAnimations: {
					info: null,
					animations: null
				},
				colors: [],
				newIconCounts: null,
				gameSheet: {},
				newIcons: []
			};
		}
		new Icon(iconConfig, function(icon: Icon) {
			if (!iconData) {
				return;
			}
			let dataURL = icon.toDataURL()
			let titleStr = `${Object.values(iconData.forms).find(x => x.form == icon.form)?.name} ${icon.id}`
			if (cacheID) renderedIcons[cacheID] = {name: titleStr, data: dataURL}
			finishIcon(currentIcon, titleStr, dataURL)
			if (overrideLoader) {
				overrideLoader = false
				renderIcons()
			}
			else buildIcon(elements, current + 1)
		})
	})
}

/**
 * Finish the icon render
 * @param currentIcon The icon to be displayed
 * @param name The name of the icon
 * @param data The icon image in Base64 format
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

// Adds all necessary elements into the tab index (all buttons and links that aren't natively focusable)
const inaccessibleLinkSelector = "*:not(a) > img.gdButton, .leaderboardTab, .gdcheckbox, .diffDiv, .lengthDiv";

document.querySelectorAll(inaccessibleLinkSelector).forEach(elem => {
  elem.setAttribute('tabindex', "0");
})

document.getElementById('backButton')?.setAttribute('tabindex', "1"); // Prioritize back button, first element to be focused

// Event listener to run a .click() function if
window.addEventListener("keydown", e => {
  if(e.key !== 'Enter') return;

  const active = document.activeElement;
  if (!active) return;
  const isUnsupportedLink = active.hasAttribute('tabindex'); // Only click on links that aren't already natively supported to prevent double clicking
  if(isUnsupportedLink) (active as HTMLAnchorElement).click();
})

// stolen from stackoverflow
/**
 * Check if an element is within the (vertical) viewport
 * @param that The jQuery selection.
 * @returns A boolean indicating the visibility of the element in the viewport
 */
function isInViewport(that: JQueryStatic) {
	let elementTop = $(that).offset()?.top || 0;
	let elementBottom = (elementTop || 0) + ($(that).outerHeight() || 0);
	let viewportTop = $(window).scrollTop() || 0;
	let viewportBottom = viewportTop + ($(window).height() || 0);
	return elementBottom > viewportTop && elementTop < viewportBottom;
};

