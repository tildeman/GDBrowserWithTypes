import { Color3B } from "./miscellaneous.js";

export interface AchievementItem {
	id: string;
	game: string;
	name: string;
	rewardType: string;
	rewardID: number;
	description: string;
	achievedDescription: string;
	trueID: string;
}

export interface AchievementAPIResponse {
	achievements: AchievementItem[];
	types: Record<string, [string, string[]]>;
	colors: Record<number, Color3B>;
}