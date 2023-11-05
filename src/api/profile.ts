import { parseResponse } from '../lib/parse_response.js';
import { UserCache } from '../classes/UserCache.js';
import { Player } from '../classes/Player.js';
import { Request, Response } from "express";
import { ExportBundle } from "../types.js";
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
		else return sendError();
	}

	let username = getLevels || req.params.id;
	let probablyID = 0;
	if (username.endsWith(".") && reqBundle.isGDPS) {
		username = username.slice(0, -1);
		probablyID = Number(username);
	}
	let accountMode = !req.query.hasOwnProperty("player") && Number(req.params.id);
	let foundID = userCacheHandle.userCache(reqBundle.id, username, "", "");
	let skipRequest = accountMode || (foundID && +foundID[0]) || probablyID;
	let searchResult: Record<number, string>;

	// if you're searching by account id, an intentional error is caused to skip the first request to the gd servers. see i pulled a sneaky on ya. (fuck callbacks man)
	// TODO: Convert GDRequests to promises
	// reqBundle.gdRequest(skipRequest ? "" : 'getGJUsers20', skipRequest ? {} : { str: username, page: 0 }, function (err1, res1, b1) {
	// 	if (foundID) searchResult = foundID[0];
	// 	else if (accountMode || err1 || b1 == '-1' || b1?.startsWith("<") || !b1) {
	// 		searchResult = probablyID ? username : req.params.id;
	// 	}
	// 	else if (!reqBundle.isGDPS) searchResult = parseResponse(b1.split("|")[0])[16];
	// 	else {  // GDPS's return multiple users, GD no longer does this
	// 		let userResults = b1.split("|").map(variable => parseResponse(variable));
	// 		searchResult = userResults.find(variable => variable[1].toLowerCase() == username.toLowerCase() || variable[2] == username) || {};
	// 		if (searchResult) searchResult = searchResult[16];
	// 	}

	// 	if (getLevels) {
	// 		req.params.text = foundID ? foundID[1] : parseResponse(b1 || "")[2];
	// 		return searchController(req, res, userCacheHandle);
	// 	}

	// 	reqBundle.gdRequest('getGJUserInfo20', { targetAccountID: searchResult }, function (err2, res2, body) {
	// 		let account = parseResponse(body || "");
	// 		let dumbGDPSError = reqBundle.isGDPS && (!account[16] || account[1].toLowerCase() == "undefined");

	// 		if (err2 || dumbGDPSError) {
	// 			if (!api) return res.redirect('/search/' + req.params.id);
	// 			else return sendError();
	// 		}

	// 		if (!foundID) userCacheHandle.userCache(reqBundle.id, account[16], account[2], account[1]);

	// 		let userData = new Player(account);

	// 		if (api) return res.send(userData);

	// 		res.render("profile", {
	// 			player: userData
	// 		});
	// 	});
	// });
	searchResult = probablyID ? username : req.params.id;
	if (!skipRequest) {
		try {
			const b1 = await reqBundle.gdRequest('getGJUsers20', { str: username, page: 0 });
			if (foundID) searchResult = foundID[0];
			else if (accountMode || b1 == '-1' || b1.startsWith("<") || !b1) {}
			else if (!reqBundle.isGDPS) searchResult = parseResponse(b1.split("|")[0])[16];
			else {  // GDPS's return multiple users, GD no longer does this
				let userResults = b1.split("|").map(variable => parseResponse(variable));
				searchResult = userResults.find(variable => variable[1].toLowerCase() == username.toLowerCase() || variable[2] == username) || {};
				if (searchResult) searchResult = searchResult[16];
			}

			if (getLevels) {
				req.params.text = foundID ? foundID[1] : parseResponse(b1 || "")[2];
				return searchController(req, res, userCacheHandle);
			}
		}
		catch (err) {} // Malformed server response. Don't do anything.
	}

	try {
		const body = await reqBundle.gdRequest('getGJUserInfo20', { targetAccountID: searchResult })
		const account = parseResponse(body || "");
		const dumbGDPSError = reqBundle.isGDPS && (!account[16] || account[1].toLowerCase() == "undefined");
		
		if (dumbGDPSError) {
			if (!api) return res.redirect('/search/' + req.params.id);
			else throw Error("Unfixable GDPS error");
		}
		
		if (!foundID) userCacheHandle.userCache(reqBundle.id, account[16], account[2], account[1]);
		
		let userData = new Player(account);
		
		if (api) return res.send(userData);
		
		res.render("profile", {
			player: userData
		});
	}
	catch (err) {
		return sendError();
	}
}