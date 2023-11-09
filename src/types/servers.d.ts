/**
 * @fileoverview Types and interfaces for server handling in GDBrowser.
 */

/**
 * An object for private servers defined in `servers.json`.
 */
export interface IServerInfo {
	/**
	 * The display name of the server.
	 */
	name: string;
	/**
	 * The server's website URL (unrelated to the actual endpoint).
	 */
	link: string;
	/**
	 * The creator(s) of the server.
	 */
	author: string;
	/**
	 * The URL to open when clicking on the creator's name.
	 */
	authorLink: string;
	/**
	 * An ID for the server, also used as the subdomain
	 * (e.g. `something` would become `something.gdbrowser.com`).
	 */
	id: string;
	/**
	 * The actual endpoint to ~~spam~~ send requests to
	 * (e.g. `http://boomlings.com/database/` - make sure it ends with a slash!).
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
	 * The URL of the server's Demon List API, if it has one
	 * (e.g. `http://pointercrate.com/`. Make sure it ends with a slash!).
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
	 * Enables the lost but not forgotten Weekly Leaderboard, for servers that still milk it.
	 */
	weeklyLeaderboard?: boolean;
	/**
	 * A list of parameter substitutions, because some servers rename/obfuscate them.
	 */
	substitutions?: Record<string, string>;
	/**
	 * A list of endpoint substitutions, because some servers use renamed or older versions.
	 */
	overrides?: Record<string, string>;
	/**
	 * Assume that the server is offline and replace the homepage with a Congregation jumpscare.
	 */
	offline?: boolean;
	/**
	 * Not sure what this is supposed to do. Probably some additional supplied arguments.
	 */
	extraParams?: Record<string, string>
}

/**
 * The typical variables to be used within GDBrowser (a lot).
 */
export interface ExportBundle {
	/**
	 * The locals for the request object.
	 */
	req: {
		/**
		 * The server for the request.
		 */
		server: IServerInfo;
		/**
		 * Whether the server is offline or not.
		 */
		offline?: boolean;
		/**
		 * The endpoint of the (private) server.
		 */
		endpoint: string;
		/**
		 * Whether the server is 1.9 or not.
		 */
		onePointNine: boolean;
		/**
		 * A string to append at the end of timestamps (" ago").
		 */
		timestampSuffix: string;
		/**
		 * The unique server ID. Default servers always use the empty ID ("").
		 */
		id: string;
		/**
		 * Whether the server is a private server (not operated by RobTop).
		 */
		isGDPS: boolean;
		/**
		 * Build headers and parameters to be sent to an online server.
		 * @param obj An object containing extra configurations.
		 * @param substitute Use GDPS substitutions in `settings.js`.
		 * @returns An object containing the forms and headers for a request.
		 */
		gdParams: (obj?: Record<string, string | number | undefined>, substitute?: boolean) => {
			form: Record<string, string | number | undefined>;
			headers: {
				'x-forwarded-for': string;
				'x-real-ip': string;
			} | {};
		};
		/**
		 * Wrapper for a request to a Geometry Dash server.
		 * @param target The request endpoint of the server (`getGJLevels22` for retrieving level data in Geometry Dash 2.2).
		 * @param params Additional parameters to be sent. Optional.
		 * @returns This function does not return.
		 */
		gdRequest: (target: string, params?: Record<string, any>) => Promise<string>;
	}
	// TODO: Elaborate on the error response.

	// Usually when it comes to error handling that may or may or may not be
	// untestable during development, it might become more useful if it is
	// possible to respond with a more elaborate error message. I'm thinking
	// like an "error" object that contains the error code and relevant
	// messages and all that stuff. This will be sent into `sendError` and
	// get processed as returned. This significantly improves clarity.
	/**
	 * Terminate the execution of the current controller and respond with `-1`.
	 * @param [errorCode=500] The error code to send. Defaults to 500.
	 */
	sendError: (errorCode?: number) => void;
}

/**
 * A dictionary of servers without risky attributes.
 */
export type ISafeServers = Omit<IServerInfo, "endpoint" | "substitutions" | "overrides" | "disabled">;