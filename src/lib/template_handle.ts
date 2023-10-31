/**
 * @fileoverview Handle GDBrowser's (no longer) specialized templates.
 */
import { Request, Response } from "express";
import { dirname } from "path";
import { fileURLToPath } from "url";

/**
 * The directory name, used by `express.Response.sendFile()`.
 */
export const __dirname = dirname(dirname(fileURLToPath(import.meta.url)));

/**
 * Fetch the requested static file.
 * @param fileName The static file to send.
 * @returns A controller function to be used in Express.
 */
export function fetchStaticFile(fileName: string) {
	const closure = async function(req: Request, res: Response) {
		res.status(200).sendFile(fileName, {
			root: __dirname
		});
	}
	return closure;
}

/**
 * Fetch the requested Pug template file.
 * @param view The Pug template file to render.
 * @returns A controller function to be used in Express.
 */
export function fetchTemplate(view: string) {
	const closure = function(req: Request, res: Response) {
		res.render(view);
	}
	return closure;
}