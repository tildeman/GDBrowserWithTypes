/**
 * @fileoverview Routing page for levels.
 */

import { fetchTemplate } from "../lib/template_handle.js";
import { UserCache } from "../classes/UserCache.js";
import analyzeController from "../api/analyze.js";
import levelController from "../api/level.js";
import songController from "../api/song.js";
import { RL } from "../lib/ratelimits.js";
import express from "express";

export default function(userCacheHandle: UserCache) {
	const router = express.Router();

	// This always returns 500. The text content is "44"
	router.post("/analyzeLevel", function(req, res) {
		analyzeController(req, res);
	});

	router.get("/api/level/:id", RL, function(req, res) {
		levelController(req, res, true, false, userCacheHandle);
	});

	router.get("/api/analyze/:id", RL, function(req, res) {
		levelController(req, res, true, true, userCacheHandle);
	});

	router.get("/api/song/:song", function(req, res) {
		songController(req, res);
	});

	router.get("/level/:id", function(req, res) {
		levelController(req, res, false, false, userCacheHandle);
	});

	router.get("/analyze/:id", fetchTemplate("analyze"));

	return router;
}