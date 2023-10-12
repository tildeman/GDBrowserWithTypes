import { Express, Request, Response } from "express";
import { AppRoutines, ExportBundle } from "../../types.js";
import { sha1 } from "../../lib/sha.js";
import { XOR } from "../../lib/xor.js";

/**
 * Parameters for item likes
 */
interface ILikeParams {
	udid: string;
	uuid: string;
	rs: string;
	itemID: string;
	gjp: string;
	accountID: string;
	like: string;
	special: string;
	type: string;
	chk: string;
}

export default async function(app: Express, req: Request, res: Response) {
	const {req: reqBundle}: ExportBundle = res.locals.stuff;
	const appRoutines: AppRoutines = app.locals.stuff;
	if (req.method !== "POST") return res.status(405).send("Method not allowed.");

	if (!req.body.ID) return res.status(400).send("No ID provided!");
	if (!req.body.accountID) return res.status(400).send("No account ID provided!");
	if (!req.body.password) return res.status(400).send("No password provided!");
	if (!req.body.like) return res.status(400).send("No like flag provided! (1=like, 0=dislike)");
	if (!req.body.type) return res.status(400).send("No type provided! (1=level, 2=comment, 3=profile");
	if (!req.body.extraID) return res.status(400).send("No extra ID provided! (this should be a level ID, account ID, or \"0\" for levels");
	
	let params: ILikeParams = {
		udid: "0",
		uuid: "0",
		rs: "8f0l0ClAN1",
		itemID: req.body.ID.toString(),
		gjp: app.locals.stuff.xor.encrypt(req.body.password, 37526),
		accountID: req.body.accountID.toString(),
		like: req.body.like.toString(),
		special: req.body.extraID.toString(),
		type: req.body.type.toString(),
		chk: ""
	};

	let chk = params.special + params.itemID + params.like + params.type + params.rs + params.accountID + params.udid + params.uuid + "ysg6pUrtjn0J";
	chk = sha1(chk);
	chk = XOR.encrypt(chk, 58281);

	params.chk = chk;

	reqBundle.gdRequest("likeGJItem211", params, function (err, resp, body) {
		// TODO: Determine the last time the like worked
		if (err) return res.status(400).send(`The Geometry Dash servers rejected your vote! Try again later, or make sure your username and password are entered correctly. Last worked: ${appRoutines.timeSince(reqBundle.id)} ago.`);
		else appRoutines.trackSuccess(reqBundle.id);
		res.send((params.like == "1" ? "Successfully liked!" : "Successfully disliked!") + " (this will only take effect if this is your first time doing so)");
	});
}