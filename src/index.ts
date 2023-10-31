import { __dirname , fetchStaticFile } from './lib/template_handle.js';
import serverListRaw from "./servers.json" assert { type: "json" };
import handleTimeouts from './middleware/handleTimeouts.js';
import packageValues from './middleware/packageValues.js';
import { SafeServers, ServerInfo } from "./types.js";
import { UserCache } from './classes/UserCache.js';
import compression from 'compression';
import appConfig from './settings.js';
import timeout from 'connect-timeout';
import express from 'express';

// ROUTE IMPORTS

import leaderboardRoutes from "./routes/leaderboards.js";
import staticFileRoutes from "./routes/staticfiles.js";
import redirectRoutes from "./routes/redirects.js";
import profileRoutes from "./routes/profiles.js";
import messageRoutes from "./routes/messages.js";
import searchRoutes from "./routes/searches.js";
import assetRoutes from "./routes/assets.js";
import levelRoutes from "./routes/levels.js";
import postRoutes from "./routes/posts.js";
import iconRoutes from "./routes/icons.js";
import listRoutes from "./routes/lists.js";
import miscRoutes from "./routes/misc.js";

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
const appSafeServers: SafeServers[] = appServers.map(({ endpoint, substitutions, overrides, disabled, ...rest }) => rest);

/**
 * All app-wide caching and global storage are to be done here.
 */
const userCacheHandle = new UserCache(appConfig.cacheAccountIDs, appServers);

// CONFIGURATION

app.set('json spaces', "\t");
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(timeout('20s'));
app.use(packageValues);

app.set("view engine", "pug");
app.set("views", "./templates");

// ASSETS

app.use("/assets", assetRoutes);
app.use('/iconkit', express.static('iconkit'));
app.get("/global.js", fetchStaticFile("misc/global.js"));
app.get("/dragscroll.js", fetchStaticFile("misc/dragscroll.js"));
app.use("/page_scripts", express.static("page_scripts"));

// ROUTES

app.use("/", levelRoutes(userCacheHandle));
app.use("/", profileRoutes(userCacheHandle));
app.use("/", searchRoutes(userCacheHandle));
app.use("/", leaderboardRoutes(userCacheHandle, appConfig.params.secret));
app.use("/", messageRoutes(userCacheHandle));
app.use("/", postRoutes(userCacheHandle));
app.use("/", listRoutes(appConfig.cacheGauntlets, appConfig.cacheMapPacks));
app.use("/", iconRoutes);
app.use("/api", staticFileRoutes(userCacheHandle, appSafeServers));
app.use("/", redirectRoutes)
app.use("/", miscRoutes);

app.use(handleTimeouts);

process.on('uncaughtException', (err) => {
	console.log(err);
});

process.on('unhandledRejection', (err) => {
	console.log(err);
});

app.listen(appConfig.port, () => console.log(`Site online! (port ${appConfig.port})`));
