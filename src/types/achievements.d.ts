/**
 * @fileoverview Types and interfaces for achievements.
 */

import { Color3B } from "./miscellaneous.js";

export interface IAchievementItem {
	id: string;
	game: string;
	name: string;
	rewardType: string;
	rewardID: number;
	description: string;
	achievedDescription: string;
	trueID: string;
}

export interface IAchievementAPIResponse {
	achievements: IAchievementItem[];
	types: Record<string, [string, string[]]>;
	colors: Record<number, Color3B>;
}