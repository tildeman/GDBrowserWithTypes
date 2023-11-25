import { parseResponse } from '../lib/parseResponse.js';
import { UserCache } from '../classes/UserCache.js';
import { Player } from '../classes/Player.js';
import { Request, Response } from "express";
import { ExportBundle } from "../types/servers.js";
import searchController from "./search.js";

/**
 * Inspect a user's statistics.
 * @param req The client request.
 * @param res The server response (to send the level details/error).
 * @param userCacheHandle The user cache passed in by reference.
 * @param api Whether this is an API request.
 * @param getLevels If true, pack the user info up and "redirect" into the search results tab.
 * @returns If this is an API request, return the raw data in JSON. Else display it in a webpage.
 */
export default async function(req: Request, res: Response, userCacheHandle: UserCache, api?: boolean, getLevels?: string) {
	const { req: reqBundle, sendError }: ExportBundle = res.locals.stuff;

	if (reqBundle.offline) {
		if (!api) return res.redirect('/search/' + req.params.id);
		else return sendError(1, "The requested server is currently unavailable.");
	}

	const rawUsername = getLevels || req.params.id;
	const gdpsForceUsername = rawUsername.endsWith(".") && reqBundle.isGDPS;
	const username = gdpsForceUsername ? rawUsername.slice(0, -1) : rawUsername;
	const probablyID = gdpsForceUsername ? Number(username) : 0;

	const accountMode = !req.query.hasOwnProperty("player") && Number(req.params.id);
	const foundID = userCacheHandle.userCache(reqBundle.id, username);
	const skipRequest = accountMode || (foundID && +foundID[0]) || probablyID;
	let searchResult = probablyID ? username : req.params.id;

	if (foundID) searchResult = foundID[0];
	else if (!skipRequest) {
		try {
			const b1 = await reqBundle.gdRequest('getGJUsers20', { str: username, page: 0 });
			if (accountMode || b1 == '-1' || b1.startsWith("<") || !b1) {}
			else if (!reqBundle.isGDPS) searchResult = parseResponse(b1.split("|")[0])[16];
			else {  // GDPS's return multiple users, GD no longer does this
				const userResults = b1.split("|").map(variable => parseResponse(variable));
				const searchObjResult = userResults.find(variable => variable[1].toLowerCase() == username.toLowerCase() || variable[2] == username) || {};
				if (searchObjResult) searchResult = searchObjResult[16];
			}

			if (getLevels) {
				req.params.text = foundID ? foundID[1] : parseResponse(b1 || "")[2];
				return searchController(req, res, userCacheHandle);
			}
		}
		catch (err) {} // Malformed server response. Don't do anything.
	}

	try {
		const body = await reqBundle.gdRequest('getGJUserInfo20', { targetAccountID: searchResult });
		const account = parseResponse(body || "");
		const dumbGDPSError = reqBundle.isGDPS && (!account[16] || account[1].toLowerCase() == "undefined");
		
		if (dumbGDPSError) {
			if (!api) return res.redirect('/search/' + req.params.id);
			else throw new Error("Unfixable GDPS error");
		}
		
		if (!foundID) userCacheHandle.userCache(reqBundle.id, account[16], account[2], account[1]);
		
		const userData = new Player(account);
		
		if (api) return res.send(userData);
		
		res.render("profile", {
			player: userData
		});
	}
	catch (err) {
		return sendError(1, err.message);
	}
}