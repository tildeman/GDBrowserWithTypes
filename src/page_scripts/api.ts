/**
 * @fileoverview Site-specific script for the API page.
 */

$('.subdiv').each(function() {
	$(this).html($(this).html().replace(/(<p( class=".*?")?>)([a-zA-Z0-9]*:) /g, '$1<span class="param">$3</span> '));
});

// smooth scrolling through anchors
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
	anchor.addEventListener('click', function(e) {
		e.preventDefault();
		document.querySelector(this.getAttribute('href')).scrollIntoView({
			behavior: 'smooth'
		});
	});
});

let menuButton = document.getElementById('menu-btn') as HTMLButtonElement;
let headerLink = document.getElementsByClassName('header-link') as HTMLCollectionOf<HTMLButtonElement>;

// menu button
menuButton.onclick = function(){
	document.getElementsByClassName('header-links')[0].classList.toggle('hid');
	menuButton.classList.toggle('active');
}

for(let i = 0; i < headerLink.length; i++){
	headerLink[i].onclick = function(){
		document.getElementsByClassName('header-links')[0].classList.toggle('hid');
		menuButton.classList.toggle('active');
	}
}

// revealing
function revealSection(element: HTMLElement | JQuery<HTMLElement>) {
	let el = $(element);
	el.slideToggle(100);
	let foundFetch = el.find('.fetch:not(.fetched)');
	if (foundFetch.length) {
		foundFetch.addClass('fetched');
		fetch(`..${foundFetch.attr('link')}`).then(res => res.json()).then(res => {
			foundFetch.html(JSON.stringify(res, null, 2));
		});
	}
}

$('.reveal').on('click', function() {
	revealSection($(this).next());
});