import { UserCache } from "../../classes/UserCache.js";
import { ExportBundle } from "../../types/servers.js";
import { ILikeParams } from "../../types/comments.js";
import { Request, Response } from "express";
import { sha1 } from "../../lib/sha.js";
import { XOR } from "../../lib/xor.js";

/**
 * Vote on a post.
 * @param req The client request.
 * @param res The server response (to send the level details/error).
 * @param userCacheHandle The user cache passed in by reference.
 * @returns An error message if something goes wrong.
 */
export default async function(req: Request, res: Response, userCacheHandle: UserCache) {
	const {req: reqBundle}: ExportBundle = res.locals.stuff;

	if (req.method !== "POST") return res.status(405).send("Method not allowed.");

	if (!req.body.ID) return res.status(400).send("No ID provided!");
	if (!req.body.accountID) return res.status(400).send("No account ID provided!");
	if (!req.body.password) return res.status(400).send("No password provided!");
	if (!req.body.like) return res.status(400).send("No like flag provided! (1=like, 0=dislike)");
	if (!req.body.type) return res.status(400).send("No type provided! (1=level, 2=comment, 3=profile");
	if (!req.body.extraID) return res.status(400).send("No extra ID provided! (this should be a level ID, account ID, or \"0\" for levels");

	const params: ILikeParams = {
		udid: "0",
		uuid: "0",
		rs: "8f0l0ClAN1",
		itemID: req.body.ID.toString(),
		gjp: XOR.encrypt(req.body.password, 37526),
		accountID: req.body.accountID.toString(),
		like: req.body.like.toString(),
		special: req.body.extraID.toString(),
		type: req.body.type.toString(),
		chk: ""
	};

	const chk = XOR.encrypt(sha1(params.special + params.itemID + params.like + params.type + params.rs + params.accountID + params.udid + params.uuid + "ysg6pUrtjn0J"), 58281);

	params.chk = chk;

	try {
		await reqBundle.gdRequest("likeGJItem211", params);

		userCacheHandle.trackSuccess(reqBundle.id);
		res.send((params.like == "1" ? "Successfully liked!" : "Successfully disliked!") + " (this will only take effect if this is your first time doing so)");
	}
	catch (err) {
		return res.status(400).send(`The Geometry Dash servers rejected your vote! Try again later, or make sure your username and password are entered correctly. Last worked: ${userCacheHandle.timeSince(reqBundle.id)} ago.`);
	}
}