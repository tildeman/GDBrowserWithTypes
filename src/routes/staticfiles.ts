/**
 * @fileoverview Routing page for static assets.
 */

import achievementTypes from '../misc/achievementTypes.json' assert { type: "json" };
import { sacredTexts, extraData as iconKitFiles } from "../iconkit/static_files.js";
import achievements from '../misc/achievements.json' assert { type: "json" };
import credits from "../misc/credits.json" assert { type: "json" };
import music from '../misc/music.json' assert { type: "json" };
import { fetchTemplate } from "../lib/template_handle.js";
import { UserCache } from "../classes/UserCache.js";
import { SafeServers } from '../types.js';
import express from "express";

export default function(userCacheHandle: UserCache, safeServers: SafeServers[]) {
	const router = express.Router();

	router.get("/", fetchTemplate("api"));
	router.get("/credits", function(req, res) {
		res.status(200).send(credits);
	});
	router.get("/userCache", function(req, res) {
		res.status(200).send(userCacheHandle.accountCache);
	});
	router.get("/achievements", function(req, res) {
		res.status(200).send({ achievements, types: achievementTypes, shopIcons: iconKitFiles.shops, colors: sacredTexts.colors });
	});
	router.get("/music", function(req, res) {
		res.status(200).send(music);
	});
	router.get("/gdps", function(req, res) {
		res.status(200).send(req.query.hasOwnProperty("current") ? safeServers.find(x => res.locals.stuff.req.server.id == x.id) : safeServers);
	});

	return router;
}