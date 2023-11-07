import { parseResponse } from "../../lib/parseResponse.js";
import countMessagesController from "./countMessages.js";
import { IMessageObject } from "../../types/messages.js";
import { UserCache } from "../../classes/UserCache.js";
import { ExportBundle } from "../../types/servers.js";
import { Request, Response } from "express";
import { XOR } from "../../lib/xor.js";

/**
 * Get a list of messages.
 * @param req The client request.
 * @param res The server response (to send the level details/error).
 * @param userCacheHandle The user cache passed in by reference.
 * @returns The list of the most recent messages for a given user.
 */
export default async function(req: Request, res: Response, userCacheHandle: UserCache) {
	const { req: reqBundle }: ExportBundle = res.locals.stuff;

	if (req.method !== 'POST') return res.status(405).send("Method not allowed.");

	if (req.body.count) return countMessagesController(req, res, userCacheHandle);
	if (!req.body.accountID) return res.status(400).send("No account ID provided!");
	if (!req.body.password) return res.status(400).send("No password provided!");

	const params = reqBundle.gdParams({
		accountID: req.body.accountID,
		gjp: XOR.encrypt(req.body.password, 37526),
		page: req.body.page || "0",
		getSent: req.query.sent ? "1" : "0"
	});

	try {
		const body = await reqBundle.gdRequest('getGJMessages20', params);
		userCacheHandle.trackSuccess(reqBundle.id);

		const messages = (body || "").split("|").map(msg => parseResponse(msg));
		const messageArray: IMessageObject[] = [];
		messages.forEach(colon_separated_response => {
			let msg: IMessageObject = {
				id: colon_separated_response[1],
				playerID: colon_separated_response[3],
				accountID: colon_separated_response[2],
				author: colon_separated_response[6],
				subject: Buffer.from(colon_separated_response[4], "base64").toString().replace(/^Re: ☆/, "Re: "),
				date: colon_separated_response[7] + reqBundle.timestampSuffix,
				unread: colon_separated_response[8] != "1",
				browserColor: false
			};

			if (msg.subject.endsWith("☆") || msg.subject.startsWith("☆")) {
				if (msg.subject.endsWith("☆")) msg.subject = msg.subject.slice(0, -1);
				else msg.subject = msg.subject.slice(1);
				msg.browserColor = true;
			}

			userCacheHandle.userCache(reqBundle.id, msg.accountID, msg.playerID, msg.author);
			messageArray.push(msg);
		});
		return res.send(messageArray);
	}
	catch (err) {
		return res.status(400).send(`Error fetching messages! Messages get blocked a lot so try again later, or make sure your username and password are entered correctly. Last worked: ${userCacheHandle.timeSince(reqBundle.id)} ago.`);
	}
}
