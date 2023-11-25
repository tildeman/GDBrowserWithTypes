/**
 * @fileoverview Types and interfaces for level analysis.
 */

import { CopiedHSV } from "./miscellaneous.js";

/**
 * A color value from the header of a level.
 */
export interface IAnalysisColorObject {
	/**
	 * The channel ID of the color.
	 */
	channel: string;
	/**
	 * Whether this is the player color (?).
	 */
	pColor?: string;
	/**
	 * The opacity value of the color from `0` to `1`.
	 */
	opacity: number;
	/**
	 * The blending mode of the color.
	 */
	blending?: boolean;
	/**
	 * The copied color channel. Optional.
	 */
	copiedChannel?: number;
	/**
	 * The copied HSV value of the color. Optional.
	 */
	copiedHSV?: CopiedHSV;
	/**
	 * Whether the color is copying an opacity value (?).
	 */
	copyOpacity?: boolean;
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
 * Raw information for a level object.
 */
export interface ILevelObject {
	/**
	 * The object ID of the object.
	 */
	id: string;
	/**
	 * The name of this portal, if it is.
	 */
	portal?: string;
	/**
	 * The name of this coin (?), if it is.
	 */
	coin?: string;
	/**
	 * The name of this jump ring, if it is.
	 */
	orb?: string;
	/**
	 * The name of this trigger, if it is.
	 */
	trigger?: string;
	/**
	 * The text of the text object in base64, if present.
	 */
	message?: string;
	/**
	 * The group IDs the object has.
	 */
	triggerGroups?: string;
	/**
	 * Inverse of whether the object should be present in low-detail mode.
	 */
	highDetail?: number;
	/**
	 * The x-coordinate of the object.
	 */
	x?: number;
	/**
	 * Whether the trigger can be activated under collision with the player.
	 */
	touchTriggered?: boolean;
	/**
	 * Whether the trigger can be activated with another trigger.
	 */
	spawnTriggered?: boolean;
	/**
	 * The opacity value of the alpha trigger.
	 */
	opacity?: number;
	/**
	 * The duration of a trigger effect.
	 */
	duration?: number;
	/**
	 * The target ID of some triggers (move, pulse, alpha, animate, etc.)
	 */
	targetGroupID?: string;
}

/**
 * The configuration at the start of the level.
 */
export interface ILevelSettings {
	/**
	 * The offset of the song in seconds.
	 */
	songOffset: number;
	/**
	 * Whether the song fades in at the start of the level.
	 */
	fadeIn: boolean;
	/**
	 * Whether the song fades out at the end of the level.
	 */
	fadeOut: boolean;
	/**
	 * The background ID of the level. This does not count custom backgrounds.
	 */
	background: number;
	/**
	 * The ground ID of the level. This does not count custom grounds.
	 */
	ground: number;
	/**
	 * Whether to use the second line variant (non-fading)
	 */
	alternateLine: boolean;
	/**
	 * The font ID of the level. This does not count custom fonts
	 */
	font: number;
	/**
	 * The starting gamemode of the level.
	 */
	gamemode: string;
	/**
	 * Whether to start the player as mini.
	 */
	startMini: boolean;
	/**
	 * Whether to start the player in dual mode.
	 */
	startDual: boolean;
	/**
	 * A number followed by `x`, denoting the speed of the player.
	 * `0` is skipped.
	 */
	speed: string;
	/**
	 * Whether the level can be controlled with two different inputs.
	 */
	twoPlayer: boolean;
}

/**
 * The object returned as results of analyses.
 */
export interface IAnalysisResult {
	/**
	 * The overview of the analyzed level.
	 */
	level: {
		/**
		 * Name of the level. (e.g.: isolation my ver)
		 */
		name: string;
		/**
		 * The ID of the level. (e.g.: 91209839)
		 */
		id: string;
		/**
		 * The publisher of the level. (e.g.: newvietnam)
		 */
		author: string;
		/**
		 * The player ID of the publisher.
		 */
		playerID: string;
		/**
		 * The account ID of the publisher, if present.
		 */
		accountID: string;
		/**
		 * If the level has more than 40000 objects.
		 */
		large: boolean;
	};
	/**
	 * The amount of objects in a level.
	 */
	objects: number;
	/**
	 * The amount of objects in a level removed in low-detail mode.
	 */
	highDetail: number;
	/**
	 * A list of portals and their percentages (formatted) in the level.
	 */
	portals: [string | null, string][];
	/**
	 * A list of positions of all the coins in the level.
	 */
	coins: number[];
	/**
	 * If the coins are verified, they will be shown as silver.
	 *
	 * Unverified coins do not count towards a player's coin count.
	 */
	coinsVerified: boolean;
	/**
	 * A record of orbs and their amounts in the level.
	 */
	orbs: Record<string, number>;
	/**
	 * A record of triggers and their amounts in the level.
	 */
	triggers: Record<string, number>;
	/**
	 * A record of trigger groups and their use counts in the level.
	 */
	triggerGroups: Record<string, number>;
	/**
	 * The group that makes all objects invisible.
	 *
	 * The method to check this is not foolproof (at least, not yet).
	 */
	invisibleGroup?: number;
	/**
	 * A list of text object contents, sorted by their x positions.
	 */
	text: string[][];
	/**
	 * The configuration at the start of the level.
	 */
	settings: ILevelSettings;
	/**
	 * A list of colors used in the level by channel ID.
	 */
	colors: IAnalysisColorObject[];
	/**
	 * The length of the raw level data.
	 */
	dataLength: number;
	/**
	 * The raw data of the level.
	 */
	data: string;
	/**
	 * A record of blocks and their amounts in the level.
	 */
	blocks: Record<string, number>; // Can be more specific; see `blocks.json`.
	/**
	 * A record of miscellaneous objects, their type and their amounts in the level.
	 */
	misc: Record<string, [number, string]>;
}

/**
 * The response returned by parsing the level headers, with only the important bits.
 */
export interface IHeaderResponse {
	/**
	 * The configuration at the start of the level.
	 */
	settings: ILevelSettings;
	/**
	 * A list of colors used in the level by channel ID.
	 */
	colors: IAnalysisColorObject[];
}
