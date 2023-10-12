import { Express, Request, Response } from "express";
import { AppRoutines, ExportBundle } from "../../types.js";
import { XOR } from "../../lib/xor.js";

export default async function(app: Express, req: Request, res: Response) {
	const {req: reqBundle}: ExportBundle = res.locals.stuff;
	const appRoutines: AppRoutines = app.locals.stuff;

	if (req.method !== 'POST') return res.status(405).send("Method not allowed.");

	if (!req.body.accountID) return res.status(400).send("No account ID provided!");
	if (!req.body.password) return res.status(400).send("No password provided!");
	if (!req.body.id) return res.status(400).send("No message ID(s) provided!");

	let params = {
		accountID: req.body.accountID,
		gjp: XOR.encrypt(req.body.password, 37526),
		messages: Array.isArray(req.body.id) ? req.body.id.map(x => x.trim()).join(",") : req.body.id,
	};

	let deleted: number = params.messages.split(",").length;

	reqBundle.gdRequest('deleteGJMessages20', params, function (err, resp, body) {
		if (body != "1") {
			return res.status(400).send(`The Geometry Dash servers refused to delete the message! Try again later, or make sure your username and password are entered correctly. Last worked: ${appRoutines.timeSince(reqBundle.id)} ago.`);
		}
		else res.send(`${deleted == 1 ? "1 message" : `${deleted} messages`} deleted!`);
		appRoutines.trackSuccess(reqBundle.id);
	});
}