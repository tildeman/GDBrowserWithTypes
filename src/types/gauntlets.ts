/**
 * @fileoverview Types and interfaces for gauntlets.
 */

/**
 * An entry for a Geometry Dash gauntlet.
 */
export interface IGauntletEntry {
	/**
	 * The gauntlet's identifier.
	 */
	id: number;
	/**
	 * The name of the gauntlet.
	 */
	name: string;
	/**
	 * A list of levels in the gauntlet.
	 */
	levels: string[];
}

/**
 * The cache object for gauntlets on any GDPS.
 */
export interface IGauntletCacheItem {
	/**
	 * The gauntlet cache data.
	 */
	data: IGauntletEntry[];
	/**
	 * The last time the gauntlets were indexed.
	 */
	indexed: number;
}