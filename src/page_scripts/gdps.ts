/**
 * @fileoverview Site-specific script for the private server listing page.
 */

import { ServerInfo } from "../types";

let pageSize = 20;
let page = 1;
let localhost = window.location.hostname == "localhost";
let host = window.location.host.split(".").slice(-2).join(".");

Fetch('/api/gdps').then((servers: ServerInfo[]) => {
	let currentServer = servers.find(x => x.id == gdps);
	servers = [currentServer].concat(servers.filter(x => x.id != gdps)).filter(x => x) as ServerInfo[];
	let pageCount = Math.floor((servers.length-1)/pageSize) + 1;

	/**
	 * List the available servers in `servers.json`.
	 */
	function listServers() {
		if (page >= pageCount) $('#pageUp').hide();
		else $('#pageUp').show();
		if (page <= 1) $('#pageDown').hide();
		else $('#pageDown').show();

		let serverPage = servers.slice((page-1)*pageSize, (page-1)*pageSize + pageSize);
		$('#searchBox').html('<div style="height: 4.5%"></div>').scrollTop(0);

		// TODO: This has a few glaring visual glitches
		serverPage.forEach(x => {
			$('#searchBox').append(`<div class="searchResult" style="height: 19%; padding-top: 1.2%; margin-right: 20vh;">
					<h1 class="lessspaced blue" style="color: ${(gdps || "") == x.id ? "#00DDFF" : "white"}">${x.name}</h1>
					<h2 class="lessSpaced smaller inline gdButton"><a href="${x.authorLink}" target="_blank">By ${x.author}</a></h2>
		
					<div class="center" style="position:absolute; height: 10%; width: 12.5%; left: 3%; transform:translateY(-160%)">
						<a href="${x.link}" target="_blank"><img class="gdButton spaced gdpslogo" src="/assets/gdps/${x.id || "gd"}_icon.png" style="height: 130%;"></a>
					</div>
					
					<div class="center" style="position:absolute; right: 7%; transform:translateY(-150%); height: 10%">
						<a href="http://${x.id || ""}${x.id && localhost ? ".x" : ""}${x.id ? "." : ""}${host}"><img style="margin-bottom: 4.5%" class="valign gdButton" src="/assets/view.png" height="105%"></a>
					</div>
				</div>`);
		});
		$('#searchBox').append('<div style="height: 4.5%"></div>');
	}

	listServers();

	$('#pageUp').click(function() {
		page++;
		listServers();
	});
	$('#pageDown').click(function() {
		page--;
		listServers();
	});
	$('#loading').hide();

	$(document).keydown(function(k) {
		if (k.which == 37 && $('#pageDown').is(":visible")) $('#pageDown').trigger('click');   // left
		if (k.which == 39 && $('#pageUp').is(":visible")) $('#pageUp').trigger('click');       // right
	});
});