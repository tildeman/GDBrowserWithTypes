import { Request, Response } from "express";
import { ExportBundle } from "../types.js";

/**
 * Check if a song is allowed for use.
 * @param req The client request.
 * @param res The server response (to send the level details/error).
 * @returns `1` if the song is valid, `0` otherwise.
 */
export default async function(req: Request, res: Response) {
    const { req: reqBundle, sendError }: ExportBundle = res.locals.stuff;
    if (reqBundle.offline) return sendError();

    let songID = req.params.song;
    reqBundle.gdRequest('getGJSongInfo', {songID: songID}, function(err: Error, resp: unknown, body: string) {
        if (err) return sendError(400);
        return res.send(!body.startsWith("-") && body.length > 10);
    });
}