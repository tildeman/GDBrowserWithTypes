/**
 * @fileoverview Routing page for icons and the icon kit.
 */

import { sacredTexts, extraData as iconKitFiles } from "../iconkit/static_files.js";
import sampleIcons from '../misc/sampleIcons.json' assert {type: "json" };
import { fetchTemplate } from "../lib/template_handle.js";
import { ExportBundle } from "../types.js";
import express from "express";

const router = express.Router();

// icon kit page

router.get("/iconkit", fetchTemplate("iconkit"));

// important icon stuff

router.get('/api/icons', function(req, res) { 
	res.status(200).send(sacredTexts);
});

// important icon kit stuff

router.get('/api/iconkit', function(req, res) {
	const { req: reqBundle }: ExportBundle = res.locals.stuff;
	const sample = [JSON.stringify(sampleIcons[Math.floor(Math.random() * sampleIcons.length)].slice(1))];
	const iconserver = reqBundle.isGDPS ? reqBundle.server.name : undefined;
	res.status(200).send(Object.assign(iconKitFiles, { sample, server: iconserver, noCopy: reqBundle.onePointNine || reqBundle.offline }));
});

router.get('/icon/:text', function(req, res) {
	const iconID = Number(req.query.icon || 1) || 1;
	const iconForm = sacredTexts.forms[String(req.query.form)] ? req.query.form : "icon"
	const iconPath = `${iconForm}_${iconID}.png`;
	const fileExists = iconKitFiles.previewIcons.includes(iconPath);
	if (fileExists) return res.status(200).sendFile(`./iconkit/premade/${iconPath}`, { root: __dirname });
	else return res.status(200).sendFile(`./iconkit/premade/${iconForm}_01.png`, { root: __dirname });
});

export default router;