/**
 * @fileoverview Types and interfaces for user-curated level lists.
 */

/**
 * Parameters for searching user-curated lists.
*/
export interface IListParams {
	/**
	 * The universally unique identifier of the vote. Has a predefined format.
	 */
	uuid: string;
	/**
	 * The unique device identifier of the vote. Can be anything.
	 */
	udid: string;
	/**
	 * The account ID of the player, if present.
	 */
	accountID?: string;
	/**
	 * The salted password of the comment poster.
	 */
	gjp2?: string;
	/**
	 * The type ID of the search.
	 */
	type?: number;
	/**
	 * The text query for the search.
	 */
	str?: string;
	/**
	 * A comma-separated list of difficulty IDs to search for.
	 */
	diff: string;
	/**
	 * Only return levels with a star rating.
	 */
	star?: number;
	/**
	 * The page of the search.
	 */
	page?: number;
}

/**
 * Metadata for an in-game list.
 */
export interface LevelList {
	/**
	 * The identifier (ID) of the list.
	 * 
	 * @example 22 // Fire Demons by RobTop
	 */
	id: string;
	/**
	 * The name of the list.
	 * 
	 * @example "Fire Demons"
	 */
	name: string;
	/**
	 * The description of the list.
	 * 
	 * @example "These demons are HOT!!"
	 */
	desc: string;
	/**
	 * The version (not the game version) of the list.
	 */
	version: number;
	/**
	 * The account ID of the list publisher.
	 * 
	 * @example 71 // Account ID of RobTop
	 */
	accountID: string;
	/**
	 * The username of the list publisher.
	 * 
	 * @example "RobTop"
	 */
	username: string;
	/**
	 * The number of downloads the list has.
	 */
	downloads: number;
	/**
	 * The assigned difficulty of the list.
	 */
	difficulty: number;
	/**
	 * The difficulty "face" rating of the list.
	 */
	difficultyFace: string;
	/**
	 * The number of likes the list has.
	 */
	likes: number;
	/**
	 * Whether the list is featured.
	 */
	featured: number;
	/**
	 * A list of level IDs that the list has.
	 */
	levels: string[];
	/**
	 * The date the list was uploaded.
	 */
	uploaded: number;
	/**
	 * The date the list was last updated.
	 */
	updated: number;
}

export interface SearchQueryLevelList extends LevelList {
	/**
	 * The number of lists in the search result.
	 */
	results?: number;
	/**
	 * The number of pages in the search result.
	 */
	pages?: number;
	/**
	 * The player ID the list publisher.
	 */
	playerID: string;
}