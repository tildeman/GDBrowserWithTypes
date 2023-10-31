import { ServerInfo } from "../types";

/**
 * Cache player data the GDBrowser way.
 */
export class UserCache{
	/**
	 * A dictionary of cached account information for each Geometry Dash private server.
	 */
	public readonly accountCache: Record<string, Record<string, [string, string, string]>>;
	/**
	 * Track the last time the application returned a success.
	 */
	public readonly lastSuccess: Record<string, number>;
	/**
	 * Track GDPSes and see if they're functional.
	 */
	public readonly actuallyWorked: Record<string, boolean>;
	/**
	 * If `false`, never cache user data.
	 */
	public readonly cacheAccountIDs: boolean;

	/**
	 * @param cacheAccountIDs For convenience. Determines whether to actually do the caching.
	 */
	constructor(cacheAccountIDs: boolean, servers: ServerInfo[]) {
		this.accountCache = {};
		this.lastSuccess = {};
		this.actuallyWorked = {};
		this.cacheAccountIDs = cacheAccountIDs || true;
		servers.forEach(x => {
			this.accountCache[x.id || "gd"] = {};
			this.lastSuccess[x.id || "gd"] = Date.now();
		});
	}

	/**
	 * Check if a server is still working.
	 * @param id The ID of the (private) server.
	 * @returns This function does not return.
	 */
	trackSuccess(id: string) {
		this.lastSuccess[id] = Date.now();
		if (!this.actuallyWorked[id]) this.actuallyWorked[id] = true;
	}

	/**
	 * Calculate the time difference from now.
	 * @param id The ID of something (I'm not sure what).
	 * @param time The Unix timestamp.
	 * @returns A string-formatted date containing the amount of minutes and seconds passed.
	 */
	timeSince(id: string, time?: number) {
		if (!time) time = this.lastSuccess[id];
		let secsPassed = Math.floor((Date.now() - time) / 1000);
		let minsPassed = Math.floor(secsPassed / 60);
		secsPassed -= 60 * minsPassed;
		return `${this.actuallyWorked[id] ? "" : "~"}${minsPassed}m ${secsPassed}s`;
	}

	/**
	 * Cache users.
	 * @param id The ID of something (I'm not sure what).
	 * @param accountID The associated account ID of the GD user.
	 * @param playerID The player ID of the GD user.
	 * @param name The user's name on the GD servers.
	 * @returns A string array of cached data.
	 */
	userCache(id: string, accountID: string, playerID: string, name: string): [string, string, string] | void {
		// Never cache RobTop.
		if (!accountID || accountID == "0" || (name && name.toLowerCase() == "robtop" && accountID != "71") || !this.cacheAccountIDs) return;
		if (!playerID) return this.accountCache[id][accountID.toLowerCase()];
		let cacheStuff: [string, string, string] = [accountID, playerID, name];
		this.accountCache[id][name.toLowerCase()] = cacheStuff;
		return cacheStuff;
	}
}

