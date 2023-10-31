/**
 * @fileoverview Routing page for levels
 */

import { RL } from "../lib/ratelimits.js";
import { UserCache } from "../classes/UserCache.js";
import analyzeController from "../api/analyze.js";
import levelController from "../api/level.js";
import songController from "../api/song.js";
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

	router.get("/api/song/:song", function(req, res){
		songController(req, res);
	});

	router.get("/:id", function(req, res) {
		levelController(req, res, false, false, userCacheHandle);
	});

	return router;
}