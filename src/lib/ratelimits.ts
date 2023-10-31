/**
 * @fileoverview Rate limits for GDBrowser.
 */

import rateLimit, { AugmentedRequest } from "express-rate-limit";
import appConfig from '../settings.js';

/**
 * Message to display upon hitting the rate limit.
 */
const rlMessage = "Rate limited ¯\\_(ツ)_/¯<br><br>Please do not spam my servers with a crazy amount of requests. It slows things down on my end and stresses RobTop's servers just as much." +
" If you really want to send a zillion requests for whatever reason, please download the GDBrowser repository locally - or even just send the request directly to the GD servers.<br><br>" +
"This kind of spam usually leads to GDBrowser getting IP banned by RobTop, and every time that happens I have to start making the rate limit even stricter. Please don't be the reason for that.<br><br>";

/**
 * Helper function for creating custom identifiers for GDBrowser.
 * @param req The request alongside additional properties.
 * @returns The "X-REAL-IP" or "X-FORWARDED-FOR" headers that Robtop recommends.
 */
function keyGeneratorHelper(req: AugmentedRequest): string { 
	return req.headers['x-real-ip']?.toString() || req.headers['x-forwarded-for']?.toString() || "";
}

/**
 * Rate limit for level downloads, comments, likes, etc.
 */
export const RL = rateLimit({
	windowMs: appConfig.rateLimiting ? 5 * 60 * 1000 : 0,
	max: appConfig.rateLimiting ? 100 : 0, // max requests per 5 minutes
	message: rlMessage,
	keyGenerator: keyGeneratorHelper,
	skip: function(req) {
		return ((req.url.includes("api/level") && !req.query.hasOwnProperty("download")) ? true : false);
	}
});

/**
 * Rate limit for comments, leaderboards, profiles, search queries, etc.
 */
export const RL2 = rateLimit({
	windowMs: appConfig.rateLimiting ? 2 * 60 * 1000 : 0,
	max: appConfig.rateLimiting ? 200 : 0, // max requests per 1 minute
	message: rlMessage,
	keyGenerator: function(req) {
		return req.headers['x-real-ip']?.toString() || req.headers['x-forwarded-for']?.toString() || "";
	}
});