/**
 * @fileoverview Routing page for curated level lists (by RobTop or from other users).
 */

import gauntletController from "../api/gauntlets.js";
import { UserCache } from "../classes/UserCache.js";
import mapPackController from "../api/mappacks.js";
import listController from "../api/lists.js";
import express from "express";

export default function(cacheGauntlets: boolean, cacheMapPacks: boolean, userCacheHandle: UserCache) {
	const router = express.Router();

	router.get("/api/gauntlets", function(req, res) {
		gauntletController(req, res, cacheGauntlets);
	});
	router.get("/api/mappacks", function(req, res) {
		mapPackController(req, res, cacheMapPacks);
	});
	router.get("/api/list/:id", function(req, res) {
		listController(req, res, true, userCacheHandle);
	});

	router.get("/gauntlets", function(req, res) {
		gauntletController(req, res, cacheGauntlets, false);
	});
	router.get("/mappacks", function(req, res) {
		mapPackController(req, res, cacheMapPacks, false);
	});
	router.get("/list/:id", function(req, res) {
		listController(req, res, false, userCacheHandle);
	});

	return router;
}