/**
 * @fileoverview Types and interfaces for searching levels.
 */

/**
 * Level search filters.
 */
export interface ISearchFilters {
	/**
	 * The text query for the search.
	 */
	str?: string;
	/**
	 * A comma-separated list of difficulty IDs to search for.
	 */
	diff?: string;
	/**
	 * If searching for demon levels, what difficulty to search for (1 is easy, 5 is extreme).
	 */
	demonFilter?: string;
	/**
	 * The page of the search.
	 */
	page?: number;
	/**
	 * The ID of the gauntlet to view (will return the corresponding 5 levels).
	 */
	gauntlet?: number;
	/**
	 * Only return levels with a specified length (0-4, 0 is tiny and 4 is XL).
	 */
	len?: string;
	/**
	 * Only return levels that use this official song number
	 * (2-23, unless you want hacked levels with songs from meltdown/subzero/etc. Also, Stereo Madness and Back on Track don't seem to work).
	 *
	 * Add the 'customSong' parameter to read the number as a custom song ID.
	 */
	song?: string;
	/**
	 * The creator's name (for searching followed levels).
	 */
	followed?: string;
	/**
	 * Only search for featured levels.
	 */
	featured?: number;
	/**
	 * Do not include copies or collaborations.
	 */
	originalOnly?: number;
	/**
	 * Return levels that allow two separate inputs.
	 */
	twoPlayer?: number;
	/**
	 * Only return levels with verified coins.
	 */
	coins?: number;
	/**
	 * Only return levels with an epic rating.
	 */
	epic?: number;
	/**
	 * Only return levels with a star rating.
	 */
	star?: number;
	/**
	 * Only return levels without a star rating
	 */
	noStar?: number;
	/**
	 * If set, read the `song` parameter as a custom song ID instead of an official one
	 */
	customSong?: number;
	/**
	 * The type ID of the search.
	 */
	type?: number;
	/**
	 * The amount of levels per page. Usually 10.
	 */
	count?: number;
}

/**
 * List search filters.
 */
export interface IListSearchFilters {
	/**
	 * The text query for the search.
	 */
	str?: string;
	/**
	 * A comma-separated list of difficulty IDs to search for.
	 */
	diff?: string;
	/**
	 * The page of the search.
	 */
	page?: number;
	/**
	 * The creator's name (for searching followed levels).
	 */
	followed?: string;
	/**
	 * Only search for featured levels.
	 */
	featured?: number;
	/**
	 * Only return lists with a star rating.
	 */
	star?: number;
	/**
	 * The type ID of the search.
	 */
	type?: number;
	/**
	 * The amount of lists per page. Usually 10.
	 */
	count?: number;
}

/**
 * Search filters that are saved in GDBrowser's local storage.
 */
export interface IClientSavedFilters {
	/**
	 * An array of difficulty IDs to search for.
	 */
	diff: number[];
	/**
	 * An array of level lengths to search for.
	 */
	len: string[];
	/**
	 * Extra properties (2-player, original, etc.).
	 */
	checked: string[];
	/**
	 * Whether the search applies to demons.
	 */
	demonDiff?: boolean;
	/**
	 * Whether the level is star-rated.
	 */
	starred?: boolean;
	/**
	 * Whether the level uses official songs.
	 */
	defaultSong?: boolean;
	/**
	 * The song ID to look for.
	 */
	song?: number;
}