// TODO: Use a more consistent naming pattern

/**
 * Interface for comment parameters.
 */
export interface ICommentParams {
	userID: string;
	accountID?: string;
	levelID?: string;
	page: number;
	count: number;
	mode: string;
}

/**
 * Interface for GD comments.
 */
export interface ICommentContent {
	content: string;
	ID: string;
	likes: number;
	date: string;

	browserColor?: boolean;
	moderator?: number;
	accountID?: string;
	playerID?: string;
	username?: string;
	levelID?: string;
	percent?: number;
	results?: number;
	pages?: number;
	range?: string;
	color?: string;
}