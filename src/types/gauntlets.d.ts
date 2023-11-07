/**
 * @fileoverview Types and interfaces for gauntlets.
 */

/**
 * An entry for a Geometry Dash gauntlet.
 */
export interface IGauntletEntry {
	id: number;
	name: string;
	levels: string[];
}

/**
 * The cache object for gauntlets on any GDPS.
 */
export interface IGauntletCacheItem {
	data: IGauntletEntry[];
	indexed: number;
}