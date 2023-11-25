/**
 * @fileoverview Site-specific script for the achievements page.
 */

import { IAchievementAPIResponse, IAchievementItem } from "../types/achievements.js";
import { Color3B } from "../types/miscellaneous.js";
import { Handlebars } from "../vendor/index.js";

/**
 * Item toggle filtering in the settings menu.
 */
interface IDisabledFilters {
	/**
	 * A list of disabled (switched-off) reward options.
	 */
	reward: string[];
	/**
	 * A list of disabled (switched-off) type options.
	 */
	type: string[];
	/**
	 * A list of disabled (switched-off) game options.
	 */
	game: string[];
}

/**
 * Template parameters for the achievements query result.
 */
interface ISearchResultEntryTemplateParams {
	inForms: boolean;
	isColor: boolean;
	title?: string;
	iconPath: string;
	col?: Color3B;
	achGameColor: string;
	achItem: IAchievementItem;
	completed: boolean;
	completedColor: string;
	completedDescription: string;
}

const searchResultTemplateString = await (await fetch("/templates/achievements_searchResult.hbs")).text();
const searchResultTemplate = Handlebars.compile(searchResultTemplateString);

const rewardFilterTemplateString = await (await fetch("/templates/achievements_rewardFilter.hbs")).text();
const rewardFilterTemplate = Handlebars.compile(rewardFilterTemplateString);

const typeFilterTemplateString = await (await fetch("/templates/achievements_typeFilter.hbs")).text();
const typeFilterTemplate = Handlebars.compile(typeFilterTemplateString);

const disabledFilters: IDisabledFilters = {
	reward: [],
	type: [],
	game: []
};
const forms = ["icon", "ship", "ball", "ufo", "wave", "robot", "spider"];
const gameColors = {
	gd: "255,200,0",
	meltdown: "255, 100, 0",
	world: "100,220,0",
	subzero: "0,255,255"
};
const formStr = [
	"Icon", "Ship", "Ball", "UFO", "Wave", "Robot", "Spider", "Trail",
	"Death Effect", "Primary Color", "Secondary Color", "Misc"
];

const ach: IAchievementAPIResponse = await fetch('/api/achievements').then(res => res.json());

Object.keys(ach.types).forEach(achType => {
	$('#types').append(typeFilterTemplate({
		achType,
		filter: ach.types[achType][1].join(" "),
		achTitle: ach.types[achType][0]
	}));
});

let achievements = ach.achievements;
let completed = false;

forms.concat(["trail", "deathEffect", "color1", "color2", "misc"]).forEach((property, propertyIndex) => {
	$('#forms').append(rewardFilterTemplate({
		property,
		propertyForm: formStr[propertyIndex],
		iconSource: propertyIndex > 8 ? "achievements" : "iconkitbuttons"
	}));
});

/**
 * Append achievement item entries.
 * @param reset Whether to reset the scroll to the top.
 */
function append(reset: boolean = true) {
	$('#searchBox').html(`<div style="height: 4.5%"></div>`);
	achievements.forEach(achItem => {
		const appendTemplateData: ISearchResultEntryTemplateParams = {
			inForms: false,
			isColor: false,
			iconPath: "coin",
			col: { r: 0, g: 0, b: 0 },
			achGameColor: gameColors[achItem.game],
			achItem,
			completed,
			completedColor: completed ? "yellow" : "white",
			completedDescription: completed ? achItem.achievedDescription : achItem.description
		}
		if (forms.includes(achItem.rewardType)) {
			appendTemplateData.inForms = true;
			appendTemplateData.title = `${achItem.rewardType}_${achItem.rewardID < 10 ? "0" : ""}${achItem.rewardID}`;
		}
		else if (achItem.rewardType.startsWith("color")) {
			const col = ach.colors[achItem.rewardID];
			const colType = achItem.rewardType.slice(5);
			appendTemplateData.isColor = true;
			appendTemplateData.title = `${colType == "1" ? "Primary" : "Secondary"} Color ${achItem.rewardID}`;
			appendTemplateData.iconPath = "col" + colType;
			appendTemplateData.col = col;
		}
		else if (achItem.rewardType == "deathEffect") {
			appendTemplateData.title = `Death Effect ${achItem.rewardID}`;
			appendTemplateData.iconPath = `deatheffects/${achItem.rewardID}`;
		}
		else if (achItem.rewardType == "trail") {
			appendTemplateData.title = `Trail ${achItem.rewardID}`;
			appendTemplateData.iconPath = `trails/${achItem.rewardID}`;
		}
		else if (achItem.rewardType == "misc") {
			appendTemplateData.iconPath = "coin";
		}

		$("#searchBox").append(searchResultTemplate(appendTemplateData));
	});
	$('#searchBox').append('<div style="height: 4.5%"></div>');
	if (reset) $('#searchBox').scrollTop(0);
}

append();

function label(labelName: string) {
	const labelFilter = `.${labelName}Filter`;
	const labelID = `#${labelName}Label h1`;
	const labelButtons = `#${labelName}Label img`;
	$(labelFilter).hover(function() {
		$(labelButtons).addClass('hidey');
		$(labelID)
			.attr('text', $(labelID).text())
			.text($(this).attr('title')!.toString())
			.addClass("labelHover");
	}, function() {
		$(labelButtons).removeClass('hidey');
		$(labelID).text($(labelID).attr('text') || "").removeClass("labelHover");
	});

	$(labelFilter).on("click", function() {
		let filters = $(this).attr('filter')!.split(" ")
		if (!$(this).hasClass('achDeselected')) {
			$(this).addClass('achDeselected');
			filters.forEach(filter => disabledFilters[labelName].push(filter));
			if (labelName == "reward") {
				$(this).attr('src', $(this).attr('src')!.replace("_on", "_off"));
			}
		}
		else {
			$(this).removeClass('achDeselected')
			filters.forEach(filter => {
				disabledFilters[labelName] = disabledFilters[labelName]
					.filter((innerFilter: string) => innerFilter != filter);
			});
			if (labelName == "reward") {
				$(this).attr('src', $(this).attr('src')!.replace("_off", "_on"));
			}
		}
	});
}

label("reward");
label("type");
label("game");

$(document).on('click', '.selectNone', function() {
	$(`.${$(this).attr('filter')}:not(.achDeselected)`).trigger('click');
	$('#selectNone').hide();
	$('#selectAll').show();
});
$(document).on('click', '.selectAll', function() {
	$(`.${$(this).attr('filter')}.achDeselected`).trigger('click');
	$('#selectNone').show();
	$('#selectAll').hide();
});

$('#submitFilters').on("click", function() {
	$('.popup').hide();

	if (!$('.rewardFilter:not(.achDeselected)').length) {
		$('#rewardLabel .selectAll').trigger('click');
	}
	if (!$('.typeFilter:not(.achDeselected)').length) {
		$('#typeLabel .selectAll').trigger('click');
	}
	if (!$('.gameFilter:not(.achDeselected)').length) {
		$('#gameLabel .selectAll').trigger('click');
	}

	achievements = ach.achievements
		.filter(achievementItem => !disabledFilters.reward.includes(achievementItem.rewardType))
		.filter(achievementItem => !disabledFilters.type.some(filter => achievementItem.id.startsWith(filter)))
		.filter(achievementItem => !disabledFilters.game.includes(achievementItem.game));
	append();
});

$('#check').on("click", function() {
	completed = !completed;
	if (completed) $('#check').attr('src', '/assets/check-on.png');
	else $('#check').attr('src', '/assets/check-off.png');
	append(false);
});

export {};