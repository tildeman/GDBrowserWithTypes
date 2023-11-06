import { XOR } from "../lib/xor.js";
import music from "../misc/music.json" assert { type: "json" };
import { ServerInfo } from "../types.js";

/**
 * The amount of orbs given to the player by the star rating.
 */
const orbs = [0, 0, 50, 75, 125, 175, 225, 275, 350, 425, 500];
/**
 * The length value of the level.
 */
const length = ['Tiny', 'Short', 'Medium', 'Long', 'XL'];
/**
 * The difficulty "face rating" of the level.
 */
const difficulty = { 0: 'Unrated', 10: 'Easy', 20: 'Normal', 30: 'Hard', 40: 'Harder', 50: 'Insane' };
/**
 * The sub-ratings for demons.
 */
const demonTypes = { 3: "Easy", 4: "Medium", 5: "Insane", 6: "Extreme" };

// Placeholder array

export interface LevelObject {
	/**
	 * Name of the level. (e.g.: isolation my ver)
	 */
	name: string;
	/**
	 * ID of the level. (e.g.: 91209839)
	 */
	id: string;
	/**
	 * The level's description, decoded from base64.
	 */
	description: string;
	/**
	 * The publisher of the level. (e.g.: newvietnam)
	 */
	author: string;
	/**
	 * The player ID of the publisher.
	 */
	playerID: string;
	/**
	 * The account ID of the publisher, if present.
	 */
	accountID: string;
	/**
	 * The difficulty of the level.
	 */
	difficulty: string;
	/**
	 * The amount of downloads the level has.
	 */
	downloads: number;
	/**
	 * The amount of likes the level has.
	 */
	likes: number;
	/**
	 * Whether the level is disliked. (?)
	 */
	disliked: boolean;
	/**
	 * The length of the level in English.
	 */
	length: string;
	/**
	 * The amount of stars awarded to the player upon completion.
	 */
	stars: number;
	/**
	 * The amount of orbs available for the level.
	 */
	orbs: number;
	/**
	 * The amount of diamonds available for the level (for Daily/Weekly levels, gauntlets, lists, paths, etc.).
	 */
	diamonds: number;
	/**
	 * `true` if the level is on the Featured tab, `false otherwise`.
	 */
	featured: boolean;
	/**
	 * `true` if the level is on the Hall of Fame tab, `false otherwise`.
	 */
	epic: boolean;
	/**
	 * The update where the game is published.
	 */
	gameVersion: string;
	/**
	 * The first time the level is uploaded.
	 */
	uploaded?: string;
	/**
	 * The last time the level is updated.
	 */
	updated?: string;
	/**
	 * The amount of time spent in the editor for the level.
	 */
	editorTime?: number;
	/**
	 * The amount of time spent in the editor for the level
	 * (including copies).
	 */
	totalEditorTime?: number;
	/**
	 * The password to copy the level, if present.
	 */
	password?: string;
	/**
	 * The amount of times the level has been updated.
	 */
	version: number;
	/**
	 * The ID of the original level, if the level is a copy or a collaboration.
	 */
	copiedID: string;
	/**
	 * If the level uses two independent inputs.
	 */
	twoPlayer: boolean;
	/**
	 * The song of an official level.
	 */
	officialSong?: number;
	/**
	 * The song ID on https://newgrounds.com/.
	 */
	customSong?: number;
	/**
	 * The number of coins in a level.
	 */
	coins: number;
	/**
	 * Whether the coins are verified or not.
	 */
	verifiedCoins: boolean;
	/**
	 * The amount of stars requested
	 * (usually 10 for recent tab challenges).
	 */
	starsRequested: number;
	/**
	 * If the level has a low-detail mode.
	 */
	ldm: boolean;
	/**
	 * If the level is a weekly.
	 */
	weekly?: boolean;
	/**
	 * The daily number of the level.
	 */
	dailyNumber?: number;
	/**
	 * The next daily level (if present).
	 */
	nextDaily: number | null;
	/**
	 * The next daily level's release (if present).
	 */
	nextDailyTimestamp: number | null;
	/**
	 * The amount of objects in a level.
	 * Capped to 65536 for online levels.
	 */
	objects: number;
	/**
	 * If the level has more than 40000 objects.
	 */
	large: boolean;
	/**
	 * The amount of creator points the level gives to its publisher.
	 */
	cp: number;
	/**
	 * The difficulty "face" rating.
	 */
	difficultyFace: string;
	/**
	 * The song name used by the level.
	 */
	songName: string;
	/**
	 * The publisher of the song.
	 */
	songAuthor: string;
	/**
	 * The amount of disk space that the song takes up.
	 */
	songSize: string;
	/**
	 * The song ID on https://newgrounds.com/.
	 */
	songID: string;
	/**
	 * The song's download link. Can be somewhere other than https://audio.ngfiles.com/.
	 */
	songLink: string;
}

/**
 * Class for a Geometry Dash level.
 */
export class Level implements LevelObject {
	// Glob of whatever
	name: string; id: string; description: string; author: string;
	playerID: string; accountID: string; difficulty: string;
	downloads: number; likes: number; disliked: boolean;
	length: string; stars: number; orbs: number; diamonds: number;
	featured: boolean; epic: boolean; gameVersion: string;
	uploaded?: string; updated?: string; editorTime?: number;
	totalEditorTime?: number; password?: string; version: number;
	copiedID: string; twoPlayer: boolean; officialSong?: number;
	customSong?: number; coins: number; verifiedCoins: boolean;
	starsRequested: number; ldm: boolean; weekly?: boolean;
	dailyNumber?: number; nextDaily: number | null;
	nextDailyTimestamp: number | null; objects: number;
	large: boolean; cp: number; difficultyFace: string;
	songName: string; songAuthor: string; songSize: string;
	songID: string; songLink: string;

	/**
	 * @param levelInfo The level information, parsed from RobTop's colon-based data format.
	 * @param server The server object. Used for custom timestamp suffixes.
	 * @param download Not sure what it's used for.
	 * @param author The author information, parsed from RobTop's colon-based data format.
	 */
	constructor(levelInfo: Record<number, string>, server: ServerInfo, download: boolean | null, author: Record<number, string>) {
		this.name = levelInfo[2] || "-";
		this.id = levelInfo[1] || "0";
		this.description = Buffer.from((levelInfo[3] || ""), "base64").toString() || "(No description provided)";
		this.author = author[1] || "-";
		this.playerID = levelInfo[6] || "0";
		this.accountID = author[2] || "0";
		this.difficulty = difficulty[levelInfo[9]] || "Unrated";
		this.downloads = +levelInfo[10] || 0;
		this.likes = +levelInfo[14] || 0;
		this.disliked = +levelInfo[14] < 0;
		this.length = length[levelInfo[15]] || "XL";
		this.stars = +levelInfo[18] || 0;
		this.orbs = orbs[levelInfo[18]] || 0;
		this.diamonds = !levelInfo[18] || (+levelInfo[18]) < 2 ? 0 : +levelInfo[18] + 2;
		this.featured = +levelInfo[19] > 0;
		this.epic = +levelInfo[42] > 0;
		this.gameVersion = +levelInfo[13] > 17 ? (+levelInfo[13] / 10).toFixed(1) : +levelInfo[13] == 11 ? "1.8" : +levelInfo[13] == 10 ? "1.7" : "Pre-1.7";
		if (levelInfo[28]) this.uploaded = levelInfo[28] + (server.timestampSuffix || "");
		if (levelInfo[29]) this.updated = levelInfo[29] + (server.timestampSuffix || "");
		if (levelInfo[46]) this.editorTime = +levelInfo[46] || 0;
		if (levelInfo[47]) this.totalEditorTime = +levelInfo[47] || 0;
		if (levelInfo[27]) this.password = levelInfo[27];
		this.version = +levelInfo[5] || 0;
		this.copiedID = levelInfo[30] || "0";
		this.twoPlayer = +levelInfo[31] > 0;
		this.officialSong = +levelInfo[35] ? 0 : parseInt(levelInfo[12]) + 1;
		this.customSong = +levelInfo[35] || 0;
		this.coins = +levelInfo[37] || 0;
		this.verifiedCoins = +levelInfo[38] > 0;
		this.starsRequested = +levelInfo[39] || 0;
		this.ldm = +levelInfo[40] > 0;
		if (+levelInfo[41] > 100000) this.weekly = true;
		if (+levelInfo[41]) {
			this.dailyNumber = +levelInfo[41] > 100000 ? +levelInfo[41] - 100000 : +levelInfo[41];
			this.nextDaily = null;
			this.nextDailyTimestamp = null;
		};
		this.objects = +levelInfo[45] || 0;
		this.large = +levelInfo[45] > 40000;
		this.cp = Number(Number(this.stars > 0) + Number(this.featured) + Number(this.epic));

		if (+levelInfo[17] > 0) this.difficulty = (demonTypes[levelInfo[43]] || "Hard") + " Demon";
		if (+levelInfo[25] > 0) this.difficulty = 'Auto';
		this.difficultyFace = `${levelInfo[17] != "1" ? this.difficulty.toLowerCase() : `demon-${this.difficulty.toLowerCase().split(' ')[0]}`}${this.epic ? '-epic' : `${this.featured ? '-featured' : ''}`}`;

		if (this.password && this.password != "0") {
			let pass = XOR.decrypt(this.password, 26364);
			if (pass.length > 1) this.password = pass.slice(1);
			else this.password = pass;
		}

		if (server.onePointNine) {
			this.orbs = 0;
			this.diamonds = 0;
			if (this.difficultyFace.startsWith('demon')) {
				this.difficulty = "Demon";
				this.difficultyFace = this.difficultyFace.replace(/demon-.+?($|-)(.+)?/, "demon$1$2");
			}
		}

		if (this.editorTime == 1 && this.totalEditorTime == 2) {
			this.editorTime = 0;
			this.totalEditorTime = 0;
		} // remove GDPS default values
	}

	/**
	 * Parse a song object, and include the necessary information into this `Level` object.
	 * @param songInfo The song information as a semi-parsed song object.
	 */
	getSongInfo(songInfo: Record<number, string>) {
		if (this.customSong) {
			this.songName = songInfo[2] || "Unknown";
			this.songAuthor = songInfo[4] || "Unknown";
			this.songSize = (songInfo[5] || "0") + "MB";
			this.songID = songInfo[1] || this.customSong.toString();
			if (songInfo[10]) this.songLink = decodeURIComponent(songInfo[10]);
		}
		else if (this.officialSong) {
			let foundSong = music[this.officialSong] || {"null": true};
			this.songName =  foundSong[0] || "Unknown";
			this.songAuthor = foundSong[1] || "Unknown";
			this.songSize = "0MB";
			this.songID = "Level " + this.officialSong;
		}
	}
}

/**
 * Class for a Geometry Dash level query item in search results.
 */
export class SearchQueryLevel extends Level {
	/**
	 * The URL of the server's Demon List API, if it has one (e.g. `http://pointercrate.com/`. Make sure it ends with a slash!
	 */
	demonList?: string;
	/**
	 * The position of the level on the Demon list.
	 */
	demonPosition?: number;
	/**
	 * If the Geometry Dash server is a private server (that is, not maintained by RobTop).
	 */
	gdps?: string;
	/**
	 * The number of items returned by the search on a page.
	 */
	results?: number;
	/**
	 * The total number of pages of the search.
	 * This value is sometimes set to 9999.
	 */
	pages?: number;
}

/**
 * Class for a Geometry Dash level with additional properties only available through downloading.
 */
export class DownloadedLevel extends Level {
	/**
	 * The level data.
	 */
	data: string;
	/**
	 * The extra string that comes with the level. Its use is still unknown.
	 */
	extraString?: string;
	/**
	 * If the Geometry Dash server is a private server (that is, not maintained by RobTop).
	 */
	gdps?: string;
	/**
	 * The position of the level on the Demon list.
	 */
	demonList?: number;
}