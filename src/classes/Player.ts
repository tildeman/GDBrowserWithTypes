import colors_raw from '../iconkit/sacredtexts/colors.json' assert { type: "json" };

/**
 * A color in RGB format.
 */
type ColorRGB = { r: number, g: number, b: number };

/**
 * An object of colors.
 */
const colors: Record<string , ColorRGB> = colors_raw;

/**
 * Interface for a player icon
 */
export interface PlayerIcon {
	/**
	 * The gamemode of the default icon.
	 */
	form: string;
	/**
	 * The icon ID (e.g.: Ship `22` yields the ghost ship).
	 */
	icon: number;
	/**
	 * The primary color of the icon.
	 */
	col1: number;
	/**
	 * The secondary color of the icon.
	 */
	col2: number;
	/**
	 * Whether glow is enabled for the icon.
	 *
	 * Note: 2.2 introduces a breaking change where the glow color is independent.
	 */
	glow: boolean;
}

/**
 * Class for a Geometry Dash Player.
 */
export class Player {
	/**
	 * The username of the player.
	 */
	username: string;
	/**
	 * The player ID of the player.
	 */
	playerID: string;
	/**
	 * The account ID of the player, if present.
	 */
	accountID: string;
	/**
	 * Where the player is placed on the global leaderboard.
	 */
	rank: number;
	/**
	 * The number of stars a player has.
	 * Caps at 16777216.
	 */
	stars: number;
	/**
	 * The number of diamonds a player has.
	 * Caps at 65535.
	 */
	diamonds: number;
	/**
	 * The number of secret coins a player has.
	 * Caps at 65535.
	 */
	coins: number;
	/**
	 * The number of user coins a player has.
	 * Caps at 149.
	 */
	userCoins: number;
	/**
	 * The number of demons a player has.
	 * Caps at 65535.
	 */
	demons: number;
	/**
	 * The number of creator points a player has.
	 */
	cp: number;
	/**
	 * The default icon of the player.
	 */
	icon: number | PlayerIcon;
	/**
	 * The primary color of the icon.
	 */
	col1?: number;
	/**
	 * The secondary color of the icon.
	 */
	col2?: number;
	/**
	 * Whether glow is enabled for the icon.
	 *
	 * Note: 2.2 introduces a breaking change where the glow color is independent.
	 */
	glow?: boolean;
	/**
	 * The RGB value of the first color.
	 */
	col1RGB?: ColorRGB;
	/**
	 * The RGB value of the second color.
	 */
	col2RGB?: ColorRGB;
	/**
	 * Whether friend requests are enabled.
	 */
	friendRequests: boolean;
	/**
	 * Controls who can send the message.
	 */
	messages: string;
	/**
	 * Controls who can view the comment history.
	 */
	commentHistory: string;
	/**
	 * Whether the user has moderator/elder moderator status.
	 */
	moderator: number;
	/**
	 * The YouTube ID, vanity name or handle of the user, if present.
	 */
	youtube: string | null;
	/**
	 * The X handle of the user, if present.
	 */
	twitter: string | null;
	/**
	 * The Twitch ID or vanity name of the user, if present.
	 */
	twitch: string | null;
	/**
	 * The ship ID of the player.
	 */
	ship: number;
	/**
	 * The ball ID of the player.
	 */
	ball: number;
	/**
	 * The UFO (bird) ID of the player.
	*/
	ufo: number;
	/**
	 * The wave (dart) ID of the player.
	*/
	wave: number;
	/**
	 * The robot ID of the player.
	*/
	robot: number;
	/**
	 * The spider ID of the player.
	*/
	spider: number;
	/**
	 * The death effect of the player.
	*/
	deathEffect: number;

	/**
	 * @param account The player account object.
	 */
	constructor(account: Record<number, string>) {
		this.username = account[1] || "-";
		this.playerID = account[2];
		this.accountID = account[16];
		this.rank = +account[6] || +account[30];
		this.stars = +account[3];
		this.diamonds = +account[46];
		this.coins = +account[13];
		this.userCoins = +account[17];
		this.demons = +account[4];
		this.cp = +account[8];
		this.icon = +account[21];

		if (!+account[22]) { // partial profile, used for leaderboards and stuff
			this.icon = {
				form: ['icon', 'ship', 'ball', 'ufo', 'wave', 'robot', 'spider'][+account[14]],
				icon: +account[9] || 1,
				col1: +account[10],
				col2: +account[11],
				glow: +account[15] > 1 || account[28] == "1"
			};

			delete this.col1;
			delete this.col2;
			delete this.glow;
			delete this.col1RGB;
			delete this.col2RGB;
		}

		else {
			this.friendRequests = account[19] == "0";
			this.messages = account[18] == "0" ? "all" : account[18] == "1" ? "friends" : "off";
			this.commentHistory = account[50] == "0" ? "all" : account[50] == "1" ? "friends" : "off";
			this.moderator = +account[49];
			this.youtube = account[20] || null;
			this.twitter = account[44] || null;
			this.twitch = account[45] || null;
			this.ship = +account[22];
			this.ball = +account[23];
			this.ufo = +account[24];
			this.wave = +account[25];
			this.robot = +account[26];
			this.spider = +account[43];
			this.col1 = +account[10];
			this.col2 = +account[11];
			this.deathEffect = +account[48] || 1;
			this.glow = +account[15] > 1 || account[28] == "1";
		}

		this.col1RGB = colors[account[10]] || colors["0"];
		this.col2RGB = colors[account[11]] || colors["3"];
	}
}
