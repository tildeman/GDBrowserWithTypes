/**
 * @fileoverview The lonely SHA-1 function
 */
import crypto from "node:crypto";

/**
 * Auxiliary function to hash a string using the SHA-1 algorithm
 * @param data The string to hash
 * @returns The SHA-1 hash of the string
 */
export function sha1(data: string) {
	return crypto.createHash("sha1").update(data, "binary").digest("hex");
}