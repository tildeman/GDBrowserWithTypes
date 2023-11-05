import { UserCache } from "../../classes/UserCache.js";
import { ExportBundle } from "../../types.js";
import { Request, Response } from "express";
import { sha1 } from "../../lib/sha.js";
import { XOR } from "../../lib/xor.js";

/**
 * Post a comment on a user's profile.
 * @param req The client request.
 * @param res The server response (to send the level details/error).
 * @param userCacheHandle The user cache passed in by reference.
 * @returns An error message if something goes wrong.
 */
export default async function(req: Request, res: Response, userCacheHandle: UserCache) {
	const { req: reqBundle }: ExportBundle = res.locals.stuff;

	if (req.method !== "POST") return res.status(405).send("Method not allowed.");

	if (!req.body.comment) return res.status(400).send("No comment provided!");
	if (!req.body.username) return res.status(400).send("No username provided!");
	if (!req.body.accountID) return res.status(400).send("No account ID provided!");
	if (!req.body.password) return res.status(400).send("No password provided!");

	if (req.body.comment.includes("\n")) return res.status(400).send("Profile posts cannot contain line breaks!");

	let params = {
		cType: "1",
		comment: Buffer.from(req.body.comment.slice(0, 190) + (req.body.color ? "☆" : "")).toString("base64").replace(/\//g, "_").replace(/\+/g, "-"),
		gjp: XOR.encrypt(req.body.password, 37526),
		accountID: req.body.accountID.toString(),
		userName: req.body.username,
		chk: ""
	};

	let chk = params.userName + params.comment + "1xPT6iUrtws0J";
	chk = sha1(chk);
	chk = XOR.encrypt(chk, 29481);
	params.chk = chk;

	try {
		const body = await reqBundle.gdRequest("uploadGJAccComment20", params);
		if (body.startsWith("temp")) {
			let banStuff = body.split("_");
			return res.status(400).send(`You have been banned from commenting for ${(parseInt(banStuff[1]) / 86400).toFixed(0)} days. Reason: ${banStuff[2] || "None"}`);
		}
		else userCacheHandle.trackSuccess(reqBundle.id);
		res.send(`Comment posted to ${params.userName} with ID ${body}`);
	}
	catch (err) {
		return res.status(400).send(`The Geometry Dash servers rejected your profile post! Try again later, or make sure your username and password are entered correctly. Try again later, or make sure your username and password are entered correctly. Last worked: ${userCacheHandle.timeSince(reqBundle.id)} ago.`);
	}
}