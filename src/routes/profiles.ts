/**
 * @fileoverview Routing page for profiles.
 */

import { UserCache } from "../classes/UserCache.js";
import profileController from "../api/profile.js";
import { RL2 } from "../lib/ratelimits.js";
import express from "express";

export default function(userCacheHandle: UserCache) {
	const router = express.Router();

	router.get("/api/profile/:id", RL2, function(req, res) {
		profileController(req, res, userCacheHandle, true);
	});

	router.get("/u/:id", function(req, res) {
		profileController(req, res, userCacheHandle);
	});

	return router;
}