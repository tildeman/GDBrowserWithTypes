/**
 * @fileoverview Types and interfaces for leaderboards.
 */

import { Color3B } from "./miscellaneous.js";
import { IPlayerIcon } from "./icons.js";

/**
 * An entry for the accurate leaderboard.
 */
export interface IAccurateLeaderboardEntry {
	/**
	 * The username of the user.
	 */
	username: string;
	/**
	 * The player ID of the user.
	 */
	playerID: string;
	/**
	 * The amount of stars the user has.
	 */
	stars: number;
	/**
	 * The amount of demons the user has.
	 */
	demons: number;
	/**
	 * The current ranking of the user.
	 */
	rank: number;
	/**
	 * The amount of creator points the user has.
	 */
	cp: number;
	/**
	 * The current icon of the user.
	 */
	icon: IPlayerIcon
	/**
	 * The amount of secret coins the user has.
	 */
	coins: number;
	/**
	 * The account ID of the user.
	 */
	accountID: string;
	/**
	 * The amount of user coins the user has.
	 */
	usercoins: number;
	/**
	 * The amount of diamonds the user has.
	 */
	diamonds: number;
}

/**
 * An object for a user in Boomlings, RobTop's discontinued game.
 */
export interface IBoomlingsUser {
	/**
	 * The rank of the Boomlings player.
	 */
	rank: number;
	/**
	 * The username of the Boomlings player.
	 */
	name: string;
	/**
	 * The ID of the Boomlings player.
	 */
	ID: string;
	/**
	 * The level the Boomlings player has (up to 25).
	 */
	level: number;
	/**
	 * The score of the Boomlings player.
	 */
	score: number;
	/**
	 * The Boomling number the Boomlings player has.
	 */
	boomling: number;
	/**
	 * The Boomling level the Boomlings player has.
	 */
	boomlingLevel: number;
	/**
	 * Active powerups of the Boomlings player.
	 */
	powerups: number[];
	/**
	 * Unknown.
	 */
	unknownVisual: number;
	/**
	 * Unknown.
	 */
	unknownScore: number;
	/**
	 * The raw response data.
	 */
	raw: string;
}

/**
 * An entry for the level leaderboard.
 */
export interface ILevelLeaderboardEntry {
	/**
	 * The username of the user.
	 */
	username: string;
	/**
	 * The player ID of the user.
	 */
	playerID: string;
	/**
	 * The completion percentage the user has on a level.
	 */
	percent: number;
	/**
	 * The date of the completion.
	 */
	date: string;
	/**
	 * The rank of the user, from 1 to 200.
	 */
	rank: number;
	/**
	 * The icon of the user
	 */
	icon: IPlayerIcon & {
		/**
		 * The primary color of the icon in RGB format.
		 */
		col1RGB: Color3B;
		/**
		 * The secondary color of the icon in RGB format.
		 */
		col2RGB: Color3B;
	}
	/**
	 * The amount of user coins the user has from the level.
	 */
	coins: number;
	/**
	 * The account ID of the user.
	 */
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
