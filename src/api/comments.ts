import { ICommentContent, ICommentParams } from "../types/comments.js";
import { parseResponse } from "../lib/parseResponse.js";
import { ErrorCode, ExportBundle } from "../types/servers.js";
import { UserCache } from "../classes/UserCache.js";
import { Player } from "../classes/Player.js";
import { Request, Response } from "express";

/**
 * Fetch comments from a level or user.
 * @param req The client request.
 * @param res The server response (to send the level details/error).
 * @param userCacheHandle The user cache passed in by reference.
 * @returns The requested data in JSON.
 */
export default async function(req: Request, res: Response, userCacheHandle: UserCache) {
	const { req: reqBundle, sendError }: ExportBundle = res.locals.stuff;

	if (reqBundle.offline) return sendError(ErrorCode.SERVER_UNAVAILABLE, "The requested server is currently unavailable.");

	const count = Math.min(1000, +(req.query.count || 10));

	const params: ICommentParams = {
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

	try {
		const body = await reqBundle.gdRequest(path, reqBundle.gdParams(params as any));

		const split_bars = body?.split('|') || [];
		const split_colons = split_bars.map(commentInfo => commentInfo.split(':'));
		let comments = split_colons.map(commentInfo => commentInfo.map(commentInfo => parseResponse(commentInfo, "~")));
		if (req.query.type == "profile") comments = comments.filter(commentInfo => commentInfo[0][2]);
		else comments = comments.filter(commentInfo => commentInfo[0] && commentInfo[0][2]);
		if (!comments.length) return res.send([]);

		const pages = (body || "").split('#')[1].split(":");
		const lastPage = +Math.ceil(+pages[0] / +pages[2]);

		const commentArray: ICommentContent[] = [];

		comments.forEach((commentValue, commentIndex) => {

			const commentInfo = commentValue[0]; //comment info
			const accountInfo = commentValue[1]; //account info

			if (!commentInfo[2]) return;

			let comment: ICommentContent | (ICommentContent & Player) = {
				content: Buffer.from(commentInfo[2], 'base64').toString(),
				ID: commentInfo[6],
				likes: +commentInfo[4],
				date: (commentInfo[9] || "?") + reqBundle.timestampSuffix
			};
			if (comment.content.endsWith("⍟") || comment.content.endsWith("☆")) {
				comment.content = comment.content.slice(0, -1);
				comment.browserColor = true;
			}

			if (req.query.type != "profile") {
				const commentUser = new Player(accountInfo);
				comment = Object.assign(comment, commentUser);
				// Quite redundant, but required for typechecking
				if (!("username" in comment)) throw new Error("Can't append player data into comment object!");

				comment.levelID = commentInfo[1] || req.params.id;
				comment.playerID = commentInfo[3] || "0";
				// RobTop's comments have a special color
				comment.color = (comment.playerID == "16") ? "50,255,255" : (commentInfo[12] || "255,255,255");
				if (+commentInfo[10] > 0) comment.percent = +commentInfo[10];
				comment.moderator = +commentInfo[11] || 0;
				userCacheHandle.userCache(reqBundle.id, comment.accountID, comment.playerID, comment.username);
			}

			if (commentIndex == 0 && req.query.type != "commentHistory") {
				comment.results = +pages[0];
				comment.pages = lastPage;
				comment.range = `${+pages[1] + 1} to ${Math.min(+pages[0], +pages[1] + +pages[2])}`;
			}

			commentArray.push(comment);
		});

		return res.send(commentArray);
	}
	catch (err) {
		return sendError(ErrorCode.SERVER_ISSUE, err.message);
	}
}