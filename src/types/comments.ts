/**
 * @fileoverview Types and interfaces for comments of every type.
 */

/**
 * Interface for comment parameters.
 */
export interface ICommentParams {
	/**
	 * The player ID of the level publisher.
	 */
	userID: string;
	/**
	 * The publisher's account ID of the level, if present.
	 */
	accountID?: string;
	/**
	 * The ID of the level, if present.
	 */
	levelID?: string;
	/**
	 * The current page of the comment.
	 */
	page: number;
	/**
	 * The amount of comments to be displayed.
	 */
	count: number;
	/**
	 * Whether to show the most liked or the latest comments.
	 */
	mode: string;
}

/**
 * Interface for posting profile comments.
 */
export interface IProfileCommentParams {
	/**
	 * The type of the comment. Always `1` for profile posts.
	 */
	cType: string;
	/**
	 * The content of the comment.
	 */
	comment: string;
	/**
	 * The salted password of the comment poster.
	 */
	gjp: string;
	/**
	 * The account ID of the comment poster.
	 */
	accountID: string;
	/**
	 * The username of the comment poster.
	 */
	userName: string;
	/**
	 * The CHK value of the comment.
	 * Possibly a security feature.
	 */
	chk: string;
}

/**
 * Interface for posting level comments.
 */
export interface ILevelCommentParams {
	/**
	 * The completion percentage of the user when publishing the comment.
	 */
	percent: number;
	/**
	 * The content of the comment.
	 */
	comment: string;
	/**
	 * The salted password of the comment poster.
	 */
	gjp: string;
	/**
	 * The level ID where the comment is to be posted.
	 */
	levelID: string;
	/**
	 * The account ID of the comment poster.
	 */
	accountID: string;
	/**
	 * The username of the comment poster.
	 */
	userName: string;
	/**
	 * The CHK value of the comment.
	 * Possibly a security feature.
	 */
	chk: string;
}

/**
 * Interface for GD comments.
 */
export interface ICommentContent {
	/**
	 * The content of the comment.
	 */
	content: string;
	/**
	 * The identifier of the comment.
	 */
	ID: string;
	/**
	 * The number of likes the comment has.
	 */
	likes: number;
	/**
	 * The date in which the comment was posted.
	 */
	date: string;

	/**
	 * If `true`, display a purple color over the comment.
	 */
	browserColor?: boolean;
	/**
	 * The level ID where the comment is posted, if present.
	 */
	levelID?: string;
	/**
	 * The completion percentage of the user when publishing the comment, if present.
	 */
	percent?: number;
	/**
	 * The total number of comments of the level, if present.
	 */
	results?: number;
	/**
	 * The number of pages in total for the comment section, if present.
	 */
	pages?: number;
	/**
	 * The range of pages in a human-readable format.
	 */
	range?: string;
	/**
	 * The color of the comment (white for normal users, cyan for Robtop, etc.).
	 */
	color?: string;
}

/**
 * Parameters for item likes.
 *
 * I actually hate parameters.
 */
export interface ILikeParams {
	/**
	 * The unique device identifier of the vote. Can be anything.
	 */
	udid: string;
	/**
	 * The universally unique identifier of the vote. Has a predefined format.
	 */
	uuid: string;
	/**
	 * The random string of the vote. Can be anything alphanumeric.
	 */
	rs: string;
	/**
	 * The identifier of the comment/level/post.
	 */
	itemID: string;
	/**
	 * The salted password.
	 */
	gjp: string;
	/**
	 * The account ID of the vote caster.
	 */
	accountID: string;
	/**
	 * Whether to like or dislike the item. `1` to like and `0` to dislike.
	 */
	like: string;
	/**
	 * The extra ID of the vote. Usually the level ID for levels.
	 */
	special: string;
	/**
	 * The type of the item. `1` for levels, `2` for comments and `3` for profile posts.
	 */
	type: string;
	/**
	 * The CHK value of the comment.
	 * Possibly a security feature.
	 */
	chk: string;
}