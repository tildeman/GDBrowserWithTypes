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

const menuButton = document.getElementById('menu-btn') as HTMLButtonElement;
const headerLink = document.getElementsByClassName('header-link') as HTMLCollectionOf<HTMLButtonElement>;

// menu button
menuButton.onclick = function() {
	document.getElementsByClassName('header-links')[0].classList.toggle('hid');
	menuButton.classList.toggle('active');
}

for(let i = 0; i < headerLink.length; i++) {
	headerLink[i].onclick = function() {
		document.getElementsByClassName('header-links')[0].classList.toggle('hid');
		menuButton.classList.toggle('active');
	}
}

$('.reveal').on('click', function() {
	revealSection($(this).next());
});

export {};