/**
 * @fileoverview Routing page for search results.
 */

import { fetchTemplate } from "../lib/templateHandle.js";
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

	// router.get("/api/lists/:text", RL2, function(req, res) {
	// 	listSearchController(req, res, userCacheHandle);
	// })

	router.get("/listsearch", fetchTemplate("listfilters"));
	// router.get("/search/:text", fetchTemplate("lists"));

	return router;
}