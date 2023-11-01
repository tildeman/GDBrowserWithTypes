import { UserCache } from "../classes/UserCache.js";
import { Player } from "../classes/Player.js";
import { Request, Response } from "express";
import { ExportBundle } from "../types.js";
import { parseResponse } from "../lib/parse_response.js";

/**
 * Interface for comment parameters.
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
 * Interface for GD comments.
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

/**
 * Fetch comments from a level or user.
 * @param req The client request.
 * @param res The server response (to send the level details/error).
 * @param userCacheHandle The user cache passed in by reference.
 * @returns The requested data in JSON.
 */
export default async function(req: Request, res: Response, userCacheHandle: UserCache) {
	const { req: reqBundle, sendError }: ExportBundle = res.locals.stuff;

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
		const split_colons = split_bars.map(commentInfo => commentInfo.split(':'));
		let comments = split_colons.map(commentInfo => commentInfo.map(commentInfo => parseResponse(commentInfo, "~")));
		if (req.query.type == "profile") comments = comments.filter(commentInfo => commentInfo[0][2]);
		else comments = comments.filter(commentInfo => commentInfo[0] && commentInfo[0][2]);
		if (!comments.length) return res.status(204).send([]);

		let pages = (body || "").split('#')[1].split(":");
		let lastPage = +Math.ceil(+pages[0] / +pages[2]);

		let commentArray: ICommentContent[] = [];

		comments.forEach((commentValue, commentIndex) => {

			var commentInfo = commentValue[0]; //comment info
			var accountInfo = commentValue[1]; //account info

			if (!commentInfo[2]) return;

			let comment: ICommentContent = {
				content: Buffer.from(commentInfo[2], 'base64').toString(),
				ID: commentInfo[6],
				likes: +commentInfo[4],
				date: (commentInfo[9] || "?") + reqBundle.timestampSuffix
			};
			if (comment.content.endsWith("⍟") || comment.content.endsWith("☆")) {
				comment.content = comment.content.slice(0, -1);
				comment.browserColor = true ;
			}

			if (req.query.type != "profile") {
				let commentUser = new Player(accountInfo);
				// TODO: Make a cleaner data transfer
				Object.keys(commentUser).forEach(k => {
					comment[k] = commentUser[k];
				})
				comment.levelID = commentInfo[1] || req.params.id;
				comment.playerID = commentInfo[3] || "0";
				comment.color = (comment.playerID == "16" ? "50,255,255" : commentInfo[12] || "255,255,255");
				if (+commentInfo[10] > 0) comment.percent = +commentInfo[10];
				comment.moderator = +commentInfo[11] || 0;
				userCacheHandle.userCache(reqBundle.id, comment.accountID || "", comment.playerID || "", comment.username || "");
			}

			if (commentIndex == 0 && req.query.type != "commentHistory") {
				comment.results = +pages[0];
				comment.pages = lastPage;
				comment.range = `${+pages[1] + 1} to ${Math.min(+pages[0], +pages[1] + +pages[2])}`;
			}

			commentArray.push(comment);

		})

		return res.send(commentArray);
	});
}