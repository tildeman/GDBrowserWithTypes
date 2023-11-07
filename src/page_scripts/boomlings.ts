/**
 * @fileoverview Site-specific script for the Boomlings leaderboard page.
 */

$('#boomerbox').html('');
$('#loading').show();

/**
 * Entry for the leaderboard in Boomlings (RobTop's discontinued game).
 */
interface BoomlingsILeaderboardEntry {
	boomling: string;
	name: string;
	level: number;
	score: number;
	powerups: [number, number, number];
	boomlingLevel: number;
	rank: number;
}

fetch(`/api/boomlings`).then(res => res.json()).then((res: "0" | BoomlingsILeaderboardEntry[]) => {
	if (res == "0") res = [];
	$('#boomerbox').html('');
	$('.ranking').remove();

	res.forEach((leaderboardItem) => {
		$('#boomerbox').append(`<div class="inline leaderboardSlot">
		<div class="flex" style="width: 7vh; height: 100%"><h1 class="rankNumber" style="width: inherit">${leaderboardItem.rank}</h1></div>
		<img src="/assets/boomlings/icons/${leaderboardItem.boomling}.png" style="width: 12vh; align-self: center">

		<p class="flex username" style="width: 48%">${leaderboardItem.name}</p>

		<div class="flex" style="width: 22%">
			<h1 class="level">Level ${leaderboardItem.level}<br><span class="score">${leaderboardItem.score}</span>
				<img class="powerup inline" style="height: 6vh" src="/assets/boomlings/powerups/${leaderboardItem.powerups[0]}.png">` +
			`<img class="powerup inline" style="height: 6vh" src="/assets/boomlings/powerups/${leaderboardItem.powerups[1]}.png">` +
			`<img class="powerup inline" style="height: 6vh" src="/assets/boomlings/powerups/${leaderboardItem.powerups[2]}.png">
			</h1>
		</div>

		<img src="/assets/boomlings/levels/${leaderboardItem.boomlingLevel}.png" style="width: 6.5%; align-self: center">
		</div>`);
	});

	$('#boomerbox').append('<div style="height: 4.5%"></div>');
	$('#loading').hide();
});

export {};