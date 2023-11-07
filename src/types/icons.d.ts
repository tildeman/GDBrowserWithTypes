/**
 * @fileoverview Types and interfaces for the icon kit.
 */

import { PIXI } from "../vendor/index.js";
import { Color3B } from "./miscellaneous.js";

/**
 * For robots and spiders, this determines the position of the icon parts
 */
export interface IPartForSpecialIcons {
	part: number;
	pos: number[];
	scale: number[];
	rotation: number;
	flipped: boolean[];
	z: number;
	name?: string;
}

// Object for extra animation data for robots and spiders
export interface IAnimationObject {
	/**
	 * Information about the animation.
	 */
	info: {
		/**
		 * How long the animation should last.
		 */
		duration: number;
		/**
		 * If the animation ends, should it replay from the beginning?
		 */
		loop?: boolean;
	};
	/**
	 * The frame data for the animation.
	 */
	frames: IPartForSpecialIcons[][];
}

/**
 * Data for all the icons and their properties.
 */
export interface IIconData {
	/**
	 * The (internal) form names of each icon.
	 */
	forms: Record<string, {
		/**
		 * The index of the form.
		 * Either -1 or more than 20.
		 */
		index: number;
		/**
		 * The internal name of the form (dart).
		 */
		form: string;
		/**
		 * The user-visible name of the form (wave).
		 */
		name: string;
		/**
		 * Whether this form contains extra animations.
		 */
		spicy?: boolean;
	}>;
	/**
	 * Animations for "spicy" forms.
	 */
	robotAnimations: {
		/**
		 * Information about each part of the animation.
		 */
		info: Record<string, {
			/**
			 * The name of the part.
			 */
			names: string[];
			/**
			 * A tint value.
			 * Its use is unknown.
			 */
			tints: Record<string, number>;
		}>;
		/**
		 * The actual keyframes that define the animation.
		 */
		animations: Record<string, Record<string, IAnimationObject>>;
	};
	/**
	 * A list of colors in RGB format.
	 */
	colors: Record<string, Color3B>;
	/**
	 * The number of icons for each gamemode.
	 */
	iconCounts?: Record<string, number>;
	/**
	 * The number of 2.2 icons for each gamemode.
	 * The trailer says around 800.
	 */
	newIconCounts: Record<string, number>;
	/**
	 * The position of icon parts in the game sheet.
	 */
	gameSheet: Record<string, {
		/**
		 * The offset x and y values for the icon part.
		 */
		spriteOffset: number[];
		/**
		 * The size of the icon part.
		 */
		spriteSize: number[];
	}>;
	/**
	 * A list of all the new icons.
	 */
	newIcons: string[];
}

export interface IIconConfiguration {
	id: number;
	form: string;
	col1: number;
	col2: number;
	colG?: number;
	colW?: number;
	colU?: number;
	glow: boolean;
	app: PIXI.Application;
	new?: boolean;
	noUFODome?: boolean;
	animationSpeed?: number;
	animation?: string;
	animationForm?: string;
}

export interface IExtraData {
	colorOrder: number[];
	hardcodedUnlocks: {
		form: string;
		id: number;
		type?: string;
		keys?: number;
		chests?: number;
		unlock?: string;
		gauntlet?: string;
	}[];
	iconCredits: {
		name: string;
		form: string;
		id: number;
	}[];
	shops: {
		icon: number;
		type: string;
		price: number;
		shop: number;
	}[];
	previewIcons: string[];
	newPreviewIcons: string[];
}

export interface IIconKitAPIResponse extends IExtraData {
	sample: string[];
	server?: string;
	noCopy?: boolean;
}