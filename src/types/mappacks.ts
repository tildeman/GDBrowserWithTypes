/**
 * @fileoverview Types and interfaces for map packs.
 */

/**
 * An entry for a Geometry Dash map pack.
 */
export interface IMapPackEntry {
	/**
	 * The map pack's identifier.
	 */
	id: number;
	/**
	 * The name of the map pack.
	 */
	name: string;
	/**
	 * A list of levels in the map pack.
	 */
	levels: string[];
	/**
	 * The number of stars the map pack gives upon completion.
	 */
	stars: number;
	/**
	 * The number of coins the map pack gives upon completion.
	 */
	coins: number;
	/**
	 * The difficulty of the map pack, which may sometimes be misleading.
	 */
	difficulty: string;
	/**
	 * The bar (completion status) color of the map pack.
	 */
	barColor: string;
	/**
	 * The text color fo the map pack. Not used in GDBrowser.
	 */
	textColor: string;
}

/**
 * The cache object for map packs on any GDPS.
 */
export interface IMapPackCacheItem {
	/**
	 * The map pack cache data
	 */
	data: IMapPackEntry[];
	/**
	 * The last time the map packs were indexed.
	 */
	indexed: number;
}