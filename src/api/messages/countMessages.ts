import { parseResponse } from "../../lib/parse_response.js";
import { UserCache } from "../../classes/UserCache.js";
import { ExportBundle } from "../../types.js";
import { Request, Response } from "express";
import { XOR } from "../../lib/xor.js";

/**
 * Count the number of messages.
 * @param req The client request.
 * @param res The server response (to send the level details/error).
 * @param userCacheHandle The user cache passed in by reference.
 * @returns The number of messages for a given user.
 */
export default async function(req: Request, res: Response, userCacheHandle: UserCache) {
	const { req: reqBundle }: ExportBundle = res.locals.stuff;

	if (req.method !== 'POST') return res.status(405).send("Method not allowed.");

	if (!req.body.accountID) return res.status(400).send("No account ID provided!");
	if (!req.body.password) return res.status(400).send("No password provided!");

	const params = {
		accountID: req.body.accountID,
		targetAccountID: req.body.accountID,
		gjp: XOR.encrypt(req.body.password, 37526),
	};

	try {
		const body = await reqBundle.gdRequest('getGJUserInfo20', params);
		userCacheHandle.trackSuccess(reqBundle.id);
		const count = parseResponse(body || "")[38];
		if (!count) return res.status(400).send("Error fetching unread messages!");
		else res.send(count);
	}
	catch (err) {
		return res.status(400).send(`Error counting messages! Messages get blocked a lot so try again later, or make sure your username and password are entered correctly. Last worked: ${userCacheHandle.timeSince(reqBundle.id)} ago.`);
	}
}