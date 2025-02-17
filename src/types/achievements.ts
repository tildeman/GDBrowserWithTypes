/**
 * @fileoverview Types and interfaces for achievements.
 */

import { Color3B } from "./miscellaneous.js";

export enum Shops {
	RegularShop,
	SecretShop,
	CommunityShop
}

/**
 * An item that can be bought in the in-game shops.
 */
export interface IShopItem {
	/**
	 * The ID of the item, dependent on the item type.
	 */
	icon: number;
	/**
	 * The type of the item (colors, waves, swings, etc.).
	 */
	type: string;
	/**
	 * The price of the item in mana orbs.
	 */
	price: number;
	/**
	 * The shop ID. `0` means the regular shop in the icon kit.
	 */
	shop: Shops;
}

/**
 * An achievement object containing all the necessary information.
 */
export interface IAchievementItem {
	/**
	 * The internal ID of the achievement.
	 */
	id: string;
	/**
	 * The spinoff ID of the Geometry Dash release of the achievement.
	 * 
	 * @example "gd" // The (Full) Geometry Dash release.
	 * @example "subzero" // Geometry Dash SubZero.
	 */
	game: "gd" | "meltdown" | "world" | "subzero";
	/**
	 * The display name of the achievement.
	 */
	name: string;
	/**
	 * The reward type of the achievement (color, ship, robot, etc.).
	 */
	rewardType: string;
	/**
	 * The ID of the reward of the achievement, dependent on the reward type.
	 */
	rewardID: number;
	/**
	 * The description of the achievement before completion.
	 */
	description: string;
	/**
	 * The description of the achievement after completion.
	 */
	achievedDescription: string;
	/**
	 * The full ID of the achievement, containing the spinoff ID (if present).
	 */
	trueID: string;
}

/**
 * The response returned from `/api/achievements`.
 */
export interface IAchievementAPIResponse {
	/**
	 * A list of all the known achievement objects.
	 */
	achievements: IAchievementItem[];
	/**
	 * A mapping of types containing their IDs, display names and actions.
	 */
	types: Record<string, [string, string[]]>;
	/**
	 * A list of items that can be bought in the in-game shops.
	 */
	shopIcons: IShopItem[];
	/**
	 * A mapping of color IDs and their RGB values.
	 */
	colors: Record<number, Color3B>;
}

/**
 * Template parameters for the achievements query result.
 */
export interface ISearchResultEntryTemplateParams {
	/**
	 * Whether the achievement unlocks a form (gamemode) icon.
	 */
	inForms: boolean;
	/**
	 * Whether the achievement unlocks a color.
	 */
	isColor: boolean;
	/**
	 * The name of the achievement.
	 */
	title?: string;
	/**
	 * The path to the icon of the achievement.
	 */
	iconPath: string;
	/**
	 * The color the achievement unlocks, if present.
	 */
	col?: Color3B;
	/**
	 * The "game" color of the achievement.
	 */
	achGameColor: string;
	/**
	 * The achievement object.
	 */
	achItem: IAchievementItem;
	/**
	 * Whether the title indicates that the achievement has been completed.
	 */
	completed: boolean;
	/**
	 * The color for the achievement upon completion.
	 */
	completedColor: string;
	/**
	 * The description of the achievement upon completion.
	 */
	completedDescription: string;
}