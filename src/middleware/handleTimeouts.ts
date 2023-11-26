/**
 * @fileoverview Middleware to handle response timeouts (in order to prevent hanging).
 */

import { ErrorCode } from "../types/servers.js";
import { Request, Response } from "express";

/**
 * If the response times out, report a 504 error.
 * @param err The error, if present.
 * @param req The client request.
 * @param res The server response (to send the level details/error).
 */
export default function (err: Error | undefined, req: Request, res: Response) {
	if (err && err.message == "Response timeout") {
		res.status(504).send({
			error: ErrorCode.SERVER_UNAVAILABLE,
			message: 'Internal server error! (Timed out)'
		});
	}
}