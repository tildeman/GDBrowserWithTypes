import { Express, Request, Response } from "express";
import { AppRoutines, ExportBundle } from "../types.js";
import { Player } from "../classes/Player.js";

/**
 * Interface for comment parameters
 */
interface ICommentParams {
	userID: string;
	accountID?: string;
	levelID?: string;
	page: number;
	count: number;
	mode: string;
}

/**
 * Interface for GD comments
 */
interface ICommentContent {
    content: string;
    ID: string;
    likes: number;
    date: string;
	// All the things that "extend" the Player class
	// TODO: Make a safer data transfer
	browserColor?: boolean;
	levelID?: string;
	playerID?: string;
	accountID?: string;
	color?: string;
	moderator?: number;
	percent?: number;
	results?: number;
	pages?: number;
	range?: string;
	username?: string;
}

export default async function(app: Express, req: Request, res: Response) {
	const {req: reqBundle, sendError}: ExportBundle = res.locals.stuff;
	const appRoutines: AppRoutines = app.locals.stuff;

	if (reqBundle.offline) return sendError();

	let count = +(req.query.count || 10);
	if (count > 1000) count = 1000;

	let params: ICommentParams = {
			userID : req.params.id, 
			accountID : req.params.id, 
			levelID: req.params.id,
			page: +(req.query.page || 0),
			count,
			mode: req.query.hasOwnProperty("top") ? "1" : "0",
	};

	let path = "getGJComments21";
	if (req.query.type == "commentHistory") {
		path = "getGJCommentHistory";
		delete params.levelID;
	}
	else if (req.query.type == "profile") path = "getGJAccountComments20";

	reqBundle.gdRequest(path, reqBundle.gdParams(params as any), function(err, resp, body) { 

		if (err) return sendError();

		const split_bars = body?.split('|') || [];
		const split_colons = split_bars.map(x => x.split(':'));
		let comments = split_colons.map(x => x.map(x => appRoutines.parseResponse(x, "~")));
		if (req.query.type == "profile") comments = comments.filter(x => x[0][2]);
		else comments = comments.filter(x => x[0] && x[0][2]);
		if (!comments.length) return res.status(204).send([]);

		let pages = (body || "").split('#')[1].split(":");
		let lastPage = +Math.ceil(+pages[0] / +pages[2]);

		let commentArray: ICommentContent[] = [];

		comments.forEach((c, i) => {

			var x = c[0]; //comment info
			var y = c[1]; //account info

			if (!x[2]) return;

			let comment: ICommentContent = {
				content: Buffer.from(x[2], 'base64').toString(),
				ID: x[6],
				likes: +x[4],
				date: (x[9] || "?") + reqBundle.timestampSuffix
			};
			if (comment.content.endsWith("⍟") || comment.content.endsWith("☆")) {
				comment.content = comment.content.slice(0, -1);
				comment.browserColor = true ;
			}
			
			if (req.query.type != "profile") {
				// TODO: Remove "as any" binding
				let commentUser = new Player(y as any);
				// TODO: Make a cleaner data transfer
				Object.keys(commentUser).forEach(k => {
					comment[k] = commentUser[k];
				})
				comment.levelID = x[1] || req.params.id;
				comment.playerID = x[3] || "0";
				comment.color = (comment.playerID == "16" ? "50,255,255" : x[12] || "255,255,255");
				if (+x[10] > 0) comment.percent = +x[10];
				comment.moderator = +x[11] || 0;
				appRoutines.userCache(reqBundle.id, comment.accountID || "", comment.playerID, comment.username || "");
			}

			if (i == 0 && req.query.type != "commentHistory") {
				comment.results = +pages[0];
				comment.pages = lastPage;
				comment.range = `${+pages[1] + 1} to ${Math.min(+pages[0], +pages[1] + +pages[2])}`;
			}

			commentArray.push(comment);

		}) 

		return res.send(commentArray);
	});
}