/**
 * @fileoverview Routing page for static assets.
 */

import achievementTypes from '../misc/achievementTypes.json' assert { type: "json" };
import { sacredTexts, extraData as iconKitFiles } from "../iconkit/static_files.js";
import achievements from '../misc/achievements.json' assert { type: "json" };
import credits from "../misc/credits.json" assert { type: "json" };
import music from '../misc/music.json' assert { type: "json" };
import { fetchTemplate } from "../lib/templateHandle.js";
import { UserCache } from "../classes/UserCache.js";
import { ISafeServers } from '../types/servers.js';
import express from "express";

export default function(userCacheHandle: UserCache, safeServers: ISafeServers[]) {
	const router = express.Router();

	router.get("/", fetchTemplate("api"));
	router.get("/credits", function(req, res) {
		res.status(200).send(credits);
	});
	router.get("/achievements", function(req, res) {
		res.status(200).send({ achievements, types: achievementTypes, shopIcons: iconKitFiles.shops, colors: sacredTexts.colors });
	});
	router.get("/music", function(req, res) {
		res.status(200).send(music);
	});
	router.get("/gdps", function(req, res) {
		res.status(200).send(req.query.hasOwnProperty("current") ? safeServers.find(serverItem => res.locals.stuff.req.server.id == serverItem.id) : safeServers);
	});

	// Quite resource-intensive for the server.
	// Uncomment to allow retrieval of the user cache through the API.

	// router.get("/userCache", function(req, res) {
	// 	res.status(200).send(userCacheHandle.accountCache);
	// });

	return router;
}