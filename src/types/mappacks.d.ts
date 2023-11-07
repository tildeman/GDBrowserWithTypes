/**
 * @fileoverview Types and interfaces for map packs.
 */

/**
 * An entry for a Geometry Dash map pack.
 */
export interface IMapPackEntry {
	id: number;
	name: string;
	levels: string[];
	stars: number;
	coins: number;
	difficulty: string;
	barColor: string;
	textColor: string;
}

/**
 * The cache object for map packs on any GDPS.
 */
export interface IMapPackCacheItem {
	data: IMapPackEntry[];
	indexed: number;
}