/**
 * @fileoverview Convert JS objects to URLSearchParams
 */

import { URLSearchParams } from "url";

/**
 * Convert a regular object to URLSearchParams
 * @param params The request data as an object
 * @returns The request data as `URLSearchParams`
 */
export function convertUSP(params: { [configEntry: string]: string | undefined }) {
	const ret = new URLSearchParams();
	for (const key in params) {
		ret.append(key, params[key] || "");
	}
	return ret;
}