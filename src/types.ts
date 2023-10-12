/**
 * @fileoverview Common types to be used by GDBrowser's typing system
 */

import { AxiosResponse } from "axios";

/**
 * An object for private servers defined in `servers.json`
 */
export interface ServerInfo {
	/**
	 * The display name of the server
	 */
	name: string;
	/**
	 * The server's website URL (unrelated to the actual endpoint)
	 */
	link: string;
	/**
	 * The creator(s) of the server
	 */
	author: string;
	/**
	 * The URL to open when clicking on the creator's name
	 */
	authorLink: string;
	/**
	 * An ID for the server, also used as the subdomain (e.g. `something` would become `something.gdbrowser.com`)
	 */
	id: string;
	/**
	 * The actual endpoint to ~~spam~~ send requests to
	 * (e.g. `http://boomlings.com/database/` - make sure it ends with a slash!)
	 */
	endpoint: string;
	/**
	 * Displays a warning that downloads are disabled, and greys out some buttons.
	 */
	downloadsDisabled?: boolean;
	/**
	 * A string to append at the end of timestamps. Vanilla GD uses " ago".
	 */
	timestampSuffix?: string;
	/**
	 * The URL of the server's Demon List API, if it has one (e.g. `http://pointercrate.com/`.
	 * Make sure it ends with a slash!
	 */
	demonList?: string;
	/**
	 * An array of menu buttons to "disable" (mappacks, gauntlets, daily, weekly, etc).
	 * They appear greyed out but are still clickable.
	 */
	disabled?: string[];
	/**
	 * "Pins" the server to the top of the GDPS list.
	 * It appears above all unpinned servers and is not placed in alphabetical order.
	 */
	pinned?: boolean;
	/**
	 * Makes a bunch of fancy changes to better fit 1.9 servers.
	 * (removes orbs/diamonds, hides some pointless buttons, etc)
	 */
	onePointNine?: boolean;
	/**
	 * Enables the lost but not forgotten Weekly Leaderboard, for servers that still milk it
	 */
	weeklyLeaderboard?: boolean;
	/**
	 * A list of parameter substitutions, because some servers rename/obfuscate them.
	 */
	substitutions?: { [substitution: string]: string };
	/**
	 * A list of endpoint substitutions, because some servers use renamed or older versions.
	 */
	overrides?: { [override: string]: string };
	/**
	 * Not sure what this is supposed to do. Maybe to indicate that the server is down?
	 */
	offline?: boolean;
	/**
	 * Not sure what this is supposed to do. Probably some additional supplied arguments,
	 */
	extraParams?: { [param: string]: string }
}

/**
 * The typical variables to be used within GDBrowser (a lot)
 */
export interface ExportBundle {
	/**
	 * The locals for the request object
	 */
	req: {
		/**
		 * The server for the request
		 */
		server: ServerInfo;
		/**
		 * Whether the server is offline or not
		 */
		offline?: boolean;
		/**
		 * The endpoint of the (private) server
		 */
		endpoint: string;
		/**
		 * Whether the server is 1.9 or not
		 */
		onePointNine?: boolean;
		/**
		 * A string to append at the end of timestamps (" ago")
		 */
		timestampSuffix: string;
		/**
		 * The unique server ID. Default servers always use the empty ID ("")
		 */
		id: string;
		/**
		 * Whether the server is a private server (not operated by RobTop)
		 */
		isGDPS: boolean;
		/**
		 * Build headers and parameters to be sent to an online server
		 * @param obj An object containing extra configurations
		 * @param substitute Use GDPS substitutions in `settings.js`
		 * @returns An object containing the forms and headers for a request
		 */
		gdParams: (obj?: {
			[configEntry: string]: string | number | undefined;
			}, substitute?: boolean) => {
				form: {
					[configEntry: string]: string | undefined;
				};
				headers: {
					'x-forwarded-for': string;
					'x-real-ip': string;
				} | {};
			};
		/** 
		 * Wrapper for a request to a Geometry Dash server
		 * @param target The request endpoint of the server (`getGJLevels22` for retrieving level data in Geometry Dash 2.2)
		 * @param params Additional parameters to be sent. Optional
		 * @param cb Callback to the request. This is reminiscent of the now deprecated JS module `request`
		 * @returns This function does not return.
		 */
		gdRequest: (target: string, params: Record<string, any> | undefined, cb: (err?: boolean | Error | {
			serverError: boolean;
			response: string;
			}, resp?: AxiosResponse, body?: string) => any) => void;
	}
	sendError: (errorCode?: number) => void;
}

/**
 * A dictionary of servers without risky attributes.
 */
type SafeServers = Omit<ServerInfo, "endpoint" | "substitutions" | "overrides" | "disabled">;

/**
 * App-wide routines & functions
 */
export interface AppRoutines {
	/**
	 * The configuration data
	 */
	config: {
		/**
		 * The port to connect to
		 */
		port: number;
		/**
		 * Extra parameters.
		 * Always send this stuff to the servers
		 */
		params: {
			/**
			 * Almost always `Wmfd2893gb7`.
			 */
			secret: string;
			/**
			 * The Geometry Dash "external" major version (e.g.: 21 for 2.1).
			 */
			gameVersion: string;
			/**
			 * The Geometry Dash "internal" version. Examples:
			 * - 35 for "The latest official patch of 2.11".
			 * - 37 for "2019 release of 2.1 with camera controls".
			 */
			binaryVersion: string;
			/**
			 * Not usually read by the servers, but
			 * it's an identification token to tell apart
			 * GDBrowser users from in-game users.
			 */
			gdbrowser: string;
		};
		/**
		 * Enables rate limiting to avoid api spam,
		 * feel free to disable for private use.
		 */
		rateLimiting: boolean;
		/**
		 * Forwards 'x-real-ip' to the servers. (requested by RobTop)
		 */
		ipForwarding: boolean;
		/**
		 * Caches map packs to speed up loading.
		 * Useful if they're rarely updated.
		 */
		cacheMapPacks: boolean;
		/**
		 * Caches account IDs in order to shave off an extra request to the servers.
		 */
		cacheAccountIDs: boolean;
		/**
		 * Caches player icons to speed up loading.
		 * Changing your icon in-game may take time to update on the site.
		 */
		cachePlayerIcons: boolean;
		/**
		 * Caches gauntlets to speed up loading.
		 * Useful if they're rarely updated.
		 */
		cacheGauntlets?: boolean;
	};
	/**
	 * List of private servers.
	 */
	servers: ServerInfo[];
	/**
	 * List of private servers but with a few risky parameters removed.
	 */
	safeServers: SafeServers[];
	/**
	 * The main endpoint (the one without a custom ID)
	 * `https://www.boomlings.com/database/` unless changed in fork
	 */
	mainEndpoint: string;
	/**
	 * A dictionary of cached account information
	 */
	accountCache: {
		[key: string]: any;
	};
	/**
	 * Track the last time the application returned a success
	 */
	lastSuccess: {
		[key: string]: number;
	};
	/**
	 * Track GDPSes and see if they're functional
	 */
	actuallyWorked: {
		[key: string]: boolean;
	};
	/**
	 * The ID of the Geometry Dash account used by GDBrowser to interact with servers
	 */
	id: string | number;
	/**
	 * The GJP hash of the Geometry Dash account used by GDBrowser to interact with servers
	 */
	gjp: string | number;
	/**
	 * A middleware lookup table 
	 */
	run: { [index: string]: any }
	/**
	 * The Google Sheets API key (used for accurate leaderboards)
	 */
	sheetsKey?: string;
	/**
	 * Cache users
	 * @param id The ID of something (I'm not sure what)
	 * @param accountID The associated account ID of the GD user
	 * @param playerID The player ID of the GD user
	 * @param name The user's name on the GD servers
	 * @returns A string array of cached data
	 */
	userCache: (id: string, accountID: string, playerID: string, name: string) => [string, string, string] | undefined;
	/**
	 * Calculate the time difference from now.
	 * @param id The ID of something (I'm not sure what)
	 * @param time The Unix timestamp
	 * @returns A string-formatted date containing the amount of minutes and seconds passed
	 */
	timeSince: (id: string, time?: number) => string;
	/**
	 * Parse the response returned by GDBrowser's internal API
	 * @param responseBody The body of the API response
	 * @param splitter The delimiter (for RobTop's API requests)
	 * @returns A configuration object
	 */
	parseResponse: (responseBody: string, splitter?: string) => {
		[index: number]: string;
	};
	/**
	 * Check if a server is still working.
	 * @param id The ID of the (private) server
	 * @returns This function does not return.
	 */
	trackSuccess: (id: string) => void;
	/**
	 * Sanitize potentially dangerous code.
	 * @param text The text to replace characters
	 * @returns The sanitized text that is safe to display
	 */
	clean: (text: string | number | undefined) => string;
}