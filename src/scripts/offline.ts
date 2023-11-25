/**
 * @fileoverview Site-specific script for the fallback page for offline servers.
 */

let line = 0;
const dialogue = [
	"Hi there!", "We got IP banned again :)", "As usual we don't know why...", "Bit of a shame honestly", "We had a good streak going", "Sometimes the GD servers are slow",
	"And Rob tries to fix it...", "...by killing GDBrowser??", "Look I really don't know", "Anyways uhhh",
	"Hopefully we're back soon", "You're stuck with me for now", "Some features still work though!",
	"Accurate leaderboard works fine", "Icon kit too, mostly", "Also, keep in mind we're on GitHub", "So you can use GDBrowser locally", "And downloading works too!",
	"Gotta be big brain for that though...", "Anywhooo", "Enjoy your time here in the Vault", "I'm sure you'll find something to do",
	"Go buy stocks or something", "...", ".....", "uwu", "Yeah that's all I have to say", "You can stop clicking now",
	"I'm just gonna repeat myself", "*ahem*"
];

$("#glubfub").on("click", function() {
	const msg = dialogue[line % dialogue.length];
	$("#msg").text(msg);
	line++;
});

$("#glubfub").trigger("click");

export {};