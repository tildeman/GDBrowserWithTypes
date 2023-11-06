/**
 * An entry for a Geometry Dash gauntlet.
 */
export interface GauntletEntry {
	id: number;
	name: string;
	levels: string[];
}

/**
 * The cache object for gauntlets on any GDPS.
 */
export interface GauntletCacheItem {
	data: GauntletEntry[];
	indexed: number;
}