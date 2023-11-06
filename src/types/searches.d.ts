
export interface SearchFilters {
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

/**
 * Auxiliary interface for Pointercrate's level entries.
 */
export interface ListDemon {
	name: string;
	position?: number;
	id: number;
	publisher: {
		id: number;
		name: string;
		banned: boolean;
	};
	verifier: {
		id: number;
		name: string;
		banned: boolean;
	};
	level_id?: number;
	video?: string;
}
