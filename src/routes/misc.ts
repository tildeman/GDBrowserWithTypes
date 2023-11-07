/**
 * @fileoverview Routing page for the home page and miscellaneous endpoints.
 */

import { fetchTemplate } from "../lib/template_handle.js";
import { ExportBundle } from "../types/servers.js";
import express from "express";

const router = express.Router();

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

router.get("/", function(req, res) {
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
				serverDisabled: (reqBundle.server.disabled || []).concat(reqBundle.isGDPS ? gdpsHide : []),
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

router.get("/achievements", fetchTemplate("achievements"));
router.get("/gdps", fetchTemplate("gdps"));

// This is documentation for the GDBrowser's internal API, which is off by default.
// Uncomment this line if you want it enabled.

// router.get("/docs", fetchTemplate("api_old"));

// This is the "coming soon" page.
// The browser currently encompasses all the online features of Update 2.11, but
// with the upcoming release of 2.2, things may change.
// Uncommenting this line will make the page available at `/comingsoon`.

// router.get("/comingsoon", fetchTemplate("comingsoon"));

router.get('*', function(req, res) {
	if (req.path.startsWith('/api') || req.path.startsWith("/iconkit")) {
		res.status(404).send('-1');
	}
	else res.redirect('/level/14471563');
});

export default router;