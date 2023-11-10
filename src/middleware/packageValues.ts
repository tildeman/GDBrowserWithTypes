/**
 * @fileoverview Middleware to package useful functions into `reqBundle` for use in controllers
 */

import { appMainEndpoint, appServers } from "../lib/serverInfo.js";
import { Request, Response, NextFunction } from "express";
import { ExportBundle } from "../types/servers.js";
import { convertUSP } from "../lib/uspconvert.js";
import appConfig from '../settings.js';
import request from 'axios'; // `request` is trash

/**
 * Package useful functions into `reqBundle`, and let the controllers handle the rest.
 * @param req The client request.
 * @param res The server response (to send the level details/error).
 * @param next The next function in the Express pipeline.
 */
export default function(req: Request, res: Response, next: NextFunction) {
	// There's simply no good way to identify subdomains for both local and production environments.
	const subdomainLevel = 1;
	let subdomains = req.subdomains.map(subdomain => subdomain.toLowerCase());
	if (subdomains.length < subdomainLevel) subdomains = [""];
	const reqServer = appServers.find(serverItem => subdomains.includes(serverItem.id.toLowerCase()));
	if (subdomains.length > subdomainLevel || !reqServer) {
		return res.redirect("http://" + req.get('host')!.split(".").slice(subdomains.length).join(".") + req.originalUrl);
	}

	// will expand this in the future :wink:
	const resSendError = function(errorCode = 0, message = "The GD servers rejected the response for an unknown reason", responseCode = 500) {
		res.status(responseCode).send({
			error: errorCode,
			message
		});
	}

	// literally just for convenience
	const reqOffline = (+(req.query.online || 0) > 0) ? false : (reqServer.offline || false);
	const reqEndpoint = reqServer.endpoint;
	const reqOnePointNine = reqServer.onePointNine || false;
	const reqTimestampSuffix = reqServer.timestampSuffix || "";
	const reqId = reqServer.id || "gd";
	const reqIsGDPS = reqServer.endpoint != appMainEndpoint;

	if (reqIsGDPS) res.set("gdps", (reqOnePointNine ? "1.9/" : "") + reqId);

	const reqGdParams = function(obj: Record<string, string | number | undefined> = {}, substitute = true) {
		Object.keys(appConfig.params).forEach(parameter => { if (!obj[parameter]) obj[parameter] = appConfig.params[parameter] });
		Object.keys(reqServer.extraParams || {}).forEach(parameter => { if (!obj[parameter]) obj[parameter] = reqServer.extraParams?.parameter });
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

	const reqGdRequest = async function(target: string, params: Record<string, any> = {}): Promise<string> {
		if (!target) throw new Error("No target specified!");
		target = reqServer.overrides ? (reqServer.overrides[target] || target) : target;
		const parameters = params.headers ? params : reqGdParams(params);
		let endpoint = reqEndpoint;
		if (params.forceGD || (params.form && params.form.forceGD)) {
			endpoint = "http://www.boomlings.com/database/";
		}
		// Funnily enough, `request` is the axios library.
		const res = await request.post(endpoint + target + '.php', convertUSP(parameters.form), { headers: parameters.headers });
		let body: string = String(res.data);
		if (!body || body.match(/^-\d$/) || body.startsWith("error") || body.startsWith("<")) {
			throw new Error("Server error!\nResponse: " + body);
		}
		return body;
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
}