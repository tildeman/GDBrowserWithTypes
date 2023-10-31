import { UserCache } from "../../classes/UserCache.js";
import { ExportBundle } from "../../types.js";
import { Request, Response } from "express";
import { XOR } from "../../lib/xor.js";

/**
 * Send a user's message.
 * @param req The client request.
 * @param res The server response (to send the level details/error).
 * @param userCacheHandle The user cache passed in by reference.
 * @returns An error message if something goes wrong.
 */
export default async function(req: Request, res: Response, userCacheHandle: UserCache) {
	const { req: reqBundle }: ExportBundle = res.locals.stuff;

	if (req.method !== 'POST') return res.status(405).send("Method not allowed.");

	if (!req.body.targetID) return res.status(400).send("No target ID provided!");
	if (!req.body.message) return res.status(400).send("No message provided!");
	if (!req.body.accountID) return res.status(400).send("No account ID provided!");
	if (!req.body.password) return res.status(400).send("No password provided!");

	let subject = Buffer.from(req.body.subject ? (req.body.color ? "☆" : "") + (req.body.subject.slice(0, 50)) : (req.body.color ? "☆" : "") + "No subject").toString('base64').replace(/\//g, '_').replace(/\+/g, "-");
	let body = XOR.encrypt(req.body.message.slice(0, 300), 14251);

	let params = reqBundle.gdParams({
		accountID: req.body.accountID,
		gjp: XOR.encrypt(req.body.password, 37526),
		toAccountID: req.body.targetID,
		subject, body,
	});

	reqBundle.gdRequest('uploadGJMessage20', params, function (err, resp, body) {
		if (body != "1") {
			return res.status(400).send(`The Geometry Dash servers refused to send the message! Try again later, or make sure your username and password are entered correctly. Last worked: ${userCacheHandle.timeSince(reqBundle.id)} ago.`);
		}
		else res.send('Message sent!');
		userCacheHandle.trackSuccess(reqBundle.id);
	});
}