/**
 * @fileoverview Types and interfaces for leaderboards.
 */

/**
 * An entry for the accurate leaderboard.
 */
export interface IAccurateILeaderboardEntry {
	username: string;
	playerID: string;
	stars: number;
	demons: number;
	rank: number;
	cp: number;
	icon: {
		icon: number;
		col1: number;
		col2: number;
		form: string;
		glow: boolean;
	}
	coins: number;
	accountID: string;
	usercoins: number;
	diamonds: number;
}

/**
 * An object for a user in Boomlings, RobTop's discontinued game.
 */
export interface IBoomlingsUser {
	rank: number;
	name: string;
	ID: string;
	level: number;
	score: number;
	boomling: number;
	boomlingLevel: number;
	powerups: number[];
	unknownVisual: number;
	unknownScore: number;
	raw: string;
}

/**
 * An entry for the in-game leaderboard.
 */
export interface ILeaderboardEntry {
	username: string;
	playerID: string;
	percent: number;
	date: string;
	rank: number;
	icon: {
		icon: number;
		col1: number;
		col2: number;
		form: string;
		glow: boolean;
		col1RGB: { r: number, g: number, b: number };
		col2RGB: { r: number, g: number, b: number };
	}
	coins: number;
	accountID: string;
}

/**
 * Leaderboard parameters.
 */
export interface IScoreParameters {
	/**
	 * The amount of entries in the leaderboard.
	 */
	count: number;
	/**
	 * The type of the leaderboard.
	 */
	type: "top" | "creators" | "week" | "relative";
	/**
	 * The account ID used for the leaderboard.
	 */
	accountID?: string;
}
