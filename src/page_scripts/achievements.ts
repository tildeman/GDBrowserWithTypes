/**
 * @fileoverview Site-specific script for the achievements page.
 */

interface IDisabledFilters {
	reward: string[];
	type: string[];
	game: string[];
}

let disabledFilters: IDisabledFilters = {
	reward: [],
	type: [],
	game: []
};
let forms = ["icon", "ship", "ball", "ufo", "wave", "robot", "spider"];
let gameColors = { gd: "255,200,0", meltdown: "255, 100, 0", world: "100,220,0", subzero: "0,255,255" };
let achievements: AchievementItem[] = [];
let colors: Record<number, Color3B> = {};
let completed = false;

let formStr = ["Icon", "Ship", "Ball", "UFO", "Wave", "Robot", "Spider", "Trail", "Death Effect", "Primary Color", "Secondary Color", "Misc"];
forms.concat(["trail", "deathEffect", "color1", "color2", "misc"]).forEach((property, propertyIndex) => {
	$('#forms').append(`<img class="gdButton achFilter rewardFilter" filter="${property}" title="${formStr[propertyIndex]}" src="/assets/${propertyIndex > 8 ? "achievements" : "iconkitbuttons"}/${property}_on.png" style="margin: 0% 0.75%; height:7vh">`);
});

function append(reset: boolean = true) {
	$('#searchBox').html(`<div style="height: 4.5%"></div>`);
	achievements.forEach(achItem => {
		let iconImg = `"`;
		if (forms.includes(achItem.rewardType)) iconImg = `../iconkit/premade/${achItem.rewardType}_${achItem.rewardID}.png" width="90%" title="${achItem.rewardType}_${achItem.rewardID < 10 ? "0" : ""}${achItem.rewardID}"`;
		else if (achItem.rewardType.startsWith("color")) {
			let col = colors[achItem.rewardID];
			let colType = achItem.rewardType.slice(5);
			iconImg = `/assets/col${colType}.png" class="colorCircle" width="80%" title="${colType == "1" ? "Primary" : "Secondary"} Color ${achItem.rewardID}" style="background-color: rgb(${col.r}, ${col.g}, ${col.b})"`;
		}
		else if (achItem.rewardType == "deathEffect") iconImg = `/assets/deatheffects/${achItem.rewardID}.png" width="85%" title="Death Effect ${achItem.rewardID}"`;
		else if (achItem.rewardType == "trail") iconImg = `/assets/trails/${achItem.rewardID}.png" width="85%" title="Trail ${achItem.rewardID}"`;
		else if (achItem.rewardType == "misc") iconImg = `/assets/coin.png" width="85%"`;
		console.log(iconImg);

		$('#searchBox').append(`<div class="flex searchResult leaderboardSlot" style="align-items: center; height: 18%; width: 92%; padding-left: 3%; padding-top: 0%; overflow: hidden">
			<div class="flex" style="width: 8%; margin-right: 2%"><img src="${iconImg}></div>
			<div>
				<h2 title="${achItem.trueID}" class="smallerer" style="font-size: 4.5vh; margin-top: 2vh; color: rgb(${gameColors[achItem.game]})">${achItem.name}</h2>
				<p style="margin-top: 2vh; color:${completed ? "yellow" : "white"}">${completed ? achItem.achievedDescription : achItem.description}</p>
			</div>
		</div>`);
	});
	$('#searchBox').append('<div style="height: 4.5%"></div>');
	if (reset) $('#searchBox').scrollTop(0);
}

fetch('./api/achievements').then(res => res.json()).then((ach: AchievementAPIResponse) => {

	Object.keys(ach.types).forEach(achType => {
		$('#types').append(`<img class="gdButton achFilter typeFilter" filter="${ach.types[achType][1].join(" ")}" src="/assets/achievements/${achType}.png" title="${ach.types[achType][0]}"  style="margin: 0.6% 0.4%; height:6vh">`)
	})

	achievements = ach.achievements
	colors = ach.colors
	append()

	function label(labelName: string) {
		let labelFilter = `.${labelName}Filter`;
		let labelID = `#${labelName}Label h1`;
		let labelButtons = `#${labelName}Label img`;
		$(labelFilter).hover(function() {
			$(labelButtons).addClass('hidey');
			$(labelID).attr('text', $(labelID).text()).text($(this).attr('title')!.toString()).addClass("labelHover");
		}, function() {
			$(labelButtons).removeClass('hidey');
			$(labelID).text($(labelID).attr('text') || "").removeClass("labelHover");
		});

		$(labelFilter).click(function() {
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
				filters.forEach(filter => disabledFilters[labelName] = disabledFilters[labelName].filter((innerFilter: string) => innerFilter != filter));
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

	$('#submitFilters').click(function() {
		$('.popup').hide();

		if (!$('.rewardFilter:not(.achDeselected)').length) $('#rewardLabel .selectAll').trigger('click');
		if (!$('.typeFilter:not(.achDeselected)').length) $('#typeLabel .selectAll').trigger('click');
		if (!$('.gameFilter:not(.achDeselected)').length) $('#gameLabel .selectAll').trigger('click');

		achievements = ach.achievements
			.filter(achievementItem => !disabledFilters.reward.includes(achievementItem.rewardType))
			.filter(achievementItem => !disabledFilters.type.some(filter => achievementItem.id.startsWith(filter)))
			.filter(achievementItem => !disabledFilters.game.includes(achievementItem.game));
		append();
	});

	$('#check').click(function() {
		completed = !completed;
		if (completed) $('#check').attr('src', '/assets/check-on.png');
		else $('#check').attr('src', '/assets/check-off.png');
		append(false);
	});
});
export {};