import { UserCache } from "../../classes/UserCache.js";
import { ExportBundle } from "../../types.js";
import { Request, Response } from "express";
import { sha1 } from "../../lib/sha.js";
import { XOR } from "../../lib/xor.js";

let rateLimit: Record<string, number> = {};
let cooldown = 15000;  // GD has a secret rate limit and doesn't return -1 when a comment is rejected, so this keeps track

/**
 * Parameters for comment posts
 */
interface ICommentParams {
	percent: number;
	comment: string;
	gjp: string;
	levelID: string;
	accountID: string;
	userName: string;
	chk: string;
}

/**
 * Get the second value of a timestamp using rudimentary algorithms
 * @param time The Unix timestamp to convert
 * @returns A number [0-59] denoting the number of seconds in a minute
 */
function getTime(time: number) {
	let seconds = Math.ceil(time / 1000);
	seconds = seconds % 60;
	return seconds;
}

export default async function(req: Request, res: Response, userCacheHandle: UserCache) {
	const { req: reqBundle }: ExportBundle = res.locals.stuff;

	if (req.method !== 'POST') return res.status(405).send("Method not allowed.");

	if (!req.body.comment) return res.status(400).send("No comment provided!");
	if (!req.body.username) return res.status(400).send("No username provided!");
	if (!req.body.levelID) return res.status(400).send("No level ID provided!");
	if (!req.body.accountID) return res.status(400).send("No account ID provided!");
	if (!req.body.password) return res.status(400).send("No password provided!");

	if (req.body.comment.includes('\n')) return res.status(400).send("Comments cannot contain line breaks!");

	if (rateLimit[req.body.username]) return res.status(400).send(`Please wait ${getTime(rateLimit[req.body.username] + cooldown - Date.now())} seconds before posting another comment!`);
	
	let params: ICommentParams = {
		percent: 0,
		comment: Buffer.from(req.body.comment + (req.body.color ? "☆" : "")).toString('base64').replace(/\//g, '_').replace(/\+/g, "-"),
		gjp: XOR.encrypt(req.body.password, 37526),
		levelID: req.body.levelID.toString(),
		accountID: req.body.accountID.toString(),
		userName: req.body.username,
		chk: ""
	};

	let percent = parseInt(req.body.percent);
	if (percent && percent > 0 && percent <= 100) params.percent = +percent;

	let chk = params.userName + params.comment + params.levelID + params.percent + "0xPT6iUrtws0J";
	chk = sha1(chk);
	chk = XOR.encrypt(chk, 29481);
	params.chk = chk;

	reqBundle.gdRequest('uploadGJComment21', params, function (err, resp, body) {
		// TODO: Determine the last time the like worked
		if (err) return res.status(400).send(`The Geometry Dash servers rejected your comment! Try again later, or make sure your username and password are entered correctly. Last worked: ${userCacheHandle.timeSince(reqBundle.id)} ago.`);
		if (body?.startsWith("temp")) {
			let banStuff = body.split("_");
			return res.status(400).send(`You have been banned from commenting for ${(parseInt(banStuff[1]) / 86400).toFixed(0)} days. Reason: ${banStuff[2] || "None"}`);
		}

		res.send(`Comment posted to level ${params.levelID} with ID ${body}`);
		userCacheHandle.trackSuccess(reqBundle.id);
		rateLimit[req.body.username] = Date.now();
		setTimeout(() => { delete rateLimit[req.body.username]; }, cooldown);
	});
}