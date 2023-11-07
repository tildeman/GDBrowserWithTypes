/**
 * @fileoverview Types and interfaces for searching levels.
 */

export interface ISearchFilters {
	str?: string;
	diff?: string;
	demonFilter?: string;
	page?: number;
	gauntlet?: number;
	len?: string;
	song?: string;
	followed?: string;
	featured?: number;
	originalOnly?: number;
	twoPlayer?: number;
	coins?: number;
	epic?: number;
	star?: number;
	noStar?: number;
	customSong?: number;
	type?: number;
	count?: number;
}