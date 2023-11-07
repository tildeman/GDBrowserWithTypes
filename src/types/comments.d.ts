/**
 * @fileoverview Types and interfaces for comments of every type.
 */

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
 * Interface for level comment parameters.
 */
export interface ILevelCommentParams {
	percent: number;
	comment: string;
	gjp: string;
	levelID: string;
	accountID: string;
	userName: string;
	chk: string;
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
	levelID?: string;
	percent?: number;
	results?: number;
	pages?: number;
	range?: string;
	color?: string;
}

/**
 * Parameters for item likes.
 *
 * I actually hate parameters.
 */
export interface ILikeParams {
	udid: string;
	uuid: string;
	rs: string;
	itemID: string;
	gjp: string;
	accountID: string;
	like: string;
	special: string;
	type: string;
	chk: string;
}