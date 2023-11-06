/**
 * An entry for a Geometry Dash map pack.
 */
export interface MapPackEntry {
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
export interface MapPackCacheItem {
	data: MapPackEntry[];
	indexed: number;
}