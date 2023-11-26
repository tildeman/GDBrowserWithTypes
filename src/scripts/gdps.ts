/**
 * @fileoverview Site-specific script for the private server listing page.
 */

import { Fetch, serverMetadata } from "../misc/global.js";
import { IServerInfo } from "../types/servers.js";
import { Handlebars } from "../vendor/index.js";

/**
 * List the available servers in `servers.json`.
 */
function listServers() {
	if (page >= pageCount) $('#pageUp').hide();
	else $('#pageUp').show();
	if (page <= 1) $('#pageDown').hide();
	else $('#pageDown').show();

	let serverPage = servers.slice((page - 1) * pageSize, (page - 1) * pageSize + pageSize);
	$('#searchBox').html('<div style="height: 4.5%"></div>').scrollTop(0);

	serverPage.forEach(serverInfo => {
		$("#searchBox").append(searchResultTemplate({
			serverColor: (serverMetadata.gdps || "") == serverInfo.id ? "#00DDFF" : "white",
			serverInfo,
			serverIcon: serverInfo.id || "gd",
			serverLink: `http://${serverInfo.id || ""}${serverInfo.id && localhost ? ".serverInfo" : ""}${serverInfo.id ? "." : ""}${host}`
		}));
	});
	$('#searchBox').append('<div style="height: 4.5%"></div>');
}

const searchResultTemplateString = await fetch("/templates/gdps_searchResult.hbs").then(res => res.text());
const searchResultTemplate = Handlebars.compile(searchResultTemplateString);

// There's simply no good way to identify subdomains for both local and production environments.
const localhost = window.location.hostname == "localhost";
const host = window.location.host.split(".").slice(-2).join(".");

const pageSize = 20;
const rawServers: IServerInfo[] = await Fetch('/api/gdps');
const currentServer = rawServers.find(serverItem => serverItem.id == serverMetadata.gdps);
const servers = [currentServer]
	.concat(rawServers.filter(serverItem => serverItem.id != serverMetadata.gdps))
	.filter(serverItem => serverItem) as IServerInfo[];
const pageCount = Math.floor((servers.length - 1) / pageSize) + 1;

let page = 1;
listServers();

$('#pageUp').on("click", function() {
	page++;
	listServers();
});
$('#pageDown').on("click", function() {
	page--;
	listServers();
});
$('#loading').hide();

$(document).on("keydown", function(k) {
	if (k.which == 37 && $('#pageDown').is(":visible")) $('#pageDown').trigger('click');   // left
	if (k.which == 39 && $('#pageUp').is(":visible")) $('#pageUp').trigger('click');       // right
});

export {};