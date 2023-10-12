import { Express, Request, Response } from "express";
import { AppRoutines, ExportBundle } from "../../types.js";
import { XOR } from "../../lib/xor.js";

export default async function(app: Express, req: Request, res: Response) {
	const {req: reqBundle}: ExportBundle = res.locals.stuff;
	const appRoutines: AppRoutines = app.locals.stuff;

	if (req.method !== 'POST') return res.status(405).send("Method not allowed.");

	if (!req.body.accountID) return res.status(400).send("No account ID provided!");
	if (!req.body.password) return res.status(400).send("No password provided!");

	let params = {
		accountID: req.body.accountID,
		targetAccountID: req.body.accountID,
		gjp: XOR.encrypt(req.body.password, 37526),
	};

	reqBundle.gdRequest('getGJUserInfo20', params, function (err, resp, body) {

		if (err) return res.status(400).send(`Error counting messages! Messages get blocked a lot so try again later, or make sure your username and password are entered correctly. Last worked: ${appRoutines.timeSince(reqBundle.id)} ago.`);
		else appRoutines.trackSuccess(reqBundle.id);
		let count = appRoutines.parseResponse(body || "")[38];
		if (!count) return res.status(400).send("Error fetching unread messages!");
		else res.send(count);
	});
}