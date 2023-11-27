import { ErrorCode, ExportBundle } from "../types/servers.js";
import { IListEntryOverview } from '../types/demonlist.js';
import { parseResponse } from '../lib/parseResponse.js';
import { SearchQueryLevel } from '../classes/Level.js';
import { ISearchFilters } from '../types/searches.js';
import { UserCache } from '../classes/UserCache.js';
import profileController from "./profile.js";
import { Request, Response } from "express";
import request from 'axios';

const demonList: Record<string, {
	list: string[];
	augmentedList: IListEntryOverview[];
	lastUpdated: number;
}> = {};

/**
 * Find a level in Pointercrate's level list using the ID.
 * @param needle The level ID to search.
 * @param haystack The level list (Pointercrate's format) in use.
 * @param start The index to start searching
 * @returns The position of the level in the list, or -1 if not existent.
 */
function idInDemon(needle: number, haystack: IListEntryOverview[], start: number = 0) {
	for (let index = start; index < haystack.length; index++) {
		if (haystack[index].level_id == needle) return index;
	}
	return -1;
}

/**
 * Search for levels from given filters.
 * @param req The client request.
 * @param res The server response (to send the level details/error).
 * @param userCacheHandle The user cache passed in by reference.
 * @returns A list of levels in JSON.
 */
export default async function(req: Request, res: Response, userCacheHandle: UserCache) {
	const { req: reqBundle, sendError }: ExportBundle = res.locals.stuff;

	if (reqBundle.offline) {
		if (req.query.hasOwnProperty("err")) res.status(500).send("err");
		else sendError(ErrorCode.SERVER_UNAVAILABLE, "The requested server is currently unavailable.");
	}

	const demonMode = req.query.hasOwnProperty("demonlist") || req.query.hasOwnProperty("demonList") || req.query.type == "demonlist" || req.query.type == "demonList";
	// TODO: this is quite dependent on the structure of the demonlist.
	const url1 = reqBundle.server.demonList + 'api/v2/demons/listed/?limit=100';
	const url2 = reqBundle.server.demonList + 'api/v2/demons/listed/?limit=100&after=100';
	if (demonMode) {
		if (!reqBundle.server.demonList) return sendError(ErrorCode.ILLEGAL_REQUEST, "Cannot search this server's demon list because it lacks one.", 400);
		const dList = demonList[reqBundle.id];
		if (!dList || !dList.list.length || dList.lastUpdated + 600000 < Date.now()) {  // 10 minute cache
			try {
				const list1: IListEntryOverview[] = (await request.get(url1)).data;
				const list2: IListEntryOverview[] = (await request.get(url2)).data;
				demonList[reqBundle.id] = {
					list: list1.concat(list2).filter((demonListItem) => demonListItem.level_id).map((demonListItem) => (demonListItem.level_id?.toString() || "")),
					augmentedList: list1.concat(list2),
					lastUpdated: Date.now(),
				};
			}
			catch(err) {
				console.error(err.message);
				return sendError(ErrorCode.SERVER_ISSUE, "The server's demon list either is inaccessible or uses nonstandard REST endpoints.");
			}
		}
	}

	const count = reqBundle.isGDPS ? 10 : +(req.query.count || 0);
	const amount = (count && count > 0) ? Math.min(count, 500) : 10;

	const filters: ISearchFilters = {
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
	if (req.query.demonFilter) filters.demonFilter = req.query.demonFilter.toString();
	if (req.query.len) filters.len = req.query.len.toString();
	if (req.query.songID) filters.song = req.query.songID.toString();
	if (req.query.creators) filters.followed = req.query.creators.toString();


	if (req.query.type) {
		const filterCheck = req.query.type.toString().toLowerCase();
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
		const accountCheck = userCacheHandle.userCache(reqBundle.id, filters.str || "");
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
		listSize = filtersStrArr.length;
		filtersStrArr = filtersStrArr.slice((filters.page || 0) * amount, (filters.page || 0) * amount + amount);
		if (!filtersStrArr.length) return res.status(400).send({
			error: ErrorCode.ILLEGAL_REQUEST,
			message: "The requested array of levels is empty."
		});
		filters.str = filtersStrArr.map(levelData => String(Number(levelData) + +(req.query.len || 0))).join();
		filters.page = 0;
	}

	if (reqBundle.isGDPS && filters.diff && !filters.len) filters.len = "-";

	if (filters.str == "*") delete filters.str;
	try {
		const body = await reqBundle.gdRequest('getGJLevels21', reqBundle.gdParams(filters as any));
		const splitBody = body?.split('#') || [];
		const preRes = splitBody[0].split('|');
		const authorList: Record<string, [string ,string]> = {};
		const songList: Record<string, string> = {};
		const authors = splitBody[1].split('|');
		const songString = splitBody[2];
		const songs = songString.split('~:~').map(songResponse => parseResponse(`~${songResponse}~`, '~|~'));
		songs.forEach(songEntry => {
			songList[songEntry['~1']] = songEntry['2'];
		});

		authors.forEach(authorResponse => {
			if (authorResponse.startsWith('~')) throw new Error("Can't look up author data.");
			let arr = authorResponse.split(':');
			authorList[arr[0]] = [arr[1], arr[2]];
		});

		const levelArray = preRes.map(levelResponse => parseResponse(levelResponse)).filter(levelResponse => levelResponse[1]);
		let parsedLevels: SearchQueryLevel[] = [];
		let currentDemonPos = 0;

		levelArray.forEach((levelData, levelIndex) => {
			const songSearch = songs.find(songItem => songItem['~1'] == levelData[35]) || [];

			const level = new SearchQueryLevel(levelData, reqBundle.server, null, {});
			level.getSongInfo(songSearch);
			if (!level.id) throw new Error("The search query included levels without an ID.");
			level.author = authorList[levelData[6]] ? authorList[levelData[6]][0] : "-";
			level.accountID = authorList[levelData[6]] ? authorList[levelData[6]][1] : "0";

			if (demonMode) {
				if (!levelIndex) level.demonList = reqBundle.server.demonList;
				currentDemonPos = idInDemon(+level.id, demonList[reqBundle.id].augmentedList, currentDemonPos + 1);
				level.demonPosition = currentDemonPos + 1;
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
		});

		if (filters.type == 10) parsedLevels = parsedLevels.slice(+(filters.page || 0) * amount, (+(filters.page || 0) + 1) * amount);
		return res.send(parsedLevels);
	}
	catch (err) {
		return sendError(ErrorCode.SERVER_ISSUE, err.message);
	}
}