/**
 * @fileoverview Types and interfaces for level analysis.
 */

import { CopiedHSV } from "./miscellaneous.js";

export interface IAnalysisColorObject {
	channel: string;
	pColor?: string;
	opacity: number;
	blending?: boolean;
	copiedChannel?: number;
	copiedHSV?: CopiedHSV;
	copyOpacity?: boolean;
	r: number;
	g: number;
	b: number;
}

/**
 * Raw information for a level object.
 */
export interface ILevelObject {
	id: string;
	portal?: string;
	coin?: string;
	orb?: string;
	trigger?: string;
	message?: string;
	triggerGroups?: string;
	highDetail?: number;
	/**
	 * X-coordinate of the object.
	 */
	x?: number;
	touchTriggered?: boolean;
	spawnTriggered?: boolean;
	opacity?: number;
	duration?: number;
	targetGroupID?: string;
}

/**
 * The configuration at the start of the level.
 */
export interface ILevelSettings {
	songOffset: number;
	fadeIn: boolean;
	fadeOut: boolean;
	background: number;
	ground: number;
	alternateLine: boolean;
	font: number;
	gamemode: string;
	startMini: boolean;
	startDual: boolean;
	speed: string;
	twoPlayer: false;
}

/**
 * The object returned as results of analyses.
 */
export interface IAnalysisResult {
	level: {
		name: string;
		id: string;
		author: string;
		playerID: string;
		accountID: string;
		large: boolean;
	};
	objects: number;
	highDetail: number;
	portals: string;
	coins: number[];
	coinsVerified: boolean;
	orbs: Record<string, number>;
	triggers: Record<string, number>;
	triggerGroups: Record<string, number>;
	invisibleGroup?: number;
	text: string[][];
	settings: ILevelSettings;
	colors: IAnalysisColorObject[];
	dataLength: number;
	data: string;
	blocks: Record<string, number>; // Can be more specific; see `blocks.json`
	misc: Record<string, [number, string]>;
}

/**
 * The response returned by parsing the level headers, with only the important bits.
 */
export interface IRelevantHeaderResponse {
	settings: any; // TODO: Make a better entry for settings
	colors: IAnalysisColorObject[];
}
