/**
 * @fileoverview Types and interfaces for one-off data structures that can't be combined into a separate category.
 */

import { ErrorCode } from "./servers.js";

/**
 * A color with 3 values (bytes).
 * 
 * Similar in style to cocos2d-x, the framework behind Geometry Dash.
 */
export type Color3B = {
	/**
	 * The red value.
	 */
	r: number;
	/**
	 * The green value.
	 */
	g: number;
	/**
	 * The blue value.
	 */
	b: number;
}

/**
 * Copied HSV values.
 */
export interface CopiedHSV {
	/**
	 * The hue value.
	 */
	h: number;
	/**
	 * The saturation value.
	 */
	s: number;
	/**
	 * The brightness value.
	 */
	v: number;
	/**
	 * If selected, use offsets instead of magnitudes for saturation.
	 */
	"s-checked"?: boolean | number;
	/**
	 * If selected, use offsets instead of magnitudes for brightness.
	 */
	"v-checked"?: boolean | number;
}

/**
 * The type of the resource file the credits button.
 */
export interface IBrowserCredits {
	/**
	 * The individual credits for people who helped in making GDBrowser.
	 */
	credits: {
		/**
		 * The contribution the contributor has made.
		 */
		header: string;
		/**
		 * The name of the contributor.
		 */
		name: string;
		/**
		 * The in-game name of the contributor.
		 */
		ign?: string;
		/**
		 * The link to the contributor's YouTube profile.
		 */
		youtube: [string, string];
		/**
		 * The link to the contributor's X profile.
		 */
		twitter: [string, string];
		/**
		 * The extra link of the contributor (usually GitHub).
		 */
		github: [string, string];
	}[];
	/**
	 * A list of other minor contributors to the project.
	 *
	 * If the entry has a slash, the first value is the display name,
	 * and the second value is the in-game name.
	 */
	specialThanks: string[];
}

/**
 * Object for GDBrowser's error messages.
 */
export interface ErrorObject {
	/**
	 * The error code. Details are described in `ErrorCode`.
	 */
	error: ErrorCode;
	/**
	 * The human-readable error message.
	 * 
	 * @example "A dog urinated on GDBrowser such that it can no longer work."
	 */
	message: string;
	/**
	 * A human-readable timestamp indicating the last time the request worked.
	 */
	lastWorked?: string;
}