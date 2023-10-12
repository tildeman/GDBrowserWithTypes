/**
 * @fileoverview Handle GDBrowser's specialized templates
 */
import { Request, Response } from "express";
import { dirname } from "path";
import { fileURLToPath } from "url";

/**
 * The directory name, used by `express.Response.sendFile()`
 */
const __dirname = dirname(dirname(fileURLToPath(import.meta.url)));

/**
 * Fetch the requested template file
 * @param fileName The template file to render
 * @returns a controller function to be used in Express
 */
export function fetchTemplate(fileName: string) {
    const closure = async function(req: Request, res: Response) {
        res.status(200).sendFile(fileName, {
            root: __dirname
        });
    }
    return closure;
}