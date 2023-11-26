/**
 * @fileoverview Convert JS objects to URLSearchParams.
 */

import { URLSearchParams } from "node:url";

/**
 * Convert a regular object to URLSearchParams.
 * @param params The request data as an object.
 * @returns The request data as `URLSearchParams`.
 */
export function convertUSP(params: Record<string, string | undefined>) {
	const ret = new URLSearchParams();
	for (const key in params) {
		ret.append(key, params[key]?.toString() || "");
	}
	return ret;
}