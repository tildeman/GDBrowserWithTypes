/**
 * @fileoverview Types and interfaces for Pointercrate's API responses.
 */

export interface IListUser {
	id: number;
	name: string;
	banned: boolean;
}

export interface IListNationality {
	country_code: string;
	nation: string;
	subdivision?: string | null;
}

/**
 * Leaderboard Entry for Pointercrate
 */
export interface IListILeaderboardEntry {
	id: number;
	nationality: IListNationality;
	player: IListUser;
	progress: number;
	status: string;
	video: string;
}

/**
 * A shortened response
 */
export interface IListEntryOverview {
	id: number;
	level_id?: number | null;
	position?: number;
	name: string;
	requirement: number;
	video?: string;
	thumbnail: string;
	publisher: IListUser;
	verifier: IListUser;
}

/**
 * Auxiliary interface for Pointercrate's level entries.
 */
export interface IListEntry extends IListEntryOverview {
	creators: IListUser[];
	records: IListILeaderboardEntry[];
}