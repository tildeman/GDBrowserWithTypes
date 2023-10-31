/**
 * @fileoverview Routing page for search results.
 */

import { fetchTemplate } from "../lib/template_handle.js";
import { UserCache } from "../classes/UserCache.js";
import searchController from "../api/search.js";
import { RL2 } from "../lib/ratelimits.js";
import express from "express";

export default function(userCacheHandle: UserCache) {
	const router = express.Router();

	router.get("/api/search/:text", RL2, function(req, res) {
		searchController(req, res, userCacheHandle);
	});

	router.get("/search", fetchTemplate("filters"));
	router.get("/search/:text", fetchTemplate("search"));

	return router;
}