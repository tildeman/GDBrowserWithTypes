/**
 * @fileoverview Spaghetti code for level analysis.
 */

import { AnalysisColorObject, AnalysisResult, LevelObject, LevelSettings, RelevantHeaderResponse } from "../types/analyses.js";
import properties from "../misc/analysis/objectProperties.json" assert { type: "json" };
import colorStuff from "../misc/analysis/colorProperties.json" assert { type: "json" };
import init from "../misc/analysis/initialProperties.json" assert { type: "json" };
import blocks from "../misc/analysis/blocks.json" assert { type: "json" };
import ids from "../misc/analysis/objects.json" assert { type: "json" };
import { DownloadedLevel } from "../classes/Level.js";
import { Request, Response } from "express";
import zlib from "zlib";

/**
 * Analyze a level (controller function).
 * @param req The client request (nothing relevant).
 * @param res The server response (to send the level details/error).
 * @param level The level containing data as a string.
 * @returns A Promise that resolves to `void`.
 */
export default async function(req: Request, res: Response, level?: DownloadedLevel) {
	if (!level) {
		return res.status(500).send("44");
	}

	let unencrypted = level.data.startsWith("kS"); // some gdps"es don"t encrypt level data
	let levelString = unencrypted ? level.data : Buffer.from(level.data, "base64");

	if (unencrypted) {
		const raw_data = level.data;

		const response_data = analyze_level(level, raw_data);
		return res.send(response_data);
	}
	else {
		zlib.unzip(levelString, (err, buffer) => {
			if (err) {
				return res.status(500).send("-2");
			}

			const raw_data = buffer.toString();
			const response_data = analyze_level(level, raw_data);
			return res.send(response_data);
		});
	}
}

/**
 * Sort an object.
 * @param obj The object to be sorted.
 * @param sortBy How to sort the object.
 * @returns The sorted object.
 */
function sortObj(obj: {}, sortBy?: string) {
	var sorted = {};
	var keys = !sortBy ? Object.keys(obj).sort((objectA, objectB) => obj[objectB] - obj[objectA]) : Object.keys(obj).sort((objectA, objectB) => obj[objectB][sortBy] - obj[objectA][sortBy]);
	keys.forEach(key => {
		sorted[key] = obj[key];
	});
	return sorted;
}

/**
 * Parse an object and return another object only containing values in name_arr.
 * @param obj The level object to parse.
 * @param splitter The delimiter to use.
 * @param name_arr A mapping of names to collect.
 * @param valid_only Use only keys in the name array.
 * @returns An object containing the specified names.
 */
function parse_obj(obj: string, splitter: string, name_arr: (string | null)[] | Record<string, unknown>, valid_only?: boolean): Record<string, string> {
	const s_obj = obj.split(splitter);
	let robtop_obj: Record<string, string> = {};

	// semi-useless optimization depending on where at node js you"re at
	for (let i = 0, obj_l = s_obj.length; i < obj_l; i += 2) {
		let k_name = s_obj[i];
		if (s_obj[i] in name_arr) {
			if (!valid_only) {
				// Everything can be flattened into a string
				k_name = String(name_arr[s_obj[i]]);
			}
			robtop_obj[k_name] = s_obj[i + 1];
		}
	}
	return robtop_obj;
}

/**
 * Read the level data, and then infer some details about the level.
 * @param level The level object containg the data.
 * @param rawData The raw level string.
 * @returns An object containing some important level details.
 */
function analyze_level(level: DownloadedLevel, rawData: string) {
	let blockCounts: Record<string, number> = {};
	let miscCounts: Record<string, [number, string]> = {};
	let triggerGroups: string[] = [];
	let highDetail = 0;
	let alphaTriggers: LevelObject[] = [];

	let misc_objects: Record<number, string> = {};
	let block_ids: Record<string, string> = {};

	for (const [name, object_ids] of Object.entries(ids.misc)) {
		const copied_ids = object_ids.slice(1) as number[];
		// funny enough, shift effects the original id list
		copied_ids.forEach((object_id) => {
			misc_objects[object_id] = name;
		});
	}

	for (const [name, object_ids] of Object.entries(blocks)) {
		object_ids.forEach((object_id) => {
			block_ids[object_id] = name;
		});
	}

	const data = rawData.split(";");
	const header = data.shift();

	const objdata: LevelObject[] = [];
	let level_portals: LevelObject[] = [];
	let level_coins: LevelObject[] = [];
	let level_text: LevelObject[] = [];

	let orb_array: Record<string, number> = {};
	let trigger_array: Record<string, number> = {};

	let last = 0;
	let obj: LevelObject;

	const obj_length = data.length;
	for (let i = 0; i < obj_length; ++i) {
		const raw_obj = parse_obj(data[i], ",", properties);
		obj = {
			id: raw_obj.id || "",
			portal: raw_obj.portal,
			coin: raw_obj.coin,
			orb: raw_obj.orb,
			trigger: raw_obj.trigger,
			message: raw_obj.message,
			triggerGroups: raw_obj.triggerGroups,
			highDetail: Number(raw_obj) || undefined,
			x: Number(raw_obj.x) || undefined,
			touchTriggered: raw_obj.touchTriggered ? true : false,
			spawnTriggered: raw_obj.spawnTriggered ? true : false,
			opacity: Number(raw_obj.opacity) || undefined,
			duration: Number(raw_obj.duration) || undefined,
			targetGroupID: raw_obj.targetGroupID
		};

		let id = obj.id;

		if (id in ids.portals) {
			obj.portal = ids.portals[id];
			level_portals.push(obj);
		}
		else if (id in ids.coins) {
			obj.coin = ids.coins[id];
			level_coins.push(obj);
		}
		else if (id in ids.orbs) {
			obj.orb = ids.orbs[id] || "";

			if (obj.orb) {
				if (obj.orb in orb_array) {
					orb_array[obj.orb]++;
				}
				else {
					orb_array[obj.orb] = 1;
				}
			}
		}
		else if (id in ids.triggers) {
			obj.trigger = ids.triggers[id];

			if (obj.trigger) {
				if (obj.trigger in trigger_array) {
					trigger_array[obj.trigger]++;
				}
				else {
					trigger_array[obj.trigger] = 1;
				}
			}
		}

		if (obj.message) {
			level_text.push(obj);
		}

		if (obj.triggerGroups) {
			obj.triggerGroups.split(".").forEach(triggerGroup => triggerGroups.push(triggerGroup));
		}
		if (obj.highDetail == 1) highDetail += 1;

		if (id in misc_objects) {
			const name = misc_objects[id];
			if (name in miscCounts) {
				miscCounts[name][0] += 1;
			}
			else {
				miscCounts[name] = [1, ids.misc[name][0]];
			}
		}

		if (id in block_ids) {
			const name = block_ids[id];
			if (name in blockCounts) {
				blockCounts[name] += 1;
			}
			else {
				blockCounts[name] = 1;
			}
		}

		if (obj.x) { // sometimes the field doesn"t exist
			last = Math.max(last, obj.x);
		}

		if (obj.trigger == "Alpha") { // invisible triggers
			alphaTriggers.push(obj);
		}

		objdata.push(obj);
	}

	let invisTriggers: number[] = [];
	alphaTriggers.forEach(tr => {
		if ((tr.x || 0) < 500 && !tr.touchTriggered && !tr.spawnTriggered && tr.opacity == 0 && tr.duration == 0
			&& alphaTriggers.filter(trigger => trigger.targetGroupID == tr.targetGroupID).length == 1) {
			invisTriggers.push(Number(tr.targetGroupID));
		}
	});

	const responseLevel = {
		name: level.name,
		id: level.id,
		author: level.author,
		playerID: level.playerID,
		accountID: level.accountID,
		large: level.large
	};

	const responseObjects = data.length - 2;
	const responseHighDetail = highDetail;

	const responsePortals = level_portals.sort(function (portalA, portalB) {
		return (portalA.x || 0) - (portalB.x || 0);
	}).map(portal => portal.portal + " " + Math.floor((portal.x || 0) / (Math.max(last, 529.0) + 340.0) * 100) + "%").join(", ");
	const responseCoins = level_coins.sort(function (coinA, coinB) {
		return (coinA.x || 0) - (coinB.x || 0);
	}).map(coin => Math.floor((coin.x || 0) / (Math.max(last, 529.0) + 340.0) * 100));
	const responseCoinsVerified = level.verifiedCoins;

	const responseOrbs = orb_array;
	responseOrbs.total = Object.values(orb_array).reduce((orbID, orbIndex) => orbID + orbIndex, 0); // we already have an array of objects, use it

	const responseTriggers = trigger_array;
	responseTriggers.total = Object.values(trigger_array).reduce((triggerID, triggerIndex) => triggerID + triggerIndex, 0);

	let responseTriggerGroups: Record<string, number> = {};
	const responseBlocks = sortObj(blockCounts);
	const responseMisc = sortObj(miscCounts, "0");

	triggerGroups.forEach(triggerGroup => {
		if (responseTriggerGroups["Group " + triggerGroup]) responseTriggerGroups["Group " + triggerGroup] += 1;
		else responseTriggerGroups["Group " + triggerGroup] = 1;
	});

	responseTriggerGroups = sortObj(responseTriggerGroups);
	let triggerKeys = Object.keys(responseTriggerGroups).map(triggerGroup => Number(triggerGroup.slice(6)));
	if ("total" in responseTriggerGroups) responseTriggerGroups.total = triggerKeys.length;

	// find alpha group with the most objects
	const responseInvisibleGroup = triggerKeys.find(trigger => invisTriggers.includes(trigger));

	const responseText = level_text.sort(function (levelTextA, levelTextB) {
		return (levelTextA.x || 0) - (levelTextB.x || 0);
	}).map(levelText => [Buffer.from(levelText.message || "", "base64").toString(), Math.round((levelText.x || 0) / last * 99) + "%"]);

	const headerResponse = parse_header(header || "") as { settings: LevelSettings, colors: AnalysisColorObject[] };
	const responseSettings: LevelSettings = headerResponse.settings;
	const responseColors = headerResponse.colors;

	const responseDataLength = rawData.length;
	const responseData = rawData;

	const response: AnalysisResult = {
		level: responseLevel,
		objects: responseObjects,
		highDetail: responseHighDetail,
		portals: responsePortals,
		coins: responseCoins,
		coinsVerified: responseCoinsVerified,
		orbs: responseOrbs,
		triggers: responseTriggers,
		triggerGroups: responseTriggerGroups,
		invisibleGroup: responseInvisibleGroup,
		text: responseText,
		settings: responseSettings,
		colors: responseColors,
		dataLength: responseDataLength,
		data: responseData,
		blocks: responseBlocks,
		misc: responseMisc
	};

	return response;
}

/**
 * Parse the level header.
 * @param header The header string of mostly useless stuff.
 * @returns An object containing relevant settings and colors.
 */
function parse_header(header: string) {
	let response: RelevantHeaderResponse = {
		settings: {},
		colors: []
	};

	const header_keyed = parse_obj(header, ",", init.values, true);

	Object.keys(header_keyed).forEach(header => {
		let val = init.values[header];
		let name: string = val[0];
		let property = header_keyed[header];
		switch (val[1]) {
			case "list":
				val = init[(val[0] + "s")][property];
				break;
			case "number":
				val = Number(property);
				break;
			case "bump":
				val = Number(property) + 1;
				break;
			case "bool":
				val = property != "0";
				break;
			case "extra-legacy-color": { // scope?
				// you can only imagine my fear when i discovered this was a thing
				// these literally are keys set the value, and to convert this to the color list we have to do this fun messy thing that shouldn"t exist
				// since i wrote the 1.9 color before this, a lot of explaination will be there instead
				const colorInfo = name.split("-");
				const color = colorInfo[2]; // r, g, b
				const channel = colorInfo[1];

				if (color == "r") {
					// first we create the color object
					response.colors.push({ channel: channel, opacity: 1, r: 0, g: 0, b: 0 });
				}
				// from here we touch the color object
				let currentChannel = response.colors.find(colorItem => colorItem.channel == channel);
				if (color == "blend") {
					currentChannel!.blending = true; // only one color has blending though lol
				} else if (color == "pcol" && property != "0") {
					currentChannel!.pColor = property;
				}
				currentChannel![color] = property;
				break;
			}
			case "legacy-color": {
				// if a level has a legacy color, we can assume that it does not have a kS38 at all
				const color = parse_obj(property, "_", colorStuff.properties);

				// so here we parse the color to something understandable by the rest
				// slightly smart naming but it is also pretty gross
				// in a sense - the name would be something like legacy-G -> G
				const colorVal = name.split("-").pop();

				// let colorObj = color as unknown as ColorObject;
				const colorObj: AnalysisColorObject = {
					channel: colorVal || "",
					pColor: color.pColor,
					opacity: 1, // 1.9 colors don"t have this!
					r: +color.r || 0,
					g: +color.g || 0,
					b: +color.b || 0
				};

				// from here stuff can continue as normal, ish
				if (colorObj.pColor == "-1" || colorObj.pColor == "0") delete colorObj.pColor;
				if (color.blending && color.blending == "1") colorObj.blending = true; // 1.9 colors manage to always think they"re blending - they"re not
				else delete colorObj.blending;

				if (colorVal == "3DL") { // hardcode the position of 3DL, it typically goes at the end due to how RobTop makes the headers
					response.colors.splice(4, 0, colorObj);
				}
				else if (colorVal == "Line") {  // in line with 2.1 behavior
					colorObj.blending = true;
					response.colors.push(colorObj);
				}
				else { // bruh whatever was done to make the color list originally was long
					response.colors.push(colorObj);
				}
				break;
			}
			case "colors": {
				let colorList: string[] = property.split("|");
				let colorList2: AnalysisColorObject[] = [];
				colorList.forEach((colorItem, colorIndex) => {
					const color = parse_obj(colorItem, "_", colorStuff.properties);
					const raw_hsv_value: string[] | undefined = color.copiedHSV?.split("a");
					const colorObj: AnalysisColorObject = {
						channel: color.channel || "",
						pColor: color.pColor,
						opacity: Math.round((+color.opacity || 0) * 100) / 100,
						copiedChannel: +color.copiedChannel,
						copyOpacity:  color.copyOpacity == "1",
						r: +color.r || 0,
						g: +color.g || 0,
						b: +color.b || 0
					};
					if (raw_hsv_value) colorObj.copiedHSV = {
						h: +raw_hsv_value[0],
						s: +raw_hsv_value[1],
						v: +raw_hsv_value[2],
						"s-checked": raw_hsv_value[3] == "1",
						"v-checked": raw_hsv_value[4] == "1"
					}
					if (!colorObj.channel) return colorList = colorList.filter((color, index) => colorIndex != index);

					if (colorStuff.channels[colorObj.channel]) {
						colorObj.channel = colorStuff.channels[colorObj.channel];
					}
					if (+colorObj.channel > 1000) return;
					if (colorStuff.channels[colorObj.copiedChannel || 0]) {
						colorObj.copiedChannel = colorStuff.channels[colorObj.copiedChannel || 0];
					}
					if ((colorObj.copiedChannel || 0) > 1000) delete colorObj.copiedChannel;
					if (colorObj.pColor == "-1") delete colorObj.pColor;
					if (color.blending) colorObj.blending = true;
					// colorObj.opacity = +Number(colorObj.opacity).toFixed(2);
					colorList2.push(colorObj);
				});
				// we assume this is only going to be run once so... some stuff can go here
				colorList2 = colorList2.filter(color => typeof color == "object");
				if (!colorList2.find(color => color.channel == "Obj")) colorList2.push({r: 255, g: 255, b: 255, channel: "Obj", opacity: 1});

				const specialSort = ["BG", "G", "G2", "Line", "Obj", "3DL"]
				let specialColors = colorList2.filter(color =>  isNaN(+color.channel)).sort(function(colorA, colorB) {
					return +(specialSort.indexOf(colorA.channel) > specialSort.indexOf(colorB.channel));
				});
				let regularColors = colorList2.filter(color => !isNaN(+color.channel)).sort(function(colorA, colorB) {
					return (+colorA.channel) - (+colorB.channel)
				});
				response.colors = specialColors.concat(regularColors);
				break;
			}
		}
		response.settings[name] = val;
	});

	if (!response.settings.ground || response.settings.ground > 17) response.settings.ground = 1;
	if (!response.settings.background || response.settings.background > 20) response.settings.background = 1;
	if (!response.settings.font) response.settings.font = 1;

	if (response.settings.alternateLine == 2) response.settings.alternateLine = true;
	else response.settings.alternateLine = false;

	Object.keys(response.settings).filter(k => {
		// this should be parsed into color list instead
		if (k.includes("legacy")) delete response.settings[k];
	});

	delete response.settings["colors"];
	return response;
}
