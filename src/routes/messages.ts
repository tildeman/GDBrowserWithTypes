/**
 * @fileoverview Routing page for private messaging.
 */

import { fetchTemplate } from "../lib/template_handle.js";
import { UserCache } from "../classes/UserCache.js";
import getMessagesController from "../api/messages/getMessages.js";
import fetchMessageController from "../api/messages/fetchMessage.js";
import deleteMessageController from "../api/messages/deleteMessage.js";
import sendMessageController from "../api/messages/sendMessage.js";
import { RL } from "../lib/ratelimits.js";
import express from "express";

export default function(userCacheHandle: UserCache) {
	const router = express.Router();

	router.post("/messages", RL, function(req, res) {
		getMessagesController(req, res, userCacheHandle);
	});
	router.post("/messages/:id", RL, function(req, res) {
		fetchMessageController(req, res, userCacheHandle);
	});
	router.post("/deleteMessage", RL, function(req, res) {
		deleteMessageController(req, res, userCacheHandle);
	});
	router.post("/sendMessage", RL, function(req, res) {
		sendMessageController(req, res, userCacheHandle);
	});

	router.get("/messages", fetchTemplate("messages"));

	return router;
}