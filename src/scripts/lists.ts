/**
 * @fileoverview Site-specific script for the level lists page.
 */

$("#refreshButton").on("click", function() {
	location.reload();
});

$(".closeWindow").on("click", function () {
	$(".popup").hide();
});

$("#infoButton").on("click", function() {
	$("#infoDiv").show();
});

export {};