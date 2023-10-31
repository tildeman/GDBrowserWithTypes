/**
 * @fileoverview Routing page for curated level lists (by RobTop or from other users).
 */

import { fetchTemplate } from "../lib/template_handle.js";
import gauntletController from "../api/gauntlets.js";
import mapPackController from "../api/mappacks.js";
import express from "express";

export default function(cacheGauntlets: boolean, cacheMapPacks: boolean) {
	const router = express.Router();

	router.get("/api/gauntlets", function(req, res) {
		gauntletController(req, res, cacheGauntlets);
	});
	router.get("/api/mappacks", function(req, res) {
		mapPackController(req, res, cacheMapPacks);
	});

	router.get("/gauntlets", fetchTemplate("gauntlets"));
	router.get("/mappacks", fetchTemplate("mappacks"));

	return router;
}