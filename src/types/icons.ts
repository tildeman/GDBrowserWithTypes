/**
 * @fileoverview Types and interfaces for the icon kit.
 */

import { PIXI } from "../vendor/index.js";
import { IShopItem } from "./achievements.js";
import { Color3B } from "./miscellaneous.js";

/**
 * For robots and spiders, this determines the position of the icon parts.
 */
export interface IPartForSpecialIcons {
	/**
	 * The part ID for the icon.
	 */
	part: number;
	/**
	 * The position of the part.
	 */
	pos: number[];
	/**
	 * The scale of the part.
	 */
	scale: number[];
	/**
	 * The rotation of the part.
	 */
	rotation: number;
	/**
	 * Whether the part is flipped.
	 */
	flipped: boolean[];
	/**
	 * The z-order of the part
	 */
	z: number;
	/**
	 * The name of the part. Optional.
	 */
	name?: string;
}

/**
 * Object for extra animation data for robots and spiders.
 */
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

export interface IGameSheetPositions {
	/**
	 * The offset x and y values for the icon part.
	 */
	spriteOffset: number[];
	/**
	 * The size of the icon part.
	 */
	spriteSize: number[];
	/**
	 * Whether the icon part is rotated 90 degrees clockwise. Unused.
	 */
	textureRotated?: boolean;
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
	gameSheet: Record<string, IGameSheetPositions>;
	/**
	 * A list of all the new icons.
	 */
	newIcons: string[];
}

/**
 * Configuration for generating icons.
 */
export interface IIconConfiguration {
	/**
	 * The icon's identifier.
	 */
	id: number;
	/**
	 * The form of the icon.
	 */
	form: string;
	/**
	 * The primary color of the icon.
	 */
	col1: number;
	/**
	 * The secondary color of the icon.
	 */
	col2: number;
	/**
	 * The glow color of the icon.
	 */
	colG?: number;
	/**
	 * The (nominally) white color of the icon.
	 */
	colW?: number;
	/**
	 * The UFO dome color of the icon.
	 */
	colU?: number;
	/**
	 * Controls whether glow is enabled.
	 */
	glow: boolean;
	/**
	 * The active PIXI application.
	 */
	app: PIXI.Application;
	/**
	 * If the icon is in 2.2.
	 */
	new?: boolean;
	/**
	 * If the UFO dome should not be displayed.
	 */
	noUFODome?: boolean;
	/**
	 * The speed of the animation (for robots and spiders).
	 */
	animationSpeed?: number;
	/**
	 * The animation identifier (for robots and spiders).
	 */
	animation?: string;
	/**
	 * The form of the animation (for robots and spiders).
	 */
	animationForm?: string;
}

/**
 * Extra data for the icon kit.
 */
export interface IExtraData {
	/**
	 * A permutation to sort icons by their in-game order.
	 */
	colorOrder: number[];
	/**
	 * A list of hard-coded unlocks for the icon.
	 */
	hardcodedUnlocks: {
		/**
		 * The form of the icon (ball, spider, etc.).
		 */
		form: string;
		/**
		 * The ID of the icon, dependent on the icon form.
		 */
		id: number;
		/**
		 * The type of the unlock, if present.
		 */
		type?: string;
		/**
		 * The number of keys required to unlock a chest of a type. Optional.
		 */
		keys?: number;
		/**
		 * The milestone chest that unlocks upon unlocking enough chests. Optional.
		 */
		chests?: number;
		/**
		 * For one-off requirements, the description of the unlock. Optional.
		 */
		unlock?: string;
		/**
		 * The gauntlet name that unlocks the icon upon completion.
		 */
		gauntlet?: string;
	}[];
	/**
	 * A list of credited artists for some icons.
	 */
	iconCredits: {
		/**
		 * The name of the artist.
		 */
		name: string;
		/**
		 * The form of the icon (UFO, wave, etc.).
		 */
		form: string;
		/**
		 * ID of the icon, dependent on the icon form.
		 */
		id: number;
	}[];
	/**
	 * A list of items that can be bought in the in-game shops.
	 */
	shops: IShopItem[];
	/**
	 * A list of icon previews.
	 */
	previewIcons: string[];
	/**
	 * A list of 2.2 icon previews.
	 */
	newPreviewIcons: string[];
}

export interface IIconKitAPIResponse extends IExtraData {
	/**
	 * A list of serialized sample icons to display in the icon kit.
	 */
	sample: string[];
	/**
	 * The GDPS server, if present.
	 */
	server?: string;
	/**
	 * Sets whether the "Copy icon" feature is enabled.
	 */
	noCopy?: boolean;
}

/**
 * Color channels for an icon.
 */
export interface IIconColor {
	/**
	 * Primary color.
	 */
	1: number;
	/**
	 * Secondary color.
	 */
	2: number;
	/**
	 * Glow outline.
	 */
	g: number;
	/**
	 * White highlights.
	 */
	w: number;
	/**
	 * UFO dome color.
	 */
	u: number;
}

/**
 * Extra settings in the icon kit UI.
 */
export interface IExtraSettings {
	/**
	 * Whether the icon is in 2.2.
	 */
	new?: boolean;
	/**
	 * Whether to enable the UFO dome.
	 */
	noDome?: boolean;
	/**
	 * Whether to ignore the glow setting.
	 */
	ignoreGlow?: boolean;
}

/**
 * Interface for a player icon.
 */
export interface IPlayerIcon {
	/**
	 * The gamemode of the default icon.
	 */
	form: string;
	/**
	 * The icon ID 
	 * 
	 * @example 22 // Yields the ghost ship if the current form is a ship.
	 */
	icon: number;
	/**
	 * The primary color of the icon.
	 */
	col1: number;
	/**
	 * The secondary color of the icon.
	 */
	col2: number;
	/**
	 * Whether glow is enabled for the icon.
	 *
	 * Note: 2.2 introduces a breaking change where the glow color is independent.
	 */
	glow: boolean;
}