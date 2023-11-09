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

export interface ListResponse{
	id: string;
	name: string;
	desc: string;
	version: number;
	accountID: string;
	username: string;
	downloads: number;
	difficulty: number;
	likes: number;
	featured: number;
	levels: string[];
	uploaded: number;
	updated: number;
}