/**
 * @fileoverview Site-specific script for the list search page.
 */

/**
 * Selected filter class.
 */
const selFil = "selectedFilter";

$(".diffDiv").on("click", function() {
	if ($(this).hasClass(selFil)) {
		$(this).removeClass(selFil);
	}
	else {
		$(".diffDiv").removeClass(selFil);
		$(this).addClass(selFil);
	}
});

$(".levelSearch").on("click", function() {
	const difficulties: string[] = [];
	$('.diffDiv').each(function() {
		if ($(this).hasClass(selFil)) {
			difficulties.push($(this).attr('diff') || "");
		}
	});

	// Pay attention to the plural. `list` for viewing a single list, `lists` for viewing multiple lists
	const url = "/listsearch/"
		+ (encodeURIComponent(($('#levelName').val() || "").toString()) || "*")
		+ ($(this).attr("search") == "0" ? "?" : "?type=" + $(this).attr('search') + "&")
		+ (difficulties.length ? "diff=" + difficulties[0] : "")
		+ ($('#starCheck').hasClass(selFil) ? "&starred" : "");

	window.location.href = url;
});

$("#starCheck").on("click", function() {
	if ($(this).hasClass(selFil)) $(this).removeClass(selFil);
	else $(this).addClass(selFil);
});

export {};