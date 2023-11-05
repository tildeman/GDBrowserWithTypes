import { parseResponse } from "../../lib/parse_response.js";
import { UserCache } from "../../classes/UserCache.js";
import { ExportBundle } from "../../types.js";
import { Request, Response } from "express";
import { XOR } from "../../lib/xor.js";

/**
 * Fetch the contents of the message.
 * @param req The client request.
 * @param res The server response (to send the level details/error).
 * @param userCacheHandle The user cache passed in by reference.
 * @returns The message along with its contents.
 */
export default async function(req: Request, res: Response, userCacheHandle: UserCache) {
	const { req: reqBundle }: ExportBundle = res.locals.stuff;

	if (req.method !== 'POST') return res.status(405).send("Method not allowed.");

	if (!req.body.accountID) return res.status(400).send("No account ID provided!");
	if (!req.body.password) return res.status(400).send("No password provided!");

	let params = reqBundle.gdParams({
		accountID: req.body.accountID,
		gjp: XOR.encrypt(req.body.password, 37526),
		messageID: req.params.id,
	});

	try {
		const body = await reqBundle.gdRequest('downloadGJMessage20', params);
		userCacheHandle.trackSuccess(reqBundle.id);

		let colon_separated_response = parseResponse(body || "");
		let msg = {
			id: colon_separated_response[1],
			playerID: colon_separated_response[3],
			accountID: colon_separated_response[2],
			author: colon_separated_response[6],
			subject: Buffer.from(colon_separated_response[4], "base64").toString().replace(/^Re: ☆/, "Re: "),
			content: XOR.decrypt(colon_separated_response[5], 14251),
			date: colon_separated_response[7] + reqBundle.timestampSuffix,
			browserColor: false
		};

		if (msg.subject.endsWith("☆") || msg.subject.startsWith("☆")) {
			if (msg.subject.endsWith("☆")) msg.subject = msg.subject.slice(0, -1);
			else msg.subject = msg.subject.slice(1);
			msg.browserColor = true;
		}

		return res.send(msg);
	}
	catch (err) {
		return res.status(400).send(`Error fetching message! Try again later, or make sure your username and password are entered correctly. Last worked: ${userCacheHandle.timeSince(reqBundle.id)} ago.`);
	}
}