import achievementTypes from './misc/achievementTypes.json' assert { type: "json" };
import achievements from './misc/achievements.json' assert { type: "json" };
import { fetchTemplate, fetchStaticFile } from './lib/template_handle.js';
import sampleIcons from './misc/sampleIcons.json' assert {type: "json" };
import secrets from "./misc/secretStuff.json" assert { type: "json" };
import { AppRoutines, ExportBundle, ServerInfo } from "./types.js";
import serverListRaw from "./servers.json" assert { type: "json" };
import express, { NextFunction, Request, Response } from 'express';
import rateLimit, { AugmentedRequest } from "express-rate-limit";
import music from './misc/music.json' assert { type: "json" };
import { convertUSP } from './lib/uspconvert.js';
import request, { AxiosResponse } from 'axios'; // `request` is trash
import compression from 'compression';
import appConfig from './settings.js';
import timeout from 'connect-timeout';
import { XOR } from './lib/xor.js';
import fs from "node:fs";

// TODO: Enforce strict mode for everything

/**
 * The Express app that does all the stuff.
 */
const app = express(); 

/**
 * The list of servers in `servers.json`.
 */
const serverList: ServerInfo[] = serverListRaw;

/**
 * Servers that are pinned to the top. Sorted by whatever comes first.
 */
const pinnedServers = serverList.filter(x => x.pinned);

/**
 * Servers that are not pinned to the top. Sorted alphabetically.
 */
const notPinnedServers = serverList.filter(x => !x.pinned).sort((a, b) => a.name.localeCompare(b.name));

const appServers = pinnedServers.concat(notPinnedServers);
const appSafeServers = appServers.map(({ endpoint, substitutions, overrides, disabled, ...rest }) => rest);

/**
 * Message to display upon hitting the rate limit.
 */
const rlMessage = "Rate limited ¯\\_(ツ)_/¯<br><br>Please do not spam my servers with a crazy amount of requests. It slows things down on my end and stresses RobTop's servers just as much." +
" If you really want to send a zillion requests for whatever reason, please download the GDBrowser repository locally - or even just send the request directly to the GD servers.<br><br>" +
"This kind of spam usually leads to GDBrowser getting IP banned by RobTop, and every time that happens I have to start making the rate limit even stricter. Please don't be the reason for that.<br><br>";

/**
 * Helper function for creating custom identifiers for GDBrowser.
 * @param req The request alongside additional properties.
 * @returns The "X-REAL-IP" or "X-FORWARDED-FOR" headers that Robtop recommends.
 */
function keyGeneratorHelper(req: AugmentedRequest): string | Promise<string> { 
	return req.headers['x-real-ip']?.toString() || req.headers['x-forwarded-for']?.toString() || "";
}

/**
 * Rate limit for level downloads, comments, likes, etc.
 */
const RL = rateLimit({
	windowMs: appConfig.rateLimiting ? 5 * 60 * 1000 : 0,
	max: appConfig.rateLimiting ? 100 : 0, // max requests per 5 minutes
	message: rlMessage,
	keyGenerator: keyGeneratorHelper,
	skip: function(req) {
		return ((req.url.includes("api/level") && !req.query.hasOwnProperty("download")) ? true : false);
	}
});

/**
 * Rate limit for comments, leaderboards, profiles, search queries, etc.
 */
const RL2 = rateLimit({
	windowMs: appConfig.rateLimiting ? 2 * 60 * 1000 : 0,
	max: appConfig.rateLimiting ? 200 : 0, // max requests per 1 minute
	message: rlMessage,
	keyGenerator: function(req) {
		return req.headers['x-real-ip']?.toString() || req.headers['x-forwarded-for']?.toString() || "";
	}
});

let assetPage = fs.readFileSync('./html/assets.html', 'utf8');

const appAccountCache: Record<string, any> = {};
const appLastSuccess: Record<string, number> = {};
const appActuallyWorked: Record<string, boolean> = {};

appServers.forEach(x => {
	appAccountCache[x.id || "gd"] = {};
	appLastSuccess[x.id || "gd"] = Date.now();
});

// The default no-id endpoint always exists, trust me!
const appMainEndpoint = appServers.find(x => !x.id)!.endpoint; // boomlings.com unless changed in fork

app.set('json spaces', 2)
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(timeout('20s'));

app.use(async function(req, res, next) {
	const subdomain_level = 1;
	let subdomains = req.subdomains.map(x => x.toLowerCase());
	if (subdomains.length < subdomain_level) subdomains = [""];
	const reqServer = appServers.find(x => subdomains.includes(x.id.toLowerCase()));
	if (subdomains.length > subdomain_level || !reqServer) {
		return res.redirect("http://" + req.get('host')?.split(".").slice(subdomains.length).join(".") + req.originalUrl);
	}

	// will expand this in the future :wink:
	// annotation: it never will be.
	const resSendError = function(errorCode = 500) {
		res.status(errorCode).send("-1");
	}

	// literally just for convenience
	const reqOffline = (+(req.query.online || 0) > 0) ? false : (reqServer.offline || false);
	const reqEndpoint = reqServer.endpoint;
	const reqOnePointNine = reqServer.onePointNine;
	const reqTimestampSuffix = reqServer.timestampSuffix || "";
	const reqId = reqServer.id || "gd";
	const reqIsGDPS = reqServer.endpoint != appMainEndpoint;

	if (reqIsGDPS) res.set("gdps", (reqOnePointNine ? "1.9/" : "") + reqId);

	const reqGdParams = function(obj: Record<string, string | number | undefined> = {}, substitute = true) {
		Object.keys(appConfig.params).forEach(x => { if (!obj[x]) obj[x] = appConfig.params[x] });
		Object.keys(reqServer.extraParams || {}).forEach(x => { if (!obj[x]) obj[x] = reqServer.extraParams?.x });
		const ip = req.headers['x-real-ip']?.toString() || req.headers['x-forwarded-for']?.toString() || "";
		const params = {
			form: obj,
			headers: appConfig.ipForwarding && ip ? {
				'x-forwarded-for': ip,
				'x-real-ip': ip,
				"user-agent": ""
			} : {
				"user-agent": ""
			}
		};

		if (substitute) { // GDPS substitutions in settings.js
			for (let ss in reqServer.substitutions) {
				if (params.form[ss]) { params.form[reqServer.substitutions[ss]] = params.form[ss]; delete params.form[ss] };
			}
		}
		return params;
	}

	const reqGdRequest = function(target: string, params: Record<string, any> = {}, cb: (err?: boolean | Error | { serverError: boolean, response: string }, resp?: AxiosResponse, body?: string) => any): void {
		if (!target) return cb(true);
		target = reqServer.overrides ? (reqServer.overrides[target] || target) : target;
		const parameters = params.headers ? params : reqGdParams(params);
		let endpoint = reqEndpoint;
		if (params.forceGD || (params.form && params.form.forceGD)) {
			endpoint = "http://www.boomlings.com/database/";
		}
		// Funnily enough, `request` is the axios library.
		request.post(endpoint + target + '.php', convertUSP(parameters.form), { headers: parameters.headers })
			.then(function(res: AxiosResponse) {
				let body: string = res.data.toString(), error: undefined | { serverError: true, response: any };
				if (!body || body.match(/^-\d$/) || body.startsWith("error") || body.startsWith("<")) {
					error = {serverError: true, response: body};
				}
				return cb(error, res, body);
			})
			.catch(function(err: any) {
				console.warn(err.message);
			});
	}

	const reqBundle = {
		server: reqServer,
		offline: reqOffline,
		endpoint: reqEndpoint,
		onePointNine: reqOnePointNine,
		timestampSuffix: reqTimestampSuffix,
		id: reqId,
		isGDPS: reqIsGDPS,
		gdParams: reqGdParams,
		gdRequest: reqGdRequest
	};
	const bundle: ExportBundle = {
		req: reqBundle,
		sendError: resSendError
	};
	res.locals.stuff = bundle;

	next();
})

const directories = [""];
fs.readdirSync('./api').filter(x => !x.includes(".")).forEach(x => directories.push(x));

function trackSuccess(id: string) {
	appLastSuccess[id] = Date.now();
	if (!appActuallyWorked[id]) appActuallyWorked[id] = true;
}

function appTimeSince(id: string, time?: number) {
	if (!time) time = appLastSuccess[id];
	let secsPassed = Math.floor((Date.now() - time) / 1000);
	let minsPassed = Math.floor(secsPassed / 60);
	secsPassed -= 60 * minsPassed;
	return `${appActuallyWorked[id] ? "" : "~"}${minsPassed}m ${secsPassed}s`;
}

function appUserCache(id: string, accountID: string, playerID: string, name: string): [string, string, string] | undefined {
	if (!accountID || accountID == "0" || (name && name.toLowerCase() == "robtop" && accountID != "71") || !appConfig.cacheAccountIDs) return;
	if (!playerID) return appAccountCache[id][accountID.toLowerCase()];
	let cacheStuff: [string, string, string] = [accountID, playerID, name];
	appAccountCache[id][name.toLowerCase()] = cacheStuff;
	return cacheStuff;
}

const run: Record<string, any> = {};
// TODO: Do use your brain
let apiFiles: string[] = [];
for (const d of directories) {
	apiFiles = fs.readdirSync('./api/' + d);
	for (const x of apiFiles) {
		if (x.includes('.')) {
			run[x.split('.')[0]] = (await import('./api/' + d + "/" + x)).default;
		}
	}
}

let hasSecretStuff = false;

let id: number | string;
let gjp: number | string;
let sheetsKey: string | undefined;

try {
	hasSecretStuff = true;
	id = secrets.id;
	gjp = secrets.gjp || XOR.encrypt(secrets.password);
	sheetsKey = secrets.sheetsKey;
	if (!Number(id) || (!secrets.password && !secrets.gjp) || (secrets.password || secrets.gjp).includes("delete this line")) {
		console.warn("Warning: No account ID and/or password has been provided in secretStuff.json! These are required for level leaderboards to work.");
	}
	if (sheetsKey?.includes("google sheets api key")) sheetsKey = undefined;
}
catch(e) {
	id = 0;
	gjp = 0;
	if (!hasSecretStuff) {
		console.warn("Warning: secretStuff.json has not been created! This file is required for level leaderboards to work.");
	}
	else {
		console.warn("There was an error parsing your secretStuff.json file!")
		console.error(e);
	}
}

function appParseResponse(responseBody: string, splitter = ":") {
	if (!responseBody || responseBody == "-1") return {};
	if (responseBody.startsWith("\nWarning:")) responseBody = responseBody.split("\n").slice(2).join("\n").trim(); // GDPS'es are wild
	if (responseBody.startsWith("<br />")) responseBody = responseBody.split("<br />").slice(2).join("<br />").trim(); // Seriously screw this
	const response = responseBody.split('#')[0].split(splitter);
	const res: Record<number, string> = {};
	for (let i = 0; i < response.length; i += 2) {
		res[response[i]] = response[i + 1];
	};
	return res;
}

// xss bad
function appClean(text: string | number | undefined) {
	return (text ? text.toString() : "")
		.replace(/&/g, "&#38;")
		.replace(/</g, "&#60;")
		.replace(/>/g, "&#62;")
		.replace(/=/g, "&#61;")
		.replace(/"/g, "&#34;")
		.replace(/'/g, "&#39;");
}

// Packing stuff into app.locals
const appLocals: AppRoutines = {
	config: appConfig,
	servers: appServers,
	safeServers: appSafeServers,
	mainEndpoint: appMainEndpoint,
	accountCache: appAccountCache,
	lastSuccess: appLastSuccess,
	actuallyWorked: appActuallyWorked,
	id: id,
	gjp: gjp,
	run: run,
	sheetsKey: sheetsKey,
	userCache: appUserCache,
	timeSince: appTimeSince,
	parseResponse: appParseResponse,
	trackSuccess: trackSuccess,
	clean: appClean
};

app.locals.stuff = appLocals;

app.set("view engine", "pug");
app.set("views", "./templates");

// ASSETS

app.use('/assets', express.static('assets', {maxAge: "7d"}));
app.use('/assets/css', express.static('assets/css'));

app.use('/iconkit', express.static('iconkit'));
app.get("/global.js", fetchStaticFile("misc/global.js"));
app.get("/dragscroll.js", fetchStaticFile("misc/dragscroll.js"));
app.use("/page_scripts", express.static("page_scripts"));

app.get("/assets/:dir*?", function(req, res) {
	let main = (req.params["dir*"] || "").toLowerCase();
	const dir = main + (req.params[0] || "").toLowerCase();

	if (dir.includes('.') || !req.path.endsWith("/")) {
		// As a JS/TS developer I am morally responsible that I make my code look good for everyone
		// and not "unintentionally write bad code and not be willing to open-source it"
		if (!req.params[0]) main = "";
		if (req.params["dir*"] == "deatheffects" || req.params["dir*"] == "trails") {
			return res.status(200).sendFile("assets/deatheffects/0.png");
		}
		else if (req.params["dir*"] == "gdps" && req.params[0].endsWith("_icon.png")) {
			return res.status(200).sendFile("assets/gdps/unknown_icon.png");
		}
		else if (req.params["dir*"] == "gdps" && req.params[0].endsWith("_logo.png")) {
			return res.status(200).sendFile("assets/gdps/unknown_logo.png");
		}
		return res.status(404).send(`<p style="font-size: 20px; font-family: aller, helvetica, arial">Looks like this file doesn't exist ¯\\_(ツ)_/¯<br><a href='/assets/${main}'>View directory listing for <b>/assets/${main}</b></a></p>`);
	}

	const path = `./assets/${dir}`;
	const files: string[] = fs.existsSync(path)? fs.readdirSync(path): [];

	const assetData = {
		files: files.filter(x => x.includes('.')),
		directories: files.filter(x => !x.includes('.'))
	};

	res.render("assets", {
		name: dir || "assets",
		data: assetData,
		pathname: req.path
	});
});


// POST REQUESTS

app.post("/like", RL, function(req, res) { run.like(app, req, res) });
app.post("/postComment", RL, function(req, res) { run.postComment(app, req, res) });
app.post("/postProfileComment", RL, function(req, res) { run.postProfileComment(app, req, res) });

app.post("/messages", RL, function(req, res) { run.getMessages(app, req, res) });
app.post("/messages/:id", RL, function(req, res) { run.fetchMessage(app, req, res) });
app.post("/deleteMessage", RL, function(req, res) { run.deleteMessage(app, req, res) });
app.post("/sendMessage", RL, function(req, res) { run.sendMessage(app, req, res) });

app.post("/accurateLeaderboard", function(req, res) { run.accurate(app, req, res, true) });
app.post("/analyzeLevel", function(req, res) { run.analyze(app, req, res) });

// HTML

/**
 * Entries that are disabled for 1.9 servers.
 * 2.0 servers don't have customized settings, but it should be similar enough.
 */
const onePointNineDisabled = ['daily', 'weekly', 'gauntlets', 'messages'];
/**
 * Entries that are disabled for servers that block level downloads.
 * 
 * RobTop is known to do so for the main GDBrowser website.
 */
const downloadDisabled = ['daily', 'weekly'];
/**
 * For GDPS servers, do not display these.
 */
const gdpsHide = ['achievements', 'messages'];

app.get("/", function(req, res) {
	const { req: reqBundle }: ExportBundle = res.locals.stuff;

	if (req.query.hasOwnProperty("offline") || (reqBundle.offline && !req.query.hasOwnProperty("home"))) {
		res.render("offline", {
			author: reqBundle.server.author
		});
	}
	else {
		try {
			res.render("home", {
				isGDPS: reqBundle.isGDPS,
				isOnePointNine: reqBundle.onePointNine || false,
				serverName: reqBundle.server.name,
				serverID: reqBundle.id,
				serverDisabled: reqBundle.server.disabled || [],
				onePointNineDisabled,
				isDownloadDisabled: reqBundle.server.downloadsDisabled || false,
				downloadDisabled
			});
		}
		catch (err) {
			console.warn(err.message);
		}
	}
});

app.get("/achievements", fetchTemplate("achievements"));
app.get("/analyze/:id", fetchTemplate("analyze"));
app.get("/api", fetchTemplate("api"));
app.get("/boomlings", fetchTemplate("boomlings"));
app.get("/comments/:id", fetchTemplate("comments"));
app.get("/demon/:id", fetchTemplate("demon"));
app.get("/gauntlets", fetchTemplate("gauntlets"));
app.get("/gdps", fetchTemplate("gdps"));
app.get("/iconkit", fetchTemplate("iconkit"));
app.get("/leaderboard", fetchTemplate("leaderboard"));
app.get("/leaderboard/:text", fetchTemplate("levelboard"));
app.get("/mappacks", fetchTemplate("mappacks"));
app.get("/messages", fetchTemplate("messages"));
app.get("/search", fetchTemplate("filters"));
app.get("/search/:text", fetchTemplate("search"));

// This is documentation for the GDBrowser's internal API, which is off by default.
// Uncomment this line if you want it enabled.

// app.get("/docs", fetchTemplate("api_old"));

// This is the "coming soon" page.
// The browser currently encompasses all the online features of Update 2.11, but
// with the upcoming release of 2.2, things may change.
// Uncommenting this line will make the page available at `/comingsoon`.

// app.get("/comingsoon", fetchTemplate("comingsoon"));

// API

app.get("/api/analyze/:id", RL, function(req, res) { run.level(app, req, res, true, true) });
app.get("/api/boomlings", function(req, res) { run.boomlings(app, req, res) });
app.get("/api/comments/:id", RL2, function(req, res) { run.comments(app, req, res) });
app.get("/api/credits", async function(req, res) { res.status(200).send((await import('./misc/credits.json', { assert: { type: "json" } })).default) });
app.get("/api/gauntlets", function(req, res) { run.gauntlets(app, req, res) });
app.get("/api/leaderboard", function(req, res) { run[req.query.hasOwnProperty("accurate") ? "accurate" : "scores"](app, req, res) });
app.get("/api/leaderboardLevel/:id", RL2, function(req, res) { run.leaderboardLevel(app, req, res) });
app.get("/api/level/:id", RL, function(req, res) { run.level(app, req, res, true) });
app.get("/api/mappacks", function(req, res) { run.mappacks(app, req, res) });
app.get("/api/profile/:id", RL2, function(req, res) { run.profile(app, req, res, true) });
app.get("/api/search/:text", RL2, function(req, res) { run.search(app, req, res) });
app.get("/api/song/:song", function(req, res){ run.song(app, req, res) });
 

// REDIRECTS

app.get("/icon", function(req, res) { res.redirect('/iconkit') });
app.get("/obj/:text", function(req, res) { res.redirect('/obj/' + req.params.text) });
app.get("/leaderboards/:id", function(req, res) { res.redirect('/leaderboard/' + req.params.id) });
app.get("/profile/:id", function(req, res) { res.redirect('/u/' + req.params.id) });
app.get("/p/:id", function(req, res) { res.redirect('/u/' + req.params.id) });
app.get("/l/:id", function(req, res) { res.redirect('/leaderboard/' + req.params.id) });
app.get("/a/:id", function(req, res) { res.redirect('/analyze/' + req.params.id) });
app.get("/c/:id", function(req, res) { res.redirect('/comments/' + req.params.id) });
app.get("/d/:id", function(req, res) { res.redirect('/demon/' + req.params.id) });


// API AND HTML
	 
app.get("/u/:id", function(req, res) { run.profile(app, req, res) });
app.get("/:id", function(req, res) { run.level(app, req, res) });


// MISC

app.get("/api/userCache", function(req, res) { res.status(200).send(appAccountCache) });
app.get("/api/achievements", function(req, res) { res.status(200).send({ achievements, types: achievementTypes, shopIcons: sacredTexts.shops, colors: sacredTexts.colors }) });
app.get("/api/music", function(req, res) { res.status(200).send(music) });
app.get("/api/gdps", function(req, res) {res.status(200).send(req.query.hasOwnProperty("current") ? appSafeServers.find(x => res.locals.stuff.req.server.id == x.id) : appSafeServers) });

// important icon stuff
const sacredTexts: Record<string, any> = {};

const sacredTextFiles = fs.readdirSync('./iconkit/sacredtexts');
for (let x of sacredTextFiles) {
	sacredTexts[x.split(".")[0]] = (await import("./iconkit/sacredtexts/" + x, { assert: { type: "json" } })).default;
}

const previewIcons = fs.readdirSync('./iconkit/premade');
const newPreviewIcons = fs.readdirSync('./iconkit/newpremade');

const previewCounts = {};
previewIcons.forEach(x => {
	if (x.endsWith("_0.png")) return;
	const iconType = sacredTexts.forms[x.split("_")[0]]?.form || "";
	if (!previewCounts[iconType]) previewCounts[iconType] = 1;
	else previewCounts[iconType]++;
});
sacredTexts.iconCounts = previewCounts;

const newIcons = fs.readdirSync('./iconkit/newicons');
sacredTexts.newIcons = [];
const newIconCounts = {};
newIcons.forEach(x => {
	if (x.endsWith(".plist")) {
		sacredTexts.newIcons.push(x.split("-")[0]);
		let formName = x.split(/_\d/g)[0];
		if (!newIconCounts[formName]) newIconCounts[formName] = 1;
		else newIconCounts[formName]++;
	}
});
sacredTexts.newIconCounts = newIconCounts;

app.get('/api/icons', function(req, res) { 
	res.status(200).send(sacredTexts);
});

// important icon kit stuff
const iconKitFiles: Record<string, string[]> = {};
const extraDataDir = fs.readdirSync('./iconkit/extradata');
for (const x of extraDataDir) {
	iconKitFiles[x.split(".")[0]] = (await import("./iconkit/extradata/" + x, { assert: { type: "json" } })).default;
}

iconKitFiles.previewIcons = previewIcons;
iconKitFiles.newPreviewIcons = newPreviewIcons;

app.get('/api/iconkit', function(req, res) {
	const {req: reqBundle}: ExportBundle = res.locals.stuff;
	const sample = [JSON.stringify(sampleIcons[Math.floor(Math.random() * sampleIcons.length)].slice(1))];
	const iconserver = reqBundle.isGDPS ? reqBundle.server.name : undefined;
	res.status(200).send(Object.assign(iconKitFiles, {sample, server: iconserver, noCopy: reqBundle.onePointNine || reqBundle.offline}));
});

app.get('/icon/:text', function(req, res) {
	const iconID = Number(req.query.icon || 1) || 1;
	// TODO: Why is it flattening `req.query.form` into a string?
	const iconForm = sacredTexts.forms[String(req.query.form)] ? req.query.form : "icon"
	const iconPath = `${iconForm}_${iconID}.png`;
	const fileExists = iconKitFiles.previewIcons.includes(iconPath);
	if (fileExists) return res.status(200).sendFile(`./iconkit/premade/${iconPath}`, { root: __dirname });
	else return res.status(200).sendFile(`./iconkit/premade/${iconForm}_01.png`, { root: __dirname });
});

app.get('*', function(req, res) {
	if (req.path.startsWith('/api') || req.path.startsWith("/iconkit")) {
		res.status(404).send('-1');
	}
	else res.redirect('/14471563');
});

app.use(function (err: Error | undefined, req: Request, res: Response) {
	if (err && err.message == "Response timeout") {
		res.status(504).send('Internal server error! (Timed out)');
	}
});

process.on('uncaughtException', (err) => {
	console.log(err);
});
process.on('unhandledRejection', (err, p) => {
	console.log(err);
});

app.listen(appConfig.port, () => console.log(`Site online! (port ${appConfig.port})`));
