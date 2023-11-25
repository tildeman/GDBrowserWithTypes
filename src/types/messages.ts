/**
 * @fileoverview Types and interfaces for private messages.
 */

/**
 * An object representing a private message.
 */
export interface IMessageObject{
	/**
	 * The ID of the message.
	 */
	id: string;
	/**
	 * The player ID of the message sender.
	 */
	playerID: string;
	/**
	 * The account ID of the message sender.
	 */
	accountID: string;
	/**
	 * The username of the message sender.
	 */
	author: string;
	/**
	 * The subject (title) of the message.
	 */
	subject: string;
	/**
	 * The content of the message, if present.
	 */
	content?: string;
	/**
	 * The date in which the message was sent.
	 */
	date: string;
	/**
	 * If the message hasn't been read.
	 */
	unread?: boolean;
	/**
	 * If `true`, display a purple color over the message.
	 */
	browserColor: boolean;
}