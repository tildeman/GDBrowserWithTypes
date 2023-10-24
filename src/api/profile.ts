import fs from 'fs'
import { Player } from '../classes/Player.js'
import { Express, Request, Response } from "express";
import { AppRoutines, ExportBundle } from "../types.js";

export default async function(app: Express, req: Request, res: Response, api, getLevels) {
	const { req: reqBundle, sendError }: ExportBundle = res.locals.stuff;
	const appRoutines: AppRoutines = app.locals.stuff;

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
	let foundID = appRoutines.userCache(reqBundle.id, username, "", "");
	let skipRequest = accountMode || (foundID && +foundID[0]) || probablyID;
	let searchResult: Record<number, string>;

	// if you're searching by account id, an intentional error is caused to skip the first request to the gd servers. see i pulled a sneaky on ya. (fuck callbacks man)
	reqBundle.gdRequest(skipRequest ? "" : 'getGJUsers20', skipRequest ? {} : { str: username, page: 0 }, function (err1, res1, b1) {   
		if (foundID) searchResult = foundID[0];
		else if (accountMode || err1 || b1 == '-1' || b1?.startsWith("<") || !b1) {
			searchResult = probablyID ? username : req.params.id;
		}
		else if (!reqBundle.isGDPS) searchResult = appRoutines.parseResponse(b1.split("|")[0])[16];
		else {  // GDPS's return multiple users, GD no longer does this
			let userResults = b1.split("|").map(variable => appRoutines.parseResponse(variable));
			searchResult = userResults.find(variable => variable[1].toLowerCase() == username.toLowerCase() || variable[2] == username) || {};
			if (searchResult) searchResult = searchResult[16];
		}

		if (getLevels) {
			req.params.text = foundID ? foundID[1] : appRoutines.parseResponse(b1 || "")[2];
			return appRoutines.run.search(app, req, res);
		}
		
		reqBundle.gdRequest('getGJUserInfo20', { targetAccountID: searchResult }, function (err2, res2, body) {
			let account = appRoutines.parseResponse(body || "");
			let dumbGDPSError = reqBundle.isGDPS && (!account[16] || account[1].toLowerCase() == "undefined");
			
			if (err2 || dumbGDPSError) {
				if (!api) return res.redirect('/search/' + req.params.id);
				else return sendError();
			}
			
			if (!foundID) appRoutines.userCache(reqBundle.id, account[16], account[2], account[1]);
			
			let userData = new Player(account);

			if (api) return res.send(userData);

			res.render("profile", {
				player: userData
			});
		});
	});
}