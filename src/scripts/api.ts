/**
 * @fileoverview Site-specific script for the API page.
 */

/**
 * Display a hidden element with a slide animation.
 * @param element The element to display
 */
function revealSection(element: HTMLElement | JQuery<HTMLElement>) {
	const el = $(element);
	el.slideToggle(100);
	const foundFetch = el.find('.fetch:not(.fetched)');
	if (foundFetch.length) {
		foundFetch.addClass('fetched');
		fetch(`..${foundFetch.attr('link')}`).then(res => res.json()).then(res => {
			foundFetch.html(JSON.stringify(res, null, 2));
		});
	}
}

$('.subdiv').each(function() {
	$(this).html($(this).html().replace(/(<p( class=".*?")?>)([a-zA-Z0-9]*:) /g, '$1<span class="param">$3</span> '));
});

// smooth scrolling through anchors
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
	anchor.addEventListener('click', function(event) {
		event.preventDefault();
		document.querySelector(this.getAttribute('href')).scrollIntoView({
			behavior: 'smooth'
		});
	});
});

// menu button
$("#menu-btn").on("click", function() {
	$('.header-links').first().toggleClass('hid');
	$(this).toggleClass('active');
});

$(".header-link").on("click", function() {
	$('.header-links').first().toggleClass('hid');
	$("menu-btn").toggleClass('active');
});

$('.reveal').on('click', function() {
	revealSection($(this).next());
});

export {};