import { Express, Request, Response } from "express";
import { ExportBundle } from "../types.js";

export default async (app: Express, req: Request<{ song: string; }>, res: Response<any, Record<string, any>>) => {
    const {req: reqBundle, sendError}: ExportBundle = res.locals.stuff;
    if (reqBundle.offline) return sendError();

    let songID = req.params.song;
    reqBundle.gdRequest('getGJSongInfo', {songID: songID}, function(err: Error, resp: unknown, body: string) {
        if (err) return sendError(400);
        return res.send(!body.startsWith("-") && body.length > 10);
    });
}