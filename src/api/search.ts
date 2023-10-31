import { parseResponse } from '../lib/parse_response.js';
import { SearchQueryLevel } from '../classes/Level.js';
import { UserCache } from '../classes/UserCache.js';
import profileController from "./profile.js";
import { Request, Response } from "express";
import { ExportBundle } from "../types.js";
import request from 'axios';

let demonList = {};

interface SearchFilters {
    str?: string;
    diff?: string;
    demonFilter?: string;
    page?: number;
    gauntlet?: number;
    len?: string;
    song?: string;
    followed?: string;
    featured?: number;
    originalOnly?: number;
    twoPlayer?: number;
    coins?: number;
	epic?: number;
	star?: number;
	noStar?: number;
	customSong?: number;
	type?: number;
    count?: number;
}

// SARY NEVER CLEAR

/**
 * Auxiliary interface for Pointercrate's level entries.
 */
interface ListDemon {
	name: string;
	position?: number;
	id: number;
	publisher: {
		id: number;
		name: string;
		banned: boolean;
	};
	verifier: {
		id: number;
		name: string;
		banned: boolean;
	};
	level_id?: number;
	video?: string;
}

/**
 * Find a level in Pointercrate's level list using the ID.
 * @param needle The level ID to search.
 * @param haystack The level list (Pointercrate's format) in use.
 * @returns The position of the level in the list, or -1 if not existent.
 */
// TODO: Since both the regular and augmented arrays are regular, optimize this to O(n) complexity
function idInDemon(needle: number, haystack: ListDemon[]) {
	let index = 0;
	for (const value of haystack) {
		if (value.level_id == needle) return index;
		index++;
	}
	return -1;
}

export default async function(req: Request, res: Response, userCacheHandle: UserCache) {
	const { req: reqBundle, sendError }: ExportBundle = res.locals.stuff;

	if (reqBundle.offline) return res.status(500).send(req.query.hasOwnProperty("err") ? "err" : "-1");

	let demonMode = req.query.hasOwnProperty("demonlist") || req.query.hasOwnProperty("demonList") || req.query.type == "demonlist" || req.query.type == "demonList";
	// TODO: this is quite dependent on the structure of the demonlist.
	let url1 = reqBundle.server.demonList + 'api/v2/demons/listed/?limit=100';
	let url2 = reqBundle.server.demonList + 'api/v2/demons/listed/?limit=100&after=100';
	if (demonMode) {
		if (!reqBundle.server.demonList) return sendError(400);
		let dList = demonList[reqBundle.id];
		if (!dList || !dList.list.length || dList.lastUpdated + 600000 < Date.now()) {  // 10 minute cache
			try {
				const list1: ListDemon[] = (await request.get(url1)).data;
				const list2: ListDemon[] = (await request.get(url2)).data;
				demonList[reqBundle.id] = {
					list: list1.concat(list2).filter((demonListItem) => demonListItem.level_id).map((demonListItem) => (demonListItem.level_id?.toString() || "")),
					augmentedList: list1.concat(list2),
					lastUpdated: Date.now(),
				};
			}
			catch(err: any) {
				console.warn(err.message);
				return sendError();
			}
		}
	}

	let amount = 10;
	let count = reqBundle.isGDPS ? 10 : +(req.query.count || 0);
	if (count && count > 0) {
		if (count > 500) amount = 500;
		else amount = count;
	}
	
	let filters: SearchFilters = {
		str: req.params.text,

		page: +(req.query.page || 0),
		gauntlet: +(req.query.gauntlet || 0),

		featured: req.query.hasOwnProperty("featured") ? 1 : 0,
		originalOnly: req.query.hasOwnProperty("original") ? 1 : 0,
		twoPlayer: req.query.hasOwnProperty("twoPlayer") ? 1 : 0,
		coins: req.query.hasOwnProperty("coins") ? 1 : 0,
		epic: req.query.hasOwnProperty("epic") ? 1 : 0,
		star: req.query.hasOwnProperty("starred") ? 1 : 0,
		noStar: req.query.hasOwnProperty("noStar") ? 1 : 0,
		customSong: req.query.hasOwnProperty("customSong") ? 1 : 0,

		type: +(req.query.type || 0),
		count: amount,
	}
	if (req.query.diff) filters.diff = req.query.diff.toString();
	if (req.query.demonFilter) filters.diff = req.query.demonFilter.toString();
	if (req.query.len) filters.diff = req.query.len.toString();
	if (req.query.song) filters.diff = req.query.song.toString();
	if (req.query.followed) filters.diff = req.query.followed.toString();


	if (req.query.type) {
		let filterCheck = req.query.type.toString().toLowerCase();
		switch(filterCheck) {
			case 'mostdownloaded': filters.type = 1; break;
			case 'mostliked': filters.type = 2; break;
			case 'trending': filters.type = 3; break;
			case 'recent': filters.type = 4; break;
			case 'featured': filters.type = 6; break;
			case 'magic': filters.type = 7; break;
			case 'awarded':
			case 'starred': filters.type = 11; break;
			case 'halloffame':
			case 'hof': filters.type = 16; break;
			case 'gdw':
			case 'gdworld': filters.type = 17; break;
		}
	}

	if (req.query.hasOwnProperty("user")) {
		let accountCheck = userCacheHandle.userCache(reqBundle.id, filters.str || "", "", "");
		filters.type = 5;
		if (accountCheck) filters.str = accountCheck[1];
		else if (!filters.str?.match(/^[0-9]*$/)) {
			return profileController(req, res, userCacheHandle, false, req.params.text);
		}
	} 

	if (req.query.hasOwnProperty("creators")) filters.type = 12;

	let listSize = 10;
	if (demonMode || req.query.gauntlet || req.query.type == "saved" || ["mappack", "list", "saved"].some(levelData => req.query.hasOwnProperty(levelData))) {
		filters.type = 10;
		// never handle filters.str dynamically
		let filtersStrArr: string[] = demonMode ? demonList[reqBundle.id].list : filters.str!.split(",");
		listSize = filtersStrArr!.length;
		filtersStrArr = filtersStrArr!.slice((filters.page || 0) * amount, (filters.page || 0) * amount + amount);
		if (!filtersStrArr.length) return sendError(400);
		// TODO: Make a "map" for strings
		filters.str = filtersStrArr.map(levelData => String(Number(levelData) + +(req.query.len || 0))).join()
		filters.page = 0
	}

	if (reqBundle.isGDPS && filters.diff && !filters.len) filters.len = "-";

	if (filters.str == "*") delete filters.str;
	reqBundle.gdRequest('getGJLevels21', reqBundle.gdParams(filters as any), function(err, resp, body) {
		if (err) return sendError();
		let splitBody = body?.split('#') || [];
		let preRes = splitBody[0].split('|');
		let authorList = {};
		let songList = {};
		let authors = splitBody[1].split('|');
		let songString = splitBody[2];
		let songs = songString.split('~:~').map(songResponse => parseResponse(`~${songResponse}~`, '~|~'));
		songs.forEach(songEntry => {
			songList[songEntry['~1']] = songEntry['2'];
		});

		authors.forEach(authorResponse => {
			if (authorResponse.startsWith('~')) sendError();
			let arr = authorResponse.split(':');
			authorList[arr[0]] = [arr[1], arr[2]];
		});

		let levelArray = preRes.map(levelResponse => parseResponse(levelResponse)).filter(levelResponse => levelResponse[1]);
		let parsedLevels: SearchQueryLevel[] = [];

		levelArray.forEach((levelData, levelIndex) => {

			let songSearch = songs.find(songItem => songItem['~1'] == levelData[35]) || [];

			let level = new SearchQueryLevel(levelData, reqBundle.server, null, {}).getSongInfo(songSearch);
			if (!level.id) sendError();
			level.author = authorList[levelData[6]] ? authorList[levelData[6]][0] : "-";
			level.accountID = authorList[levelData[6]] ? authorList[levelData[6]][1] : "0";

			if (demonMode) {
				if (!levelIndex) level.demonList = reqBundle.server.demonList;
				level.demonPosition = idInDemon(+level.id, demonList[reqBundle.id].augmentedList) + 1;
			}

			if (reqBundle.isGDPS) level.gdps = (reqBundle.onePointNine ? "1.9/" : "") + reqBundle.server.id;
			if (level.author != "-") userCacheHandle.userCache(reqBundle.id, level.accountID.toString(), level.playerID.toString(), level.author);

			//this is broken if you're not on page 0, blame robtop
			if (filters.page == 0 && levelIndex == 0 && splitBody[3]) {
				let pages = splitBody[3].split(":");

				if (filters.gauntlet) {  // gauntlet page stuff
					level.results = levelArray.length;
					level.pages = 1;
				}
				else if (filters.type == 10) {  //  custom page stuff
					level.results = listSize;
					level.pages = +Math.ceil(listSize / (amount || 10));
				}
				else {  // normal page stuff
					level.results = +pages[0];
					level.pages = +pages[0] == 9999 ? 1000 : +Math.ceil(+pages[0] / amount);
				}
			}

			parsedLevels[levelIndex] = level;
		})

		if (filters.type == 10) parsedLevels = parsedLevels.slice(+(filters.page || 0) * amount, (+(filters.page || 0) + 1) * amount);
		return res.send(parsedLevels);
	});
}