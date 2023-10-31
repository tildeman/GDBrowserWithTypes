/**
 * @fileoverview Routing page for comments, profile posts and voting.
 */

import { UserCache } from "../classes/UserCache.js";
import getCommentsController from "../api/comments.js";
import likeController from "../api/post/like.js";
import postCommentController from "../api/post/postComment.js";
import postProfileCommentController from "../api/post/postProfileComment.js";
import { RL, RL2 } from "../lib/ratelimits.js";
import express from "express";
import { fetchTemplate } from "../lib/template_handle.js";

export default function(userCacheHandle: UserCache) {
	const router = express.Router();

	router.post("/like", RL, function(req, res) {
		likeController(req, res, userCacheHandle);
	});
	router.post("/postComment", RL, function(req, res) {
		postCommentController(req, res, userCacheHandle);
	});
	router.post("/postProfileComment", RL, function(req, res) {
		postProfileCommentController(req, res, userCacheHandle);
	});

	router.get("/api/comments/:id", RL2, function(req, res) {
		getCommentsController(req, res, userCacheHandle);
	});
	router.get("/comments/:id", fetchTemplate("comments"));

	return router;
}