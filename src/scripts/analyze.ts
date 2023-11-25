/**
 * @fileoverview Site-specific script for the level analysis page.
 */

import { IAnalysisResult, IAnalysisColorObject } from "../types/analyses.js";
import { Color3B, ErrorObject } from "../types/miscellaneous.js";
import { toggleEscape, clean } from "../misc/global.js";
import { Handlebars } from "../vendor/index.js";

const portalDivisionTemplateString = await (await fetch("/templates/analyze_portalDivision.hbs")).text();
const portalDivisionTemplate = Handlebars.compile(portalDivisionTemplateString);

const objectDivisionTemplateString = await (await fetch("/templates/analyze_objectDivision.hbs")).text();
const objectDivisionTemplate = Handlebars.compile(objectDivisionTemplateString);

const groupDivisionTemplateString = await (await fetch("/templates/analyze_groupDivision.hbs")).text();
const groupDivisionTemplate = Handlebars.compile(groupDivisionTemplateString);

const styleDivisionTemplateString = await (await fetch("/templates/analyze_styleDivision.hbs")).text();
const styleDivisionTemplate = Handlebars.compile(styleDivisionTemplateString);

const colorInfoTemplateString = await (await fetch("/templates/analyze_colorInfo.hbs")).text();
const colorInfoTemplate = Handlebars.compile(colorInfoTemplateString);

const colorPropertiesTemplateString = await (await fetch("/templates/analyze_colorProperties.hbs")).text();
const colorPropertiesTemplate = Handlebars.compile(colorPropertiesTemplateString);


let disabledPortals: string[] = [];
let altTriggerSort = false;
/**
 * A list of available form (gamemode) portals
 */
const formPortals = ['cube', 'ship', 'ball', 'ufo', 'wave', 'robot', 'spider'];
/**
 * A list of available speed portals
 */
const speedPortals = ['-1x', '1x', '2x', '3x', '4x'];
/**
 * A list of available size portals
 */
const sizePortals = ['mini', 'big'];
/**
 * A list of available dual portals
 */
const dualPortals = ['dual', 'single'];
/**
 * A list of available mirror portals
 */
const mirrorPortals = ['mirrorOn', 'mirrorOff'];

const apiResponse = await fetch(`/api${window.location.pathname}`);
const res: (IAnalysisResult | ErrorObject) = await apiResponse.json();
if ("error" in res) {
	switch(res.error) {
		case 2:
			$('#errorMessage').html("This level could not be be <cr>downloaded</cr>. Either the servers rejected the request, or the level simply <co>doesn't exist at all</co>.");
			break;
		case 4:
			$('#errorMessage').html("This level's data could not be obtained because <ca>RobTop</ca> has disabled <cg>level downloading</cg>.");
			break;
		case 5:
			$('#errorMessage').html("This level's data appears to be <cr>corrupt</cr> and cannot be <cy>parsed</cy>. It most likely won't load in GD.");
			break;
	}
	toggleEscape(false, true);
	$('#analyzeError').show();
	$('#loadingDiv').hide();
	throw new Error("Can't parse the requested level.");
}

$('#levelName').text(res.level.name);
$('#objectCount').text(commafy(res.objects) + " objects");
document.title = "Analysis of " + res.level.name;

$('#meta-title').attr('content', "Analysis of " + res.level.name);
$('#meta-desc').attr('content', `${res.portals.length}x portals, ${res.orbs.total || 0}x orbs, ${res.triggers.total || 0}x triggers, ${res.misc.glow || 0}x glow...`);


const hdPercent = (res.highDetail / res.objects) * 100;
if (res.highDetail == 0 || hdPercent == 0) $('#highDetailDiv').hide();
else {
	const offset = Math.min(Math.floor(hdPercent / 20) + 1, 5);
	$('#highdetail').append(`<div class="inline" style="width:${hdPercent + offset}%; height: 100%; background-color: lime; margin-left: -2.25%"></div>`);
	$('#hdText').text(`${commafy(res.highDetail)}/${commafy(res.objects)} marked high detail • ${+hdPercent.toFixed(1)}% optimized`);
}

const triggerList = Object.keys(res.triggers);
const orbList = Object.keys(res.orbs);
const miscList = Object.keys(res.misc);
const blockList = Object.keys(res.blocks);
const colorList = Object.keys(res.colors);

let portals = res.portals;

/**
 * Select every three digits of a string or number, then separate them using commas.
 * @param num The string or a number to split into commas
 * @returns A comma-separated string
 *
 * @example
 * commafy("9494949494"); // Returns "9,494,949,494"
 *
 * @example
 * commafy(12345678); // Returns "12,345,678"
 */
function commafy(num: string | number) {
	return (+num || 0).toString().replace(/(\d)(?=(\d\d\d)+$)/g, "$1,");
}

interface IPortalInfo {
	portalName: string;
	extraClasses: string;
	portalPos: string;
	addDivider: boolean;
}

/**
 * Append portals into the result page
 */
function appendPortals() {
	if ("error" in res) return;
	$('#portals').html("");

	const portalStartData: IPortalInfo = {
		portalName: "",
		extraClasses: "",
		portalPos: "Start",
		addDivider: true
	};

	if (res.settings.gamemode && res.settings.gamemode != "cube" && !disabledPortals.includes('form')) {
		portalStartData.portalName = res.settings.gamemode;
		$("#portals").append(portalDivisionTemplate(portalStartData));
	}
	if (res.settings.startMini && !disabledPortals.includes('size')) {
		portalStartData.portalName = "mini";
		$("#portals").append(portalDivisionTemplate(portalStartData));
	}
	if (res.settings.speed && res.settings.speed != "1x" && !disabledPortals.includes('speed')) {
		portalStartData.portalName = res.settings.speed;
		portalStartData.extraClasses = " speedPortal";
		$("#portals").append(portalDivisionTemplate(portalStartData));
		portalStartData.extraClasses = "";
	}
	if (res.settings.startDual && !disabledPortals.includes('dual')) {
		portalStartData.portalName = "dual";
		$("#portals").append(portalDivisionTemplate(portalStartData));
	}

	let dividerCount = $('.divider').length - 1;

	$('.divider').each(function(dividerItem) {
		if (dividerItem != dividerCount) $(this).remove();
	});

	portals.forEach(portalItem => {
		if (!portalItem || portalItem[0] == "") return;

		const portalData: IPortalInfo = {
			portalName: portalItem[0] || "",
			extraClasses: (portalItem[0] || "").match(/[0-9]x/) ? " speedPortal" : "",
			portalPos: portalItem[1],
			addDivider: false
		};
		$("#portals").append(portalDivisionTemplate(portalData));
	});
}

/**
 * Append trigger groups into the result page.
 */
function appendTriggerGroups() {
	if ("error" in res) return;
	$('#groups').html("");
	let groupList = Object.keys(res.triggerGroups);
	if (!altTriggerSort) groupList = groupList.sort((groupA, groupB) => Number(groupA.slice(6)) - Number(groupB.slice(6)));
	groupList.forEach(groupID => {
		if (groupID == "total") $('#grouptext').text(`Trigger Groups (${commafy(res.triggerGroups[groupID])})`);
		else $("#groups").append(groupDivisionTemplate({
			groupID: groupID.slice(6),
			groupCount: commafy(res.triggerGroups[groupID])
		}));
	});
}

appendPortals();
appendTriggerGroups();

if (!res.coins || !res.coins.length) {
	$('#coinText').remove();
	$('#coins').remove();
}

else {
	$('#coinText').text(`User Coins (${res.coins.length})`);
	res.coins.forEach(coinPos => {
		$("#coins").append(objectDivisionTemplate({
			objType: "orb",
			objIcon: res.coinsVerified ? "coin" : "browncoin",
			objName: `${coinPos}%`,
			height: 10,
			pad: 7
		}));
	});
}

triggerList.forEach(triggerType => {
	if (triggerType == "total") $('#triggerText').text(`Triggers (${commafy(res.triggers[triggerType])})`);
	else $("#triggers").append(objectDivisionTemplate({
		objType: "trigger",
		objIcon: `triggers/${triggerType}`,
		objName: "x" + commafy(res.triggers[triggerType]),
		height: 10,
		pad: 7
	}));
});

if (res.invisibleGroup) {
	$('#alphaGroupNum').text(res.invisibleGroup);
	$('#alphaGroup').show();
}

orbList.forEach(orbType => {
	if (orbType == "total") $('#orbText').text(`Jump Rings (${commafy(res.orbs[orbType])})`);
	else $("#orbs").append(objectDivisionTemplate({
		objType: "orb",
		objIcon: `orbs/${orbType}`,
		objName: "x" + commafy(res.orbs[orbType]),
		height: 10,
		pad: 7
	}));
});

blockList.forEach(blockType => {
	$("#blocks").append(objectDivisionTemplate({
		objType: "block",
		objIcon: `blocks/${blockType}`,
		objName: "x" + commafy(res.blocks[blockType]),
		height: 9,
		pad: 15
	}));
});

miscList.forEach(itemType => {
	if (itemType == "objects") return;
	else $("#misc").append(objectDivisionTemplate({
		objType: "misc",
		objIcon: itemType.slice(0, -1),
		objName: `x${commafy(res.misc[itemType][0])}`,
		objName2: res.misc[itemType][1],
		height: 8,
		pad: 15
	}));
});


let bgCol: Color3B | undefined = res.colors.find(color => color.channel == "BG");
let grCol: Color3B | undefined = res.colors.find(color => color.channel == "G");

if (!bgCol) bgCol = {r: 40, g: 125, b: 255};
// else if (+bgCol.r < 35 && bgCol.g < 35 && bgCol.b < 35) bgCol = {r: 75, g: 75, b: 75}; // If the colors are almost black, pitch them up.

if (!grCol) grCol = {r: 0, g: 102, b: 255};
// else if (grCol.r < 35 && grCol.g < 35 && grCol.b < 35) grCol = {r: 75, g: 75, b: 75}; // If the colors are almost black, pitch them up.

$("#style").append(styleDivisionTemplate({
	styleName: `bg-${res.settings.background}`,
	col: bgCol
}));
$("#style").append(styleDivisionTemplate({
	styleName: `gr-${res.settings.ground}`,
	col: grCol
}));
$("#style").append(styleDivisionTemplate({
	styleName: `font-${res.settings.font}`,
	shiftUp: true
}));
$("#style").append(styleDivisionTemplate({
	styleName: `line-${res.settings.alternateLine ? 2 : 1}`
}));

if (res.settings.twoPlayer) {
	$("#style").append(styleDivisionTemplate({
		styleName: "mode-2p"
	}));
}

colorList.forEach((colorItem, colorIndex) => {
	const color: IAnalysisColorObject = res.colors[colorItem];
	$("#colorDiv").append(colorInfoTemplate({
		triplyEvenColIndex: colorIndex % 8 == 0,
		color,
		copiedChannelAndHSV: color.copiedChannel && color.copiedHSV,
		hasAlpha: color.opacity != 1,
		colorChannelName: (+color.channel) > 0 ? "Col " + color.channel : color.channel
	}));
});

if (colorList.length == 0) {
	$('#colorDiv').append('<h3 style="margin-top: 7vh">Could not get color info!</h3>');
}

$('#triggerSort').on("click", function() {
	altTriggerSort = !altTriggerSort;
	$('#triggerSort').text(altTriggerSort ? "Most Used" : "Ascending");
	appendTriggerGroups();
});

$(".portalToggle").on("click", function() {
	if ($(this).prop('checked')) disabledPortals = disabledPortals.filter(portal => portal != $(this).attr('portal'));
	else disabledPortals.push($(this).attr('portal') || "");

	portals = res.portals;
	if (disabledPortals.includes('form')) portals = portals.filter(portal => !formPortals.includes(portal[0] || ""));
	if (disabledPortals.includes('speed')) portals = portals.filter(portal => !speedPortals.includes(portal[0] || ""));
	if (disabledPortals.includes('size')) portals = portals.filter(portal => !sizePortals.includes(portal[0] || ""));
	if (disabledPortals.includes('dual')) portals = portals.filter(portal => !dualPortals.includes(portal[0] || ""));
	if (disabledPortals.includes('mirror')) portals = portals.filter(portal => !mirrorPortals.includes(portal[0] || ""));

	if (disabledPortals.includes('dupe')) {
		portals.reverse().forEach((portalEntry, portalIndex) => {
			if (portals[portalIndex + 1] && portals[portalIndex + 1][0] == portalEntry[0]) portals[portalIndex][0] = null;
		});
		portals = portals.reverse().filter(portalItem => portalItem[0] != null);
	}

	appendPortals();
});

let dataSize: [number, string] = [Number((res.dataLength / 1024 / 1024).toFixed(1)), "MB"];
if (dataSize[0] < 1) dataSize = [Number((res.dataLength / 1024).toFixed(1)), "KB"];

$('#codeLength').html(`${commafy(res.dataLength)} characters (${dataSize.join(" ")})`);

$('#revealCode').on("click", function() {
	$('#levelCode').html('<p>Loading...</p>');

	window.setTimeout(function () { //small delay so "loading" message appears
		$('#levelCode').html(`<p class="codeFont">${clean(res.data).replace(/\n/g, "<br>")}</p>`);
	}, 50);
	$("#levelCode").trigger("focus").trigger("select");
});

$(document).on('click', '.color', function() {
	// TODO: This is kludgy.
	const col = res.colors.find(colorObject => colorObject.channel == $(this).attr('channel')) as IAnalysisColorObject;
	const hsv = col.copiedHSV;
	if (hsv) {
		hsv.s = Math.round(Number(hsv.s) * 100) / 100;
		hsv.v = Math.round(Number(hsv.v) * 100) / 100;
	}
	const hex = "#" + ((1 << 24) + (+col.r << 16) + (+col.g << 8) + +col.b).toString(16).slice(1);
	$("#colorStuff").html(colorPropertiesTemplate({
		colorChannel: isNaN(+(col.channel || "")) ? col.channel : "Color " + col.channel,
		hex,
		col,
		formattedOpacity: Number(col.opacity).toFixed(2),
		P1: col.pColor == "1",
		P2: col.pColor == "2",
		copiedDetails: isNaN(col.copiedChannel || NaN) ? "NaN" : "Col " + col.copiedChannel!.toString(),
		copiedHue: !hsv ? 0 : +hsv.h > 0 ? "+" + hsv.h : hsv.h,
		copiedSaturation: !hsv ? "x1.00" : !hsv['s-checked'] ? "x" + hsv.s : hsv.s > 0 ? "+" + hsv.s : hsv.s,
		copiedBrightness: !hsv ? "x1.00" : !hsv['v-checked'] ? "x" + hsv.v : hsv.v > 0 ? "+" + hsv.v : hsv.v
	}));
	$('#colorInfo').show();
});

$('#loadingDiv').hide();
$('#analysisDiv').show();

export {};