import { ErrorCode, ExportBundle } from "../types/servers.js";
import { Request, Response } from "express";

/**
 * Check if a song is allowed for use.
 * @param req The client request.
 * @param res The server response (to send the level details/error).
 * @returns `1` if the song is valid, `0` otherwise.
 */
export default async function(req: Request, res: Response) {
	const { req: reqBundle, sendError }: ExportBundle = res.locals.stuff;
	if (reqBundle.offline) return sendError(ErrorCode.SERVER_UNAVAILABLE, "The requested server is currently unavailable.");

	const songID = req.params.song;
	try {
		const body = await reqBundle.gdRequest('getGJSongInfo', {songID: songID});
		return res.send(!body.startsWith("-") && body.length > 10);
	}
	catch (err) {
		sendError(ErrorCode.ILLEGAL_REQUEST, "Cannot search the requested song.", 400);
	}
}