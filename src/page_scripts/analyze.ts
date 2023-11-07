/**
 * @fileoverview Site-specific script for the level analysis page.
 */

import { IAnalysisResult, IAnalysisColorObject } from "../types/analyses.js";
import { toggleEscape, clean } from "../misc/global.js";
import { Color3B } from "../types/miscellaneous.js";

let disabledPortals: string[] = [];
let altTriggerSort = false;
const formPortals = ['cube', 'ship', 'ball', 'ufo', 'wave', 'robot', 'spider'];
const speedPortals = ['-1x', '1x', '2x', '3x', '4x'];
const sizePortals = ['mini', 'big'];
const dualPortals = ['dual', 'single'];
const mirrorPortals = ['mirrorOn', 'mirrorOff'];

fetch(`/api${window.location.pathname}`).then(res => res.json()).then((res: (IAnalysisResult | "-1" | "-2" | "-3")) => {
	if (typeof(res) != "object") {
		switch(res) {
			case "-1":
				$('#errorMessage').html("This level could not be be <cr>downloaded</cr>. Either the servers rejected the request, or the level simply <co>doesn't exist at all</co>.");
				break;
			case "-2":
				$('#errorMessage').html("This level's data appears to be <cr>corrupt</cr> and cannot be <cy>parsed</cy>. It most likely won't load in GD.");
				break;
			case "-3":
				$('#errorMessage').html("This level's data could not be obtained because <ca>RobTop</ca> has disabled <cg>level downloading</cg>.");
				break;
		}
		toggleEscape(false, true);
		$('#analyzeError').show();
		return $('#loadingDiv').hide();
	}
	$('#levelName').text(res.level.name);
	$('#objectCount').text(commafy(res.objects) + " objects");
	document.title = "Analysis of " + res.level.name;

	$('#meta-title').attr('content',  "Analysis of " + res.level.name);
	$('#meta-desc').attr('content',  `${res.portals.split(",").length}x portals, ${res.orbs.total || 0}x orbs, ${res.triggers.total || 0}x triggers, ${res.misc.glow || 0}x glow...`);


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

	let portals: (string | null)[][] = res.portals.split(", ").map(portal => portal.split(" "));

	/**
	 * Select every third digit of a string or number, then separate them using commas.
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

	/**
	 * Append portals into the result page
	 */
	function appendPortals() {
		if (typeof(res) != "object") return;
		$('#portals').html("");
		if (res.settings.gamemode && res.settings.gamemode != "cube" && !disabledPortals.includes('form')) $('#portals').append(`<div class="inline portalDiv"><img class="portalImage" src='/assets/objects/portals/${res.settings.gamemode}.png'><h3>Start</h3></div><img class="divider portalImage" src="/assets/divider.png" style="margin: 1.3% 0.8%">`);
		if (res.settings.startMini && !disabledPortals.includes('size')) $('#portals').append(`<div class="inline portalDiv"><img class="portalImage" src='/assets/objects/portals/mini.png'><h3>Start</h3></div><img class="divider portalImage" src="/assets/divider.png" style="margin: 1.3% 0.8%">`);
		if (res.settings.speed && res.settings.speed != "1x" && !disabledPortals.includes('speed')) $('#portals').append(`<div class="inline portalDiv"><img class="portalImage speedPortal" src='/assets/objects/portals/${res.settings.speed}.png'><h3>Start</h3></div><img class="divider portalImage" src="/assets/divider.png" style="margin: 1.3% 0.8%">`);
		if (res.settings.startDual && !disabledPortals.includes('dual')) $('#portals').append(`<div class="inline portalDiv"><img class="portalImage" src='/assets/objects/portals/dual.png'><h3>Start</h3></div><img class="divider portalImage" src="/assets/divider.png" style="margin: 1.3% 0.8%">`);

		let dividerCount = $('.divider').length - 1;

		$('.divider').each(function(dividerItem) {
			if (dividerItem != dividerCount) $(this).remove();
		});

		portals.forEach(portalItem => {
			if (!portalItem || portalItem[0] == "") return;
			$('#portals').append(`<div class="inline portalDiv"><img class="portalImage ${(portalItem[0] || "").match(/[0-9]x/) ? "speedPortal" : ""}" src='/assets/objects/portals/${portalItem[0]}.png'><h3>${portalItem[1]}</h3></div>`);
		});
	}

	/**
	 * Append trigger groups into the result page
	 */
	function appendTriggerGroups() {
		if (typeof(res) != "object") return;
		$('#groups').html("");
		let groupList = Object.keys(res.triggerGroups);
		if (!altTriggerSort) groupList = groupList.sort((a, b) => Number(a.slice(6)) - Number(b.slice(6)));
		groupList.forEach(groupID => {
			if (groupID == "total") $('#grouptext').text(`Trigger Groups (${commafy(res.triggerGroups[groupID])})`);
			else $('#groups').append(`<div class="inline groupDiv"><h1 class="groupID">${groupID.slice(6)}</h1><h3 style="padding-top: 7%">x${commafy(res.triggerGroups[groupID])}</h3></div>`);
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
			$('#coins').append(`<div class="inline orbDiv"><img style="height: 10vh;" src='/assets/objects/${res.coinsVerified ? "coin" : "browncoin"}.png'><h3 style="padding-top: 7%">${coinPos}%</h3></div>`);
		});
	}

	triggerList.forEach(triggerType => {
		if (triggerType == "total") $('#triggerText').text(`Triggers (${commafy(res.triggers[triggerType])})`);
		else $('#triggers').append(`<div class="inline triggerDiv"><img style="height: 10vh;" src='/assets/objects/triggers/${triggerType}.png'><h3 style="padding-top: 7%">x${commafy(res.triggers[triggerType])}</h3></div>`);
	});

	if (res.invisibleGroup) {
		$('#alphaGroupNum').text(res.invisibleGroup);
		$('#alphaGroup').show();
	}

	orbList.forEach(orbType => {
		if (orbType == "total") $('#orbText').text(`Jump Rings (${commafy(res.orbs[orbType])})`);
		else $('#orbs').append(`<div class="inline orbDiv"><img style="height: 10vh;" src='/assets/objects/orbs/${orbType}.png'><h3 style="padding-top: 7%">x${commafy(res.orbs[orbType])}</h3></div>`);
	});

	blockList.forEach(blockType => {
		$('#blocks').append(`<div class="inline blockDiv"><img style="height: 9vh;" src='/assets/objects/blocks/${blockType}.png'><h3 style="padding-top: 15%">x${commafy(res.blocks[blockType])}</h3></div>`);
	});

	miscList.forEach(itemType => {
		if (itemType == "objects") return;
		else $('#misc').append(`<div class="inline miscDiv"><img style="height: 8vh;" src='/assets/objects/${itemType.slice(0, -1)}.png'><h3 style="padding-top: 15%">x${commafy(res.misc[itemType][0])}<br>${res.misc[itemType][1]}</h3></div>`);
	});


	let bgCol: Color3B | undefined = res.colors.find(color => color.channel == "BG");
	let grCol: Color3B | undefined = res.colors.find(color => color.channel == "G");

	if (!bgCol) bgCol = {r: 40, g: 125, b: 255};
	else if (+bgCol.r < 35 && bgCol.g < 35 && bgCol.b < 35) bgCol = {r: 75, g: 75, b: 75};

	if (!grCol) grCol = {r: 0, g: 102, b: 255};
	else if (grCol.r < 35 && grCol.g < 35 && grCol.b < 35) grCol = {r: 75, g: 75, b: 75};

	$('#style').append(`<div class="inline styleDiv styleBG" style='background-color: rgb(${clean(bgCol.r)}, ${clean(bgCol.g)}, ${clean(bgCol.b)})'><img style="height: 12vh;" src='/assets/levelstyle/bg-${res.settings.background}.png'></div>`);
	$('#style').append(`<div class="inline styleDiv styleBG" style='background-color: rgb(${clean(grCol.r)}, ${clean(grCol.g)}, ${clean(grCol.b)})'><img style="height: 12vh;" src='/assets/levelstyle/gr-${res.settings.ground}.png'></div>`);
	$('#style').append(`<div class="inline styleDiv"><img style="height: 11vh;" src='/assets/levelstyle/font-${res.settings.font}.png'></div>`);
	$('#style').append(`<div class="inline styleDiv"><img style="height: 12vh;" src='/assets/levelstyle/line-${res.settings.alternateLine ? 2 : 1}.png'></div>`);
	if (res.settings.twoPlayer) {
		$('#style').append(`<div class="inline styleDiv"><img style="height: 12vh;" src='/assets/levelstyle/mode-2p.png'></div>`);
	}

	colorList.forEach((colorItem, colorIndex) => {
		const color = res.colors[colorItem];

		$('#colorDiv').append(`${colorIndex % 8 == 0 ? "<brr>" : ""}<div class="inline aColor"><div class="color" channel="${color.channel}" style="background-color: rgba(${clean(color.cr || color.r)}, ${clean(color.cg || color.g)}, ${clean(color.cb || color.b)}, ${clean(color.opacity)}); border: 0.4vh solid rgb(${color.r}, ${color.g}, ${color.b})">
			${color.copiedChannel ? `<h3 class='copiedColor'>C:${color.copiedChannel}</h3>` : color.pColor ? `<h3 class='copiedColor'>P${color.pColor}</h3>` : color.blending ? "<h3 class='blendingDot'>•</h3>" : ""}
			${color.copiedChannel && color.copiedHSV ? `<h3 class='copiedColor copiedHSV'> +HSV</h3>` : ""}
			${color.opacity != "1" ? `<h3 class='copiedColor'>${color.opacity}%</h3>` : ""}
			</div><h3 style="padding-top: 7%">${color.channel > 0 ? "Col " + color.channel : color.channel}</h3></div>`);
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

		portals = res.portals.split(", ").map(portalStrFormat => portalStrFormat.split(" "));
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
		$('#levelCode').focus().select();
	})

	$(document).on('click', '.color', function() {
		// TODO: This is kludgy.
		const col = res.colors.find(colorObject => colorObject.channel == $(this).attr('channel')) as IAnalysisColorObject;
		const hsv = col.copiedHSV;
		if (hsv) {
			hsv.s = Math.round(Number(hsv.s) * 100) / 100;
			hsv.v = Math.round(Number(hsv.v) * 100) / 100;
		}
		const hex = "#" + ((1 << 24) + (+col.r << 16) + (+col.g << 8) + +col.b).toString(16).slice(1);
		$('#colorStuff').html(`
		<h2 class="slightlySmaller">${isNaN(+(col.channel || "")) ? col.channel : "Color " + col.channel}</h2>
			<div class="colorSection">
				<h3>Hex Code</h3>
				<p>${hex}</p>
			</div>
			<div class="colorSection">
				<h3>RGB</h3>
				<p>${clean(col.r)}, ${clean(col.g)}, ${clean(col.b)}</p>
			</div>
			<div class="colorSection">
				<h3>Opacity</h3>
				<p>${Number(col.opacity).toFixed(2)}</p>
			</div>
			<br>
			<div class="colorSection2" style="width: 40%; ${col.copiedChannel ? "" : "margin-right:55.4%"}">
				<div class="colorCheckbox"><h3><input ${col.pColor == "1" ? "checked" : ""} type="checkbox"><label class="gdcheckbox gdButton"></label>Player 1</h3></div>
				<div class="colorCheckbox"><h3><input ${col.pColor == "2" ? "checked" : ""} type="checkbox"><label class="gdcheckbox gdButton"></label>Player 2</h3></div>
				<div class="colorCheckbox"><h3><input ${col.blending ? "checked" : ""} type="checkbox"> <label class="gdcheckbox gdButton"></label>Blending</h3></div>
				<div class="colorCheckbox"><h3><input ${col.copiedChannel ? "checked" : ""} type="checkbox"><label class="gdcheckbox gdButton"></label>Copy Color</h3></div>
				<div class="colorCheckbox"><h3><input ${col.copyOpacity ? "checked" : ""} type="checkbox"><label class="gdcheckbox gdButton"></label>Copy Opacity</h3></div>
			</div>
			${col.copiedChannel ? `
			<div class="colorSection2">
				<div class="colorSection copyDetails">
					<h3>Copied</h3>
					<p>${isNaN(col.copiedChannel) ? col.copiedChannel : "Col " + col.copiedChannel}</p>
				</div>
				<div class="colorSection copyDetails">
					<h3>Hue</h3>
					<p>${!hsv ? 0 : +hsv.h > 0 ? "+" + hsv.h : hsv.h}</p>
				</div>
				<div class="colorSection copyDetails">
					<h3>Saturation</h3>
					<p>${!hsv ? "x1.00" : !hsv['s-checked'] ? "x" + hsv.s : hsv.s > 0 ? "+" + hsv.s : hsv.s}</p>
				</div>
				<div class="colorSection copyDetails">
					<h3>Brightness</h3>
					<p>${!hsv ? "x1.00" : !hsv['v-checked'] ? "x" + hsv.v : hsv.v > 0 ? "+" + hsv.v : hsv.v}</p>
				</div>
			</div>`
			: `<div class="colorBox" style="background-color: rgba(${clean(col.r)}, ${clean(col.g)}, ${clean(col.b)}, ${clean(col.opacity)}); border-color: ${hex}"></div>`}
			<br><img src="/assets/ok.png" style="width: 14%; margin-top: 4%" class="gdButton center" onclick="$('.popup').hide()">`);
		$('#colorInfo').show();
	});

	$('#loadingDiv').hide();
	$('#analysisDiv').show();
});

export {};