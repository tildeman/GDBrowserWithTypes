/**
 * @fileoverview Middleware to package useful functions into `reqBundle` for use in controllers
 */

import serverListRaw from "../servers.json" assert { type: "json" };
import { Request, Response, NextFunction } from "express";
import { ExportBundle, ServerInfo } from "../types.js";
import { convertUSP } from "../lib/uspconvert.js";
import request, { AxiosResponse } from 'axios'; // `request` is trash
import appConfig from '../settings.js';

/**
 * The list of servers in `servers.json`.
 */
const serverList: ServerInfo[] = serverListRaw;

/**
 * Servers that are pinned to the top. Sorted by whatever comes first.
 */
const pinnedServers = serverList.filter(serverItem => serverItem.pinned);

/**
 * Servers that are not pinned to the top. Sorted alphabetically.
 */
const notPinnedServers = serverList.filter(serverItem => !serverItem.pinned).sort((serverA, serverB) => serverA.name.localeCompare(serverB.name));

const appServers = pinnedServers.concat(notPinnedServers);

// The default no-id endpoint always exists, trust me!
const appMainEndpoint = appServers.find(serverItem => !serverItem.id)!.endpoint; // boomlings.com unless changed in fork

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
		if (!target) throw Error("No target specified!");
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
			throw Error("Server error!\nResponse: " + body);
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