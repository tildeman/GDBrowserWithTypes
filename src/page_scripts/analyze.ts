/**
 * @fileoverview Site-specific script for the level analysis page.
 */

interface CopiedHSV {
	h: number | string;
	s: number | string;
	v: number | string;
	"s-checked": boolean;
	"v-checked": boolean;
}

interface AnalysisColorObject {
	r: number;
	g: number;
	b: number;
	channel?: string;
	opacity?: number;
	copiedHSV?: CopiedHSV;
	pColor?: number;
	blending?: number;
	copiedChannel?: number;
	copyOpacity?: number;
}

interface AnalysisResult {
	level: {
		name: string;
		id: string;
		author: string;
		playerID: string;
		accountID: string;
		large: boolean;
	};
	objects: number;
	highDetail: number;
	hdPercent?: number;
	portals: string; // The most stupid implementation I've ever seen
	coins: number[];
	coinsVerified: boolean;
	orbs: Record<string, number> & {
		/**
		 * The total number of jump rings in the level
		 */
		total: number;
	};
	triggers: Record<string, number> & {
		/**
		 * The total number of triggers in the level
		 */
		total: number;
	};
	triggerGroups: Record<string, number>;
	invisibleGroup: number;
	text: [string, string][];
	settings: {
		songOffset: number;
		fadeIn: boolean;
		fadeOut: boolean;
		background: number;
		ground: number;
		alternateLine: boolean;
		font: number;
		gamemode: string;
		startMini: boolean;
		startDual: boolean;
		speed: string;
		twoPlayer: false;
	}
	colors: AnalysisColorObject[];
	dataLength: number;
	data: string;
	blocks: Record<string, number>; // Can be more specific; see `blocks.json`
	misc: Record<string, [number, string]>;
}

/**
 * Sanitize potentially dangerous code.
 * @param text The text to replace characters.
 * @returns The sanitized text that is safe to display.
 */
function clean(text: string | number | undefined) {
	return (text || "").toString()
		.replace(/&/g, "&#38;")
		.replace(/</g, "&#60;")
		.replace(/>/g, "&#62;")
		.replace(/=/g, "&#61;")
		.replace(/"/g, "&#34;")
		.replace(/'/g, "&#39;");
}

let disabledPortals: string[] = [];
let altTriggerSort = false;
let formPortals = ['cube', 'ship', 'ball', 'ufo', 'wave', 'robot', 'spider'];
let speedPortals = ['-1x', '1x', '2x', '3x', '4x'];
let sizePortals = ['mini', 'big'];
let dualPortals = ['dual', 'single'];
let mirrorPortals = ['mirrorOn', 'mirrorOff'];

fetch(`../api${window.location.pathname}`).then(res => res.json()).then((res: (AnalysisResult | -1 | -2 | -3)) => {
	if (typeof(res) != "object") {
		switch(res) {
			case -1:
				$('#errorMessage').html("This level could not be be <cr>downloaded</cr>. Either the servers rejected the request, or the level simply <co>doesn't exist at all</co>.");
				break;
			case -2:
				$('#errorMessage').html("This level's data appears to be <cr>corrupt</cr> and cannot be <cy>parsed</cy>. It most likely won't load in GD.");
				break;
			case -3:
				$('#errorMessage').html("This level's data could not be obtained because <ca>RobTop</ca> has disabled <cg>level downloading</cg>.");
				break;
		}
		popupEsc = false;
		$('#analyzeError').show();
		return $('#loadingDiv').hide();
	}
	$('#levelName').text(res.level.name);
	$('#objectCount').text(commafy(res.objects) + " objects");
	document.title = "Analysis of " + res.level.name;

	$('#meta-title').attr('content',  "Analysis of " + res.level.name);
	$('#meta-desc').attr('content',  `${res.portals.split(",").length}x portals, ${res.orbs.total || 0}x orbs, ${res.triggers.total || 0}x triggers, ${res.misc.glow || 0}x glow...`);


	let hdPercent = (res.highDetail / res.objects) * 100;
	if (res.highDetail == 0 || res.hdPercent == 0) $('#highDetailDiv').hide();
	else {
		let offset = hdPercent < 20 ? 1 : hdPercent < 40 ? 2 : hdPercent < 60 ? 3 : hdPercent < 80 ? 4 : 5;
		$('#highdetail').append(`<div class="inline" style="width:${hdPercent + offset}%; height: 100%; background-color: lime; margin-left: -2.25%"></div>`);
		$('#hdText').text(`${commafy(res.highDetail)}/${commafy(res.objects)} marked high detail • ${+hdPercent.toFixed(1)}% optimized`);
	}

	let triggerList = Object.keys(res.triggers);
	let orbList = Object.keys(res.orbs);
	let miscList = Object.keys(res.misc);
	let blockList = Object.keys(res.blocks);
	let colorList = Object.keys(res.colors);

	let portals: (string | null)[][] = res.portals.split(", ").map(x => x.split(" "));

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
		if (res.settings.gamemode && res.settings.gamemode != "cube" && !disabledPortals.includes('form')) $('#portals').append(`<div class="inline portalDiv"><img class="portalImage" src='../assets/objects/portals/${res.settings.gamemode}.png'><h3>Start</h3></div><img class="divider portalImage" src="../assets/divider.png" style="margin: 1.3% 0.8%">`);
		if (res.settings.startMini && !disabledPortals.includes('size')) $('#portals').append(`<div class="inline portalDiv"><img class="portalImage" src='../assets/objects/portals/mini.png'><h3>Start</h3></div><img class="divider portalImage" src="../assets/divider.png" style="margin: 1.3% 0.8%">`);
		if (res.settings.speed && res.settings.speed != "1x" && !disabledPortals.includes('speed')) $('#portals').append(`<div class="inline portalDiv"><img class="portalImage speedPortal" src='../assets/objects/portals/${res.settings.speed}.png'><h3>Start</h3></div><img class="divider portalImage" src="../assets/divider.png" style="margin: 1.3% 0.8%">`);
		if (res.settings.startDual && !disabledPortals.includes('dual')) $('#portals').append(`<div class="inline portalDiv"><img class="portalImage" src='../assets/objects/portals/dual.png'><h3>Start</h3></div><img class="divider portalImage" src="../assets/divider.png" style="margin: 1.3% 0.8%">`);

		let dividerCount = $('.divider').length - 1;

		$('.divider').each(function(y) {
			if (y != dividerCount) $(this).remove();
		});

		portals.forEach(x => {
			if (!x || x[0] == "") return;
			$('#portals').append(`<div class="inline portalDiv"><img class="portalImage ${(x[0] || "").match(/[0-9]x/) ? "speedPortal" : ""}" src='../assets/objects/portals/${x[0]}.png'><h3>${x[1]}</h3></div>`);
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
		groupList.forEach(x => {
			if (x == "total") $('#grouptext').text(`Trigger Groups (${commafy(res.triggerGroups[x])})`);
			else $('#groups').append(`<div class="inline groupDiv"><h1 class="groupID">${x.slice(6)}</h1><h3 style="padding-top: 7%">x${commafy(res.triggerGroups[x])}</h3></div>`);
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
		res.coins.forEach(x => {
			$('#coins').append(`<div class="inline orbDiv"><img style="height: 10vh;" src='../assets/objects/${res.coinsVerified ? "coin" : "browncoin"}.png'><h3 style="padding-top: 7%">${x}%</h3></div>`);
		});
	}

	triggerList.forEach(x => {
		if (x == "total") $('#triggerText').text(`Triggers (${commafy(res.triggers[x])})`);
		else $('#triggers').append(`<div class="inline triggerDiv"><img style="height: 10vh;" src='../assets/objects/triggers/${x}.png'><h3 style="padding-top: 7%">x${commafy(res.triggers[x])}</h3></div>`);
	});

	if (res.invisibleGroup) {
		$('#alphaGroupNum').text(res.invisibleGroup);
		$('#alphaGroup').show();
	}

	orbList.forEach(x => {
		if (x == "total") $('#orbText').text(`Jump Rings (${commafy(res.orbs[x])})`);
		else $('#orbs').append(`<div class="inline orbDiv"><img style="height: 10vh;" src='../assets/objects/orbs/${x}.png'><h3 style="padding-top: 7%">x${commafy(res.orbs[x])}</h3></div>`);
	});

	blockList.forEach(x => {
		$('#blocks').append(`<div class="inline blockDiv"><img style="height: 9vh;" src='../assets/objects/blocks/${x}.png'><h3 style="padding-top: 15%">x${commafy(res.blocks[x])}</h3></div>`);
	});

	miscList.forEach(x => {
		if (x == "objects") return;
		else $('#misc').append(`<div class="inline miscDiv"><img style="height: 8vh;" src='../assets/objects/${x.slice(0, -1)}.png'><h3 style="padding-top: 15%">x${commafy(res.misc[x][0])}<br>${res.misc[x][1]}</h3></div>`);
	});


	let bgCol = res.colors.find(x => x.channel == "BG");
	let grCol = res.colors.find(x => x.channel == "G");

	if (!bgCol) bgCol = {r: 40, g: 125, b: 255};
	else if (+bgCol.r < 35 && bgCol.g < 35 && bgCol.b < 35) bgCol = {r: 75, g: 75, b: 75};

	if (!grCol) grCol = {r: 0, g: 102, b: 255};
	else if (grCol.r < 35 && grCol.g < 35 && grCol.b < 35) grCol = {r: 75, g: 75, b: 75};

	$('#style').append(`<div class="inline styleDiv styleBG" style='background-color: rgb(${clean(bgCol.r)}, ${clean(bgCol.g)}, ${clean(bgCol.b)})'><img style="height: 12vh;" src='../assets/levelstyle/bg-${res.settings.background}.png'></div>`);
	$('#style').append(`<div class="inline styleDiv styleBG" style='background-color: rgb(${clean(grCol.r)}, ${clean(grCol.g)}, ${clean(grCol.b)})'><img style="height: 12vh;" src='../assets/levelstyle/gr-${res.settings.ground}.png'></div>`);
	$('#style').append(`<div class="inline styleDiv"><img style="height: 11vh;" src='../assets/levelstyle/font-${res.settings.font}.png'></div>`);
	$('#style').append(`<div class="inline styleDiv"><img style="height: 12vh;" src='../assets/levelstyle/line-${res.settings.alternateLine ? 2 : 1}.png'></div>`);
	if (res.settings.twoPlayer) {
		$('#style').append(`<div class="inline styleDiv"><img style="height: 12vh;" src='../assets/levelstyle/mode-2p.png'></div>`);
	}

	colorList.forEach((x, y) => {
		let c = res.colors[x];

		$('#colorDiv').append(`${y % 8 == 0 ? "<brr>" : ""}<div class="inline aColor"><div class="color" channel="${c.channel}" style="background-color: rgba(${clean(c.cr || c.r)}, ${clean(c.cg || c.g)}, ${clean(c.cb || c.b)}, ${clean(c.opacity)}); border: 0.4vh solid rgb(${c.r}, ${c.g}, ${c.b})">
			${c.copiedChannel ? `<h3 class='copiedColor'>C:${c.copiedChannel}</h3>` : c.pColor ? `<h3 class='copiedColor'>P${c.pColor}</h3>` : c.blending ? "<h3 class='blendingDot'>•</h3>" : ""}
			${c.copiedChannel && c.copiedHSV ? `<h3 class='copiedColor copiedHSV'> +HSV</h3>` : ""}
			${c.opacity != "1" ? `<h3 class='copiedColor'>${c.opacity}%</h3>` : ""}
			</div><h3 style="padding-top: 7%">${c.channel > 0 ? "Col " + c.channel : c.channel}</h3></div>`);
	});

	if (colorList.length == 0) {
		$('#colorDiv').append('<h3 style="margin-top: 7vh">Could not get color info!</h3>');
	}

	$('#triggerSort').click(function() {
		altTriggerSort = !altTriggerSort;
		$('#triggerSort').text(altTriggerSort ? "Most Used" : "Ascending");
		appendTriggerGroups();
	});

	$(".portalToggle").click(function() {
		if ($(this).prop('checked')) disabledPortals = disabledPortals.filter(x => x != $(this).attr('portal'));
		else disabledPortals.push($(this).attr('portal') || "");

		portals = res.portals.split(", ").map(x => x.split(" "));
		if (disabledPortals.includes('form')) portals = portals.filter(x => !formPortals.includes(x[0] || ""));
		if (disabledPortals.includes('speed')) portals = portals.filter(x => !speedPortals.includes(x[0] || ""));
		if (disabledPortals.includes('size')) portals = portals.filter(x => !sizePortals.includes(x[0] || ""));
		if (disabledPortals.includes('dual')) portals = portals.filter(x => !dualPortals.includes(x[0] || ""));
		if (disabledPortals.includes('mirror')) portals = portals.filter(x => !mirrorPortals.includes(x[0] || ""));

		if (disabledPortals.includes('dupe')) {
			portals.reverse().forEach((x, y) => {
				if (portals[y + 1] && portals[y + 1][0] == x[0]) portals[y][0] = null;
			});
			portals = portals.reverse().filter(x => x[0] != null);
		}

		appendPortals();
	});

	let dataSize: [number, string] = [Number((res.dataLength / 1024 / 1024).toFixed(1)), "MB"];
	if (dataSize[0] < 1) dataSize = [Number((res.dataLength / 1024).toFixed(1)), "KB"];

	$('#codeLength').html(`${commafy(res.dataLength)} characters (${dataSize.join(" ")})`);

	$('#revealCode').click(function() {
		$('#levelCode').html('<p>Loading...</p>');

		window.setTimeout(function () { //small delay so "loading" message appears
			$('#levelCode').html(`<p class="codeFont">${clean(res.data).replace(/\n/g, "<br>")}</p>`);
		}, 50);
		$('#levelCode').focus().select();
	})

	$(document).on('click', '.color', function() {
		// TODO: This is kludgy.
		let col = res.colors.find(x => x.channel == $(this).attr('channel'));
		let hsv = col!.copiedHSV;
		if (hsv) {
			hsv.s = Number(hsv.s).toFixed(2);
			hsv.v = Number(hsv.v).toFixed(2);
		}
		let hex = "#" + ((1 << 24) + (+col!.r << 16) + (+col!.g << 8) + +col!.b).toString(16).slice(1);
		$('#colorStuff').html(`
		<h2 class="slightlySmaller">${isNaN(+(col!.channel || "")) ? col!.channel : "Color " + col!.channel}</h2>
			<div class="colorSection">
				<h3>Hex Code</h3>
				<p>${hex}</p>
			</div>
			<div class="colorSection">
				<h3>RGB</h3>
				<p>${clean(col!.r)}, ${clean(col!.g)}, ${clean(col!.b)}</p>
			</div>
			<div class="colorSection">
				<h3>Opacity</h3>
				<p>${Number(col!.opacity).toFixed(2)}</p>
			</div>
			<br>
			<div class="colorSection2" style="width: 40%; ${col!.copiedChannel ? "" : "margin-right:55.4%"}">
				<div class="colorCheckbox"><h3><input ${col!.pColor == 1 ? "checked" : ""} type="checkbox"><label class="gdcheckbox gdButton"></label>Player 1</h3></div>
				<div class="colorCheckbox"><h3><input ${col!.pColor == 2 ? "checked" : ""} type="checkbox"><label class="gdcheckbox gdButton"></label>Player 2</h3></div>
				<div class="colorCheckbox"><h3><input ${col!.blending ? "checked" : ""} type="checkbox"> <label class="gdcheckbox gdButton"></label>Blending</h3></div>
				<div class="colorCheckbox"><h3><input ${col!.copiedChannel ? "checked" : ""} type="checkbox"><label class="gdcheckbox gdButton"></label>Copy Color</h3></div>
				<div class="colorCheckbox"><h3><input ${col!.copyOpacity ? "checked" : ""} type="checkbox"><label class="gdcheckbox gdButton"></label>Copy Opacity</h3></div>
			</div>
			${col!.copiedChannel ? `
			<div class="colorSection2">
				<div class="colorSection copyDetails">
					<h3>Copied</h3>
					<p>${isNaN(col!.copiedChannel) ? col!.copiedChannel : "Col " + col!.copiedChannel}</p>
				</div>
				<div class="colorSection copyDetails">
					<h3>Hue</h3>
					<p>${!hsv ? 0 : +hsv.h > 0 ? "+" + hsv.h : hsv.h}</p>
				</div>
				<div class="colorSection copyDetails">
					<h3>Saturation</h3>
					<p>${!hsv ? "x1.00" : !hsv['s-checked'] ? "x" + hsv.s : +hsv.s > 0 ? "+" + hsv.s : hsv.s}</p>
				</div>
				<div class="colorSection copyDetails">
					<h3>Brightness</h3>
					<p>${!hsv ? "x1.00" : !hsv['v-checked'] ? "x" + hsv.v : +hsv.v > 0 ? "+" + hsv.v : hsv.v}</p>
				</div>
			</div>`
			: `<div class="colorBox" style="background-color: rgba(${clean(col!.r)}, ${clean(col!.g)}, ${clean(col!.b)}, ${clean(col!.opacity)}); border-color: ${hex}"></div>`}
			<br><img src="../assets/ok.png" width=14%; style="margin-top: 4%" class="gdButton center" onclick="$('.popup').hide()">`);
		$('#colorInfo').show();
	});

	$('#loadingDiv').hide();
	$('#analysisDiv').show();
});

export {};