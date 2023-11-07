/**
 * @fileoverview Types and interfaces for one-off data structures that can't be combined into a separate category.
 */

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
	h: number;
	s: number;
	v: number;
	"s-checked"?: boolean | number;
	"v-checked"?: boolean | number;
}

/**
 * The type of the resource file the credits button.
 */
export interface IBrowserCredits {
	credits: {
		header: string;
		name: string;
		ign?: string;
		youtube: [string, string];
		twitter: [string, string];
		github: [string, string];
	}[];
	specialThanks: string[];
}