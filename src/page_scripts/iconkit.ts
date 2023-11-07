/**
 * @fileoverview Site-specific script for the online icon kit.
 */
// hi there hello! this code is really old, so it's shit. i should rewrite it some time omg

import { Icon, iconData, loadIconLayers, parseIconColor, parseIconForm, rgbToDecimal } from "../iconkit/icon.js";
import { AnimationObject, IconConfiguration, IconData, IconKitAPIResponse } from "../types/icons.js";
import { AchievementAPIResponse, AchievementItem } from "../types/achievements.js";
import { Color3B } from "../types/miscellaneous.js";
import { PIXI } from "../vendor/index.js";

let currentForm = 'icon';
const mobile =  /Android|webOS|iPhone|iPad|iPod|BlackBerry/i.test(navigator.userAgent);
const yOffsets = { ball: -10, ufo: 30, spider: 7, swing: -15 };

let selectedIcon = 1;
let selectedForm = 'icon';

let selectedCol1 = 0;
let selectedCol2 = 3;
let selectedColG = 3;
let selectedColW: number | null = null;
let selectedColU: number | null = null;
let enableGlow = 0;

let enableSpoilers = false;
let clickedSpoilerWarning = false;

let shops = ["the Shop", "Scratch's Shop", "the Community Shop"];
let achievements: AchievementItem[] = [];
let shopIcons: { icon: number; type: string; price: number; shop: number; }[] = [];
let iconStuff: IconData & IconKitAPIResponse;
let unlockMode = false;
let currentAnimation: {} | {
	name: string;
	form: string;
} = {};
let animationMultiplier = 1;
let formCopy: string;

let icon: Icon | null = null;

const iconCanvas = document.getElementById('result') as HTMLCanvasElement;

let app = new PIXI.Application({
	view: iconCanvas,
	width: 300,
	height: 300,
	backgroundAlpha: 0
});

if (mobile) $('#logo').attr('width', '80%');

let iconSettings: string[] = (localStorage.iconkit || "").split(",");
iconSettings.forEach(setting => {
	$(`#box-${setting}`).prop('checked', true);
});

/**
 * Convert the first character in a string to uppercase.
 * @param str The string to convert.
 * @returns The converted string.
 */
function capitalize(str: string) {
	return str[0].toUpperCase() + str.slice(1);
}

/**
 * Generate a random integer in a range.
 * @param min The minimum value.
 * @param max The maximum value.
 * @returns A random value from `min` (inclusive) to `max` (inclusive).
 */
function randInt(min: number, max: number) {
	return Math.floor(Math.random() * (max - min + 1) ) + min;
}

/**
 * Set the background color of a color channel button.
 * @param channelID The channel ID (e.g.: `1`, `W` or `U`).
 * @param colValue The color value to set.
 * @param hex No effect. Uses hexadecimal if `colValue` is a string, raw RGB otherwise.
 */
function colorBG(channelID: string, colValue: Color3B | string, hex?: boolean) {
	$(`#cc${channelID} img`).css('background-color', (typeof(colValue) == "string") ? `#${colValue}` : `rgb(${colValue.r}, ${colValue.g}, ${colValue.b})`);
	if (typeof(colValue) == "object") $(`#cp${channelID}`).val(toHexCode(rgbToDecimal(colValue)));
}

/**
 * Separate extra color channels from main color channels, if visible.
 */
function colorSplit() {
	if ($("#colG").is(':visible') || $("#colW").is(':visible') || $("#colU").is(':visible')) {
		$('.colorSplit').show();
	}
	else $('.colorSplit').hide();
}

/**
 * Set the color of the icon.
 * @param type The channel ID.
 * @param col The color value.
 */
function setColor(type: string, col: string | number | null) {
	icon!.setColor(type, parseIconColor(col));
	updateDetails();
}

/**
 * Auxiliary function to update all details of the icon.
 */
function updateDetails() {
	checkGlow();
	colorSplit();
	checkAnimation();
	setExtras();
}

/**
 * Check if glow col tab should be visible.
 */
function checkGlow() {
	if (icon!.isGlowing()) {
		$('#colG').show();
		$('#ccG').show();
	}
	else {
		$('#colG').hide();
		$('#ccG').hide();
	}
	colorSplit();
	checkAnimation();
}

/**
 * Check if white col tab should be visible.
 */
function checkWhite() {
	let hasWhite = icon!.layers[0].sections.some(color => color.colorType == "w");
	if (hasWhite) {
		$('#colW').show();
		$('#ccW').show();
	}
	else {
		$('#colW').hide();
		$('#ccW').hide();
		$(`#colW-12`).trigger('click');
	}
}

/**
 * Check if animation selector should be visible.
 */
function checkAnimation() {
	let animationData = iconData!.robotAnimations.animations[selectedForm];
	if (animationData && !$(`#robotAnimation[form="${selectedForm}"]`).is(":visible")) {
		appendAnimations(selectedForm, animationData);
	}
	else if (!animationData) $('#animationOptions').hide();
}

/**
 * Sort animations in alphabetical order.
 * @param anim The record of animation objects.
 * @returns The sorted animation record.
 */
function animationSort(anim: Record<string, AnimationObject>) {
	return Object.keys(anim).sort((objectA, objectB) => objectA.localeCompare(objectB));
}

/**
 * Append a list of animations into the selection dropdown (for robots and spiders).
 * @param form The animation form (`robot` or `spider`).
 * @param animationData The animation data object.
 */
function appendAnimations(form: string, animationData: Record<string, AnimationObject>) {
	let animationNames = animationSort(animationData);
	$('#robotAnimation').html(animationNames.map(animationName => `<option form="${form}" value="${animationName}">${animationName.replace(/_/g, " ")}</option>`).join());
	$('#robotAnimation').val("idle");
	$('#robotAnimation').attr("form", selectedForm);

	if (iconSettings.includes("cursed")) Object.keys(iconData!.robotAnimations.animations).forEach(altForm => {
		if (altForm != form) {
			let altNames = animationSort(iconData!.robotAnimations.animations[altForm]);
			$('#robotAnimation').append(altNames.map(altName => `<option form="${altForm}" value="${altName}">*${altName.replace(/_/g, " ")} (${altForm})</option>`).join(""));
		}
	});

	$('#animationOptions').show();
}

/**
 * Include extra details about the current icon.
 */
function setExtras() {
	const extraInfo: Record<string, string> = {
		"Icon ID": `${iconStuff.forms[selectedForm].name} ${+selectedIcon}`,
		"Col 1": extraColString(selectedCol1),
		"Col 2": extraColString(selectedCol2)
	};

	if ($('#colG').is(":visible") && (parseIconColor(selectedColG) != parseIconColor(selectedCol2))) extraInfo["Glow"] = extraColString(selectedColG);
	if ($('#colW').is(":visible") && (parseIconColor(selectedColW) != 0xffffff)) extraInfo["White"] = extraColString(selectedColW);
	if ($('#colU').is(":visible") && (parseIconColor(selectedColU) != 0xffffff)) extraInfo["UFO Dome"] = extraColString(selectedColU);

	const foundCredit = iconStuff.iconCredits.find(creditsItem => creditsItem.form == selectedForm && creditsItem.id == selectedIcon);
	if (foundCredit) extraInfo["🎨 Artist"] = foundCredit.name;
	else if (icon?.new) {
		extraInfo["2.2 icon"] = "Yes!";
		extraInfo["🎨 Artist"] = "(uncredited)";
	}

	const extraData = Object.entries(extraInfo).map(infoProperty => `<div><p>${infoProperty[0]}: ${infoProperty[1]}</p></div>`);
	$('#extraInfo').html(extraData.join(""));
}

/**
 * Get a human-readable color string.
 * @param col The color as a hexadecimal string, number or null.
 * @returns The formatted text that includes the in-game color ID (if present) and the value.
 */
function extraColString(col: string | number | null) {
	const realCol = parseIconColor(col);
	const hexCol = toHexCode(realCol) ;
	const foundGDCol = Object.entries(iconStuff.colors).find(color => rgbToDecimal(color[1]) == realCol);
	return foundGDCol ? `${foundGDCol[0]} (${hexCol})` : hexCol;
}

/**
 * Format an RGB value in hexadecimal.
 * @param decimal The color value as a number.
 * @returns The formatted hexadecimal string.
 */
function toHexCode(decimal: number) {
	return "#" + decimal.toString(16).padStart(6, "0");
}

const rawIconKitData = await fetch("/api/iconkit");
const iconKitData: IconKitAPIResponse = await rawIconKitData.json();

iconStuff = Object.assign(iconData, iconKitData);

const forms = Object.keys(iconStuff.forms);

forms.forEach(form => {
	let spoil = ["swing", "jetpack"].includes(form);
	$("#iconTabs").append(`<button form="${form}"${spoil ? `isnew="true" style="display: none"` : ""} title="${iconStuff.forms[form].name}" class="blankButton iconTabButton"><img src="/assets/iconkitbuttons/${form}_off.png" style="width: 50px"></button>`);
	$("#copyForms").append(`<button form="${form}"${spoil ? `isnew="true" style="display: none"` : ""}  title="${iconStuff.forms[form].name}" class="blankButton copyForm"><img src="/assets/iconkitbuttons/${form}_off.png" style="width: 50px"></button>`);
})
$("#iconTabs").append(`<button title="Glow" class="blankButton glowToggle" id="glowbtn"><img id="glow" src="/assets/iconkitbuttons/streak_off.png" style="width: 50px"></button>`)

forms.forEach(form => {
	$("#iconKitParent").append(`<div id="${form}s" class="iconContainer"></div>`);
});

if (iconStuff.noCopy) $('#getUserIcon').remove();
else if (iconStuff.server) {
	$('#copyFrom').html(`Copying from the <cy>${iconStuff.server}</cy> servers`);
	$('#stealBox').css('height', '385px');
}

/**
 * Generate the current icon.
 * @param cb The optional callback after the icon is generated.
 */
async function generateIcon(): Promise<void> {
	const noDome = selectedForm == "ufo" && iconSettings.includes("ufo");
	const foundForm = parseIconForm(selectedForm);

	const isNew = await loadIconLayers(foundForm, selectedIcon);
	let iconArgs: IconConfiguration = {
		app,
		form: foundForm,
		id: selectedIcon,
		col1: parseIconColor(selectedCol1),
		col2: parseIconColor(selectedCol2),
		glow: enableGlow > 0,
		new: isNew
	};
	if (selectedCol2 != selectedColG) iconArgs.colG = parseIconColor(selectedColG);
	if (selectedColW) iconArgs.colW = parseIconColor(selectedColW);
	if (selectedColU) iconArgs.colU = parseIconColor(selectedColU);
	if (iconSettings.includes("ufo")) iconArgs.noUFODome = true;
	if (animationMultiplier != 1) iconArgs.animationSpeed = animationMultiplier;
	if (("form" in currentAnimation) && (currentAnimation.form && (iconSettings.includes("cursed") || currentAnimation.form == selectedForm))) {
		iconArgs.animation = currentAnimation.name;
		iconArgs.animationForm = currentAnimation.form;
	}

	icon = new Icon(iconArgs);
	icon.sprite.position.set(app.renderer.width / 2, (app.renderer.height / 2) + (yOffsets[selectedForm] || 0));
	updateDetails();
	checkWhite();
}

/**
 * Filter out the new icons. (?)
 * @param name The icon name.
 * @returns The filtered icons.
 */
function filterIcon(name: string) {
	return iconStuff.previewIcons.concat(iconStuff.newPreviewIcons).filter(iconName => iconName.startsWith(name)).sort(function (a, b) {
		return +a.replace(/[^0-9]/g, "") - +b.replace(/[^0-9]/g, "");
	});
}

/**
 * Append an icon into the selection.
 * @param form The icon form.
 * @param formName The icon form name.
 */
function appendIcon(form: string[], formName: string) {
	let imagesLoaded = 0;
	let totalLoaded = 0;
	const formContainer = $('#' + formName + 's');

	const hasMini = form[0].endsWith("_0.png");
	if (hasMini) form.shift();

	form.forEach(function (formItem, formIndex) {
		const newOne = iconStuff.newPreviewIcons.includes(formItem);
		formContainer.append(`<button num="${formIndex + 1}" form="${formName}"${newOne ? ` isnew="true"${enableSpoilers ? "" : ` style="display: none"`}` : ""} class="blankButton iconButton" id="${formName}-${formIndex + 1}"><img src="./${newOne ? "new" : ""}premade/${formItem}" title="${capitalize(formName)} ${formIndex + 1}"></button>`);
	});

	if (hasMini) {
		formContainer.append(`<button num="0" form="${formName}" class="blankButton iconButton" id="${formName}-0"><img src="./premade/${formName}_0.png" title="Mini ${formName}"></button>`);
	}

	(formContainer as any).imagesLoaded(function() {}).progress(function() {
		imagesLoaded += 1;
		totalLoaded = imagesLoaded / formContainer.find('img').length * 100;
		$('#iconloading').css('width', `${totalLoaded}%`);
	});
}

/**
 * Load the color channels.
 * @param devmode Unused value.
 */
function loadColors(devmode?: unknown) {
	let colTypes = [1, 2, "G", "W", "U"];
	colTypes.forEach(colorType => $(`#col${colorType}`).html(""));
	(iconStuff.colorOrder || []).forEach(function (colorID, n) {
		if (iconSettings.includes("sort")) colorID = n;
		colTypes.forEach(c => {
			let colRGB = iconStuff.colors[colorID];
			$(`#col${c}`).append(`<button col=${colorID} colType=color${c} class="blankButton color${c} iconColor" title="Color ${colorID} (#${toHexCode(rgbToDecimal(colRGB))})" id="col${c}-${colorID}"><div style="background-color: rgb(${colRGB.r}, ${colRGB.g}, ${colRGB.b})"></button>`);
		});
	});
	$('#col1').append("<span style='min-width: 10px'></span>");
}

loadColors();
let icons = filterIcon('icon');

let sample = JSON.parse(iconStuff.sample.join(""));
enableGlow = sample[3] * 2;
[selectedIcon, selectedCol1, selectedCol2] = sample;
selectedColG = selectedCol2;

($('body') as any).imagesLoaded(function () {
	appendIcon(icons, "icon");
	$(`[num="${sample[0]}"][form="icon"]`).addClass('iconSelected');
});

$(`.color1[col="${sample[1]}"]`).addClass('iconSelected');
$(`.color2[col="${sample[2]}"]`).addClass('iconSelected');
$(`.colorG[col="${sample[2]}"]`).addClass('iconSelected');
$('.colorW[col="12"]').addClass('iconSelected');
$('.colorU[col="12"]').addClass('iconSelected');

colorBG("1", iconStuff.colors[sample[1]]);
colorBG("2", iconStuff.colors[sample[2]]);
colorBG("G", iconStuff.colors[sample[2]]);

$('.colorLabel img').show();

await generateIcon();
icon!.glow = false;
enableGlow = 0; // disable glow after first generated

$(document).on('click', '.iconTabButton', function() {
	let form = $(this).attr('form');
	let formElement = '#' + form + 's';

	currentForm = form || "icon";

	$('.iconTabButton').each(function() {
		$(this).children().first().attr('src', $(this).children().first().attr('src')!.replace('_on', '_off'));
	});

	let img = $(this).children().first();
	img.attr('src', img.attr('src')!.replace('_off', '_on'));

	$('#iconKitParent').each(function() {
		$(this).children().not('#iconprogressbar').hide();
	});

	if ($(formElement).html() == "") appendIcon(filterIcon(form || "icon"), form || "icon");

	$(formElement).show();
});

$('#iconTabs').find('.iconTabButton').first().children().first().attr('src', $('.iconTabButton').first().children().first().attr('src')!.replace('_off', '_on'));

$("#randomIcon").on("click", function() {
	let iconPool = iconStuff.previewIcons.concat(enableSpoilers ? iconStuff.newPreviewIcons : []);
	let pickedIcon = iconPool[Math.floor(Math.random() * iconPool.length)].split(".")[0].split("_");
	let [randomForm, randomID] = pickedIcon;

	let colorCount = Object.keys(iconStuff.colors).length;
	selectedForm = randomForm;
	selectedIcon = +randomID;
	selectedCol1 = randInt(0, colorCount - 1);
	selectedCol2 = randInt(0, colorCount - 1);
	selectedColW = null;
	selectedColU = null;
	enableGlow = randInt(0, 2) == 1 ? 1 : 0;   // 1 in 3 chance of glow
	generateIcon();

	$('#glow').attr('src', '/assets/iconkitbuttons/streak_off.png');

	$(`.iconTabButton[form=${selectedForm}]`).trigger('click');
	$(`#${selectedForm}-${selectedIcon}`).trigger('click');
	$(`#col1-${selectedCol1}`).trigger('click');
	$(`#col2-${selectedCol2}`).trigger('click');
	$(`#colG-${selectedCol2}`).trigger('click');
	$('#colW-12').trigger('click');
	$('#colU-12').trigger('click');
	if (enableGlow == 1) $("#glow").attr('src', $("#glow").attr('src')!.replace('_off', '_on'));
	else $("#glow").attr('src', $("#glow").attr('src')!.replace('_on', '_off'));
});

$('#glowbtn').on("click", function () {
	if (enableGlow) {
		$("#glow").attr('src', $("#glow").attr('src')!.replace('_on', '_off'));
		enableGlow = 0;
	}
	else {
		$("#glow").attr('src', $("#glow").attr('src')!.replace('_off', '_on'));
		enableGlow = 1;
	}

	icon!.setGlow(enableGlow > 0);
	updateDetails();
});

$(document).on('click', '.copyForm', function() {
	$('.copyForm').each(function() {
		$(this).children().first().attr('src', $(this).children().first().attr('src')!.replace('_on', '_off'));
	});
	formCopy = $(this).attr('form') || "";
	const src = $(this).children().first().attr('src') || "";
	$(this).children().first().attr('src', src.replace('_off', '_on'));
});

$(document).on('click', '.iconButton', function() {
	$(".iconButton").removeClass("iconSelected");
	$(this).addClass('iconSelected');
	const oldForm = selectedForm;
	selectedIcon = Number($(this).attr('num')) || 0;
	selectedForm = $(this).attr('form') || "";

	if (selectedForm == "ufo") {
		$('#colU').show();
		$('#ccU').show()
	}
	else {
		$('#colU').hide();
		$('#ccU').hide();
		$(`#colU-12`).trigger('click');
	}

	if (selectedForm != oldForm) currentAnimation = {};

	colorSplit();

	generateIcon();
});

$(document).on('click', '.color1', function() {
	$(".color1").removeClass("iconSelected");
	$(this).addClass('iconSelected');
	selectedCol1 = Number($(this).attr('col')) || 0;
	colorBG('1', iconStuff.colors[$(this).attr('col') || "r"]);
	setColor("1", selectedCol1);
});

$(document).on('click', '.color2', function() {
	$(".color2").removeClass("iconSelected");
	$(this).addClass('iconSelected');
	selectedCol2 = Number($(this).attr('col')) || 0;
	colorBG('2', iconStuff.colors[$(this).attr('col') || "r"]);
	$(`#colG-${$(this).attr('col')}`).trigger('click')
	selectedColG = Number($(this).attr('col')) || 0;
	setColor("2", selectedCol2);
});

$(document).on('click', '.colorG', function() {
	$(".colorG").removeClass("iconSelected");
	$(this).addClass('iconSelected');
	selectedColG = Number($(this).attr('col')) || 0;
	colorBG('G', iconStuff.colors[$(this).attr('col') || "r"]);
	setColor("g", selectedColG);
});

$(document).on('click', '.colorW', function() {
	$(".colorW").removeClass("iconSelected");
	$(this).addClass('iconSelected');
	selectedColW = Number($(this).attr('col')) || 0;
	if (selectedColW == 12) selectedColW = null;
	colorBG('W', iconStuff.colors[$(this).attr('col') || "r"]);
	setColor("w", selectedColW);
});

$(document).on('click', '.colorU', function() {
	$(".colorU").removeClass("iconSelected");
	$(this).addClass('iconSelected');
	selectedColU = Number($(this).attr('col')) || 0;
	if (selectedColU == 12) selectedColU = null;
	colorBG('U', iconStuff.colors[$(this).attr('col') || "r"]);
	setColor("u", selectedColU);
});

$("#cp1").on('input change', function() {
	colorBG('1', $(this).val()!.toString(), true);
	$(".color1").removeClass("iconSelected");
	selectedCol1 = +($('#cp1').val()!.toString().slice(1)) || 0;
	setColor("1", selectedCol1);
});

$("#cp2").on('input change', function() {
	colorBG('2', $(this).val()!.toString(), true);
	$(".color2").removeClass("iconSelected");
	selectedCol2 = +($('#cp2').val()!.toString().slice(1)) || 0;
	setColor("2", selectedCol2);
});

$("#cpG").on('input change', function() {
	colorBG('G', $(this).val()!.toString(), true);
	$(".colorG").removeClass("iconSelected");
	selectedColG = +($('#cpG').val()!.toString().slice(1)) || 0;
	setColor("g", selectedColG);
});

$("#cpW").on('input change', function() {
	colorBG('W', $(this).val()!.toString(), true);
	$(".colorW").removeClass("iconSelected");
	selectedColW = +($('#cpW').val()!.toString().slice(1)) || 0;
	setColor("w", selectedColW);
});

$("#cpU").on('input change', function() {
	colorBG('U', $(this).val()!.toString(), true);
	$(".colorU").removeClass("iconSelected");
	selectedColU = +($('#cpU').val()!.toString().slice(1)) || 0;
	setColor("u", selectedColU);
});

$("#getUserIcon").on("click", function() {
	$(`.copyForm[form=${currentForm}]`).trigger('click');
	$('#steal').show();
	$('#playerName').focus();
	$('#playerName').select();
});

$('#copyToClipboard').on("click", function() {
	if ($(this).hasClass('greyedOut')) return;
	icon!.copyToClipboard();
	let copyIcon = $(this).find('img');
	$(this).addClass('greyedOut');
	copyIcon.attr('src', '/assets/iconkitbuttons/copied.png');
	setTimeout(() => {
		$(this).removeClass('greyedOut');
		copyIcon.attr('src', '/assets/iconkitbuttons/copy.png');
	}, 420);
});


$('#robotAnimation').on('change', function() {
	let prevForm = ("form" in currentAnimation) ? currentAnimation.form : "";
	currentAnimation = {
		name: $(this).val()!.toString(),
		form: $('#robotAnimation').find(":selected").attr('form') || ""
	};
	if (!("form" in currentAnimation)) return;
	if (currentAnimation.form != prevForm) {
		generateIcon().then(function() {
			if ("form" in currentAnimation) {
				icon!.setAnimation(currentAnimation.name, currentAnimation.form);
			}
		});
	}
	else icon!.setAnimation(currentAnimation.name, currentAnimation.form);
});

let hoverText = $('#helpText').html();
$(".help").hover(function() {
	$(this).css('color', 'rgba(200, 255, 255)');
	$('#helpText').html($(this).attr('help') || "");
}, function() {
	$(this).css('color', 'white');
	$('#helpText').html(hoverText);
});

$(document).on('change', '.iconsetting', function(e) {
	let checkedSettings: string[] = [];
	$('.iconsetting:checkbox:checked').each((i, setting) => {
		checkedSettings.push(setting.id.split('-')[1]);
	});
	iconSettings = checkedSettings
	switch ($(this).attr('id')!.slice(4)) {
		case "sort": loadColors(); break;
		case "ufo": generateIcon(); break;
		case "cursed":
			$('#animationOptions').hide();
			checkAnimation();
			$('#robotAnimation').trigger('change');
			break;
	}
	localStorage.iconkit = checkedSettings.join(",");
});

$('#unlockIcon').on("click", function() {
	if (!achievements.length) {
		fetch('/api/achievements').then(res => {
			res.json().then((achievementsItem: AchievementAPIResponse) => {
				achievements = achievementsItem.achievements;
				shopIcons = iconStuff.shops;
				unlockMode = true;
				$('#lock').attr('src', $('#lock').attr('src')!.replace('.png', '_on.png'));
				$('#howto').show();
			});
		});
	}
	else {
		unlockMode = !unlockMode;
		if (unlockMode) {
			$('#lock').attr('src', $('#lock').attr('src')!.replace('.png', '_on.png'));
			$('#howto').show();
		}
		else {
			$('#lock').attr('src', $('#lock').attr('src')!.replace('_on.png', '.png'));
			$('#howto').hide();
		}
	}
});

$(document).on('mouseover', '.iconButton, .color1, .color2', function() {
	if (unlockMode && achievements.length) {
		$(this).addClass('iconHover');
		let form = $(this).attr('form') || $(this).attr('colType');
		let iconNumber = $(this).attr('num') || $(this).attr('col');
		$('#howto').html(getUnlockMethod(Number(iconNumber) || 0, form || "") || `<span style='color: #aaaaaa'>(no info available)</span>`);
	}
});

$(document).on('mouseleave', '.iconButton, .color1, .color2', function() {
	$(this).removeClass('iconHover');
	$('#howto').html("<span style='color: #aaaaaa'>(hover over an icon for info)</span>");
});

$("#fetchUser").on("click", async function() {
	let user = $("#playerName").val();
	if (!user || typeof(user) == "number" || !user.length) {
		return $("#steal").hide();
	}

	$(`.iconTabButton[form=${formCopy}]`).trigger('click');
	$('#glow').attr('src', '/assets/iconkitbuttons/streak_off.png');
	$("#steal").hide();
	enableGlow = 0;

	let info = await fetch('/api/profile/' + user).then(res => res.json()).catch(e => {
		console.error(e.message);
	});
	if (info == "-1") info = {};

	$(`#${formCopy}-${Math.min(info[formCopy] || 1, $(`.iconButton[form=${formCopy}]`).length)}`).trigger('click');
	$(`#col1-${info.col1 || 0}`).trigger('click');
	$(`#col2-${info.col2 || 3}`).trigger('click');
	$(`#colG-${info.col2 || 3}`).trigger('click');
	$(`#colW-12`).trigger('click');
	$(`#colU-12`).trigger('click');
	if (info.glow) $('#glowbtn').trigger('click');
});

/**
 * Retrieve the unlock method of an icon.
 * @param iconNumber The numeric ID of the icon.
 * @param form The form (gamemode) of the icon.
 * @returns A human-readable string indicating the unlock method.
 */
function getUnlockMethod(iconNumber: number, form: string) {
	if (form == "swing" || form == "jetpack") return "Coming soon™";
	else if (iconNumber == 0 && form == "icon") return "Legacy mini icon, enable in settings";
	else if (iconNumber == 1 || ((form == "icon") && iconNumber <= 4) || ((form.startsWith('color')) && iconNumber <= 3)) return "Always unlocked";

	let method = iconStuff.hardcodedUnlocks.find(unlockItem => unlockItem.form == form && unlockItem.id == iconNumber);
	let foundAch = achievements.find(unlockItem => unlockItem.rewardType == form && unlockItem.rewardID == +iconNumber);
	let foundMerch = shopIcons.find(unlockItem => unlockItem.type == form && unlockItem.icon == +iconNumber);

	if (method) {
		switch (method.type) {
			// Update 2.2 will feature a lot more chests. This will update accordingly.
			case "treasureRoom": return `Found in a ${method.keys == 5 ? "large" : "small"} chest in the Treasure Room`;
			case "treasureRoomMilestone": return `Open ${method.chests} chests in the Treasure Room`;
			case "gauntlet": return `Complete the ${method.gauntlet} gauntlet`;
			default: return method.unlock || "Unknown";
		}
	}

	if (foundAch) return foundAch.description.replace("Demon difficulty", "Demon");
	else if (foundMerch) return `Purchase in ${shops[foundMerch.shop]} for <ca>${foundMerch.price}</ca> orbs`;

	return "Unknown";
}

/**
 * Switch the state that determines whether to include 2.2 icons.
 */
function toggleSpoilers() {
	if (enableSpoilers) {
		$("#newIconBtn").attr('src', $("#newIconBtn").attr('src')!.replace('_on', ''));
		enableSpoilers = false;
	}

	else {
		$("#newIconBtn").attr('src', $("#newIconBtn").attr('src')!.replace('.png', '_on.png'));
		enableSpoilers = true;
	}

	if (enableSpoilers) $('button[isNew]').show();
	else $('button[isNew]').hide();
}

$('#animationSpeed').on('input', function() {
	animationMultiplier = Number($(this).val());
	$('#animationSpeedBox').val(animationMultiplier);
	if (icon?.complex) icon.animationSpeed = animationMultiplier;
});

$('#animationSpeedBox').on("change", function() {
	animationMultiplier = Number(Math.abs(Number($(this).val()) || 1).toFixed(2));
	if (animationMultiplier > 99) animationMultiplier = 99;
	else if (animationMultiplier <= 0) animationMultiplier = 0.1;
	$('#animationSpeed').val(animationMultiplier);
	$('#animationSpeedBox').val(animationMultiplier);
	if (icon?.complex) icon.animationSpeed = animationMultiplier;
});

$(document).on("keydown", function(k) {
	if (k.which == 13) { // enter
		if ($("#steal").is(":visible")) $("#fetchUser").trigger('click');
		else if ($(".popup").is(":visible")) return;
	}
	if (k.which == 27) { //esc
		if ($(".popup").is(":visible")) return $('.popup').hide();
		k.preventDefault();
		$('#backButton').trigger('click');
	}
});

$(document).on('click', '.brownbox', function (e) {
	e.stopPropagation();
});

// $(document).on('click', '.popup', function () {
// 	$('.popup').hide();
// });

$("#newIconBtn").on("click", function() {
	clickedSpoilerWarning ? toggleSpoilers() : $('#spoilerWarning').show();
})

$("#downloadIconPNG").on("click", function() {
	icon?.pngExport();
});

$("#downloadIconPSD").on("click", function() {
	icon?.psdExport();
});

$("#iconSettings").on("click", function() {
	$('#settings').show();
});

$("#revealSpoilers").on("click", function() {
	clickedSpoilerWarning = true;
	toggleSpoilers();
	$('#spoilerWarning').hide();
});

export {};