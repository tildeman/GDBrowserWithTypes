/**
 * @fileoverview Routing page for search results.
 */

import boomlingsLeaderboardController from "../api/leaderboards/boomlings.js";
import accurateLeaderboardController from "../api/leaderboards/accurate.js";
import levelboardController from "../api/leaderboards/leaderboardLevel.js";
import leaderboardController from "../api/leaderboards/scores.js";
import { fetchTemplate } from "../lib/template_handle.js";
import { UserCache } from "../classes/UserCache.js";
import { RL2 } from "../lib/ratelimits.js";
import express from "express";

export default function(userCacheHandle: UserCache, secret?: string) {
	const router = express.Router();

	router.post("/accurateLeaderboard", function(req, res) {
		accurateLeaderboardController(req, res, userCacheHandle, true);
	});

	router.get("/boomlings", fetchTemplate("boomlings"));
	router.get("/leaderboard", fetchTemplate("leaderboard"));
	router.get("/leaderboard/:text", fetchTemplate("levelboard"));
	router.get("/demon/:id", fetchTemplate("demon"));

	router.get("/api/leaderboard", function(req, res) {
		if (req.query.hasOwnProperty("accurate")) {
			accurateLeaderboardController(req, res, userCacheHandle);
		}
		else {
			leaderboardController(req, res, userCacheHandle);
		}
		// run[req.query.hasOwnProperty("accurate") ? "accurate" : "scores"](app, req, res);
	});
	router.get("/api/leaderboardLevel/:id", RL2, function(req, res) {
		levelboardController(req, res, userCacheHandle);
	});

	router.get("/api/boomlings", function(req, res) {
		boomlingsLeaderboardController(req, res, secret);
	});

	return router;
}