/**
 * Determines if the window is selected.
 * @returns A boolean indicating the window selection status.
 */
function somethingSelected(): boolean {
	return Boolean(typeof window.getSelection == 'function' && window.getSelection()?.toString());
}

const remover = / |\n|\t/g;

/**
 * Manage scrolling by dragging.
 * @param el The HTML Element to drag.
 */
function dragscroll(el: HTMLElement): void {
	let previouslyMouseDown = false;
	el.addEventListener('mousemove', function(e) {
		if (e.buttons != 1) {
			if (previouslyMouseDown) {
				el.style.removeProperty('user-select');
				el.style.removeProperty('-webkit-user-select');
				previouslyMouseDown = false;
			}
			return;
		}
		if (somethingSelected()) return;
		if (!previouslyMouseDown) {
				for (let el of (e.target as HTMLDivElement)?.childNodes || "") {
					if (el.nodeType === Node.TEXT_NODE && el.textContent?.replace(remover, '').length) return;
			}
			el.style['user-select'] = 'none';
			el.style['-webkit-user-select'] = 'none';
			previouslyMouseDown = true;
		}
		//el.scrollLeft -= e.movementX;
		el.scrollTop -= e.movementY;
	}, { passive: true });
}

Array.prototype.forEach.call(document.getElementsByClassName('dragscroll'), dragscroll);