/**
 * @fileoverview Types and interfaces for Pointercrate's API responses.
 */
// I prefer to call it the "demon list", but it's Pointercrate terminology.

/**
 * Overview of a user on the Demonlist.
 */
export interface IListUser {
	/**
	 * The user ID on the Demonlist.
	 */
	id: number;
	/**
	 * The user's username on the Demonlist.
	 */
	name: string;
	/**
	 * Whether the user is banned from submitting records.
	 */
	banned: boolean;
}

/**
 * Nationality data for users on the Demonlist.
 */
export interface IListNationality {
	/**
	 * The ISO 3166-1 alpha-2 code of the country.
	 * 
	 * @example "AF" // Afghanistan
	 */
	country_code: string;
	/**
	 * The name of the country.
	 * 
	 * @example "Afghanistan"
	 */
	nation: string;
	/**
	 * The name of the subdivision.
	 * 
	 * @example "Badghis" // Subdivision of Afghanistan
	 */
	subdivision?: string | null;
}

/**
 * Leaderboard Entry for Pointercrate
 */
export interface IListLeaderboardEntry {
	/**
	 * The user ID on the Demonlist.
	 */
	id: number;
	/**
	 * The nationality of the Demonlist user.
	 */
	nationality: IListNationality;
	/**
	 * Overview of the user on the level leaderboard.
	 */
	player: IListUser;
	/**
	 * The completion percentage of the user on the level.
	 */
	progress: number;
	/**
	 * The submission status of the completion video.
	 */
	status: string;
	/**
	 * The link to the video on YouTube or Twitch (or even Vimeo)
	 */
	video: string;
}

/**
 * A shortened response from Pointercrate's Demonlist leaderboard entry.
 */
export interface IListEntryOverview {
	/**
	 * The user ID on the Demonlist.
	 * 
	 * @example 53449 // PockeWindfish |><(*)
	 */
	id: number;
	/**
	 * The ID of the level in-game.
	 *
	 * Recent list additions may bug out, hence the possible `null` response.
	 */
	level_id?: number | null;
	/**
	 * The position of the level in the Demonlist.
	 */
	position?: number;
	/**
	 * The name of the level.
	 */
	name: string;
	/**
	 * The completion percentage requirement in order to be added into the leaderboard.
	 */
	requirement: number;
	/**
	 * The video of the verification/showcase.
	 * 
	 * @example "https://youtu.be/z6l74Mkoxm8" // Acu by neigefeu
	 */
	// Look I know Acu is not on the list please don't cancel me out of existence.
	video?: string;
	/**
	 * The thumbnail of the video on display.
	 * 
	 * @example "https://i.ytimg.com/vi/z6l74Mkoxm8/mqdefault.jpg" // Thumbnail for the Acu showcase
	 */
	thumbnail: string;
	/**
	 * The publisher of the level.
	 */
	publisher: IListUser;
	/**
	 * The verifier of the level.
	 */
	verifier: IListUser;
}

/**
 * Auxiliary interface for the Demonlist's level entries.
 */
export interface IListEntry extends IListEntryOverview {
	/**
	 * A list of users involved in building the level.
	 */
	creators: IListUser[];
	/**
	 * A list of best records for players that have passed the requirement.
	 */
	records: IListLeaderboardEntry[];
}