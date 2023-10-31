/**
 * @fileoverview Routing page for static assets
 */

import express from "express";
import fs from "node:fs";

const router = express.Router();

router.use('/', express.static('assets', {maxAge: "7d"}));
router.use('/css', express.static('assets/css'));

router.get("/:dir*?", function(req, res) {
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

export default router;