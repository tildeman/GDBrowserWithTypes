/**
 * @fileoverview Handle icons & renderings
 */

import { PIXI, agPsd, Ease } from "../vendor/index.js";
import { Color3B } from "../types/miscellaneous.js";
import { IAnimationObject, IExtraSettings, IIconConfiguration, IIconData, IPartForSpecialIcons, IIconColor } from "../types/icons.js";
import { Fetch } from "../misc/global.js";

/**
 * Section for a part of an icon.
 */
interface IIconPartSection {
	/**
	 * Glow outline.
	 */
	glow?: IconLayer;
	/**
	 * UFO dome color.
	 */
	ufo?: IconLayer;
	/**
	 * Primary color.
	 */
	col1?: IconLayer;
	/**
	 * Secondary color.
	 */
	col2?: IconLayer;
	/**
	 * White highlights.
	 */
	white?: IconLayer;
}

export const iconData: IIconData = await Fetch("/api/icons");
const iconCanvas: HTMLCanvasElement = document.createElement('canvas');
const iconRenderer: PIXI.Application = new PIXI.Application({
	view: iconCanvas,
	width: 300,
	height: 300,
	backgroundAlpha: 0
});

let overrideLoader = false;
let renderedIcons: Record<string, {
	name: string,
	data: string
}> = {};

/**
 * The color value for white.
 */
const WHITE = 0xffffff;

/**
 * The color names, used in annotation.
 */
const colorNames = {
	1: "Color 1",
	2: "Color 2",
	g: "Glow",
	w: "White",
	u: "UFO Dome"
};
/**
 * The former names of some gamemodes.
 */
const formNames = {
	player: "icon",
	player_ball: "ball",
	bird: "ufo",
	dart: "wave"
};

const loadedNewIcons: Record<string, PIXI.Texture> = {};
let loadedOldIcons: Record<string, PIXI.Texture> = {};

const positionMultiplier = 4;

/**
 * Position parts of the icon as needed.
 * @param part The part of the icon.
 * @param partIndex The index of the part.
 * @param layer The layer of the icon.
 * @param formName The form of the icon (cube, ship, etc.).
 * @param isNew Whether the icon is in 2.2.
 * @param isGlow Whether glow is enabled.
 */
function positionPart(part: IPartForSpecialIcons, partIndex: number, layer: PIXI.Container, formName: string, isNew: boolean, isGlow?: boolean) {
	layer.position.x += (part.pos[0] * positionMultiplier * (isNew ? 0.5 : 1));
	layer.position.y -= (part.pos[1] * positionMultiplier * (isNew ? 0.5 : 1));
	layer.scale.x = part.scale[0];
	layer.scale.y = part.scale[1];
	if (part.flipped[0]) layer.scale.x *= -1;
	if (part.flipped[1]) layer.scale.y *= -1;
	layer.angle = part.rotation;
	layer.zIndex = part.z;

	if (!isGlow) {
		const tintInfo = iconData.robotAnimations.info[formName].tints;
		const foundTint = tintInfo[partIndex];
		if (foundTint > 0) {
			const darkenFilter = new PIXI.ColorMatrixFilter();
			darkenFilter.brightness(0, false);
			darkenFilter.alpha = (255 - foundTint) / 255;
			layer.filters = [darkenFilter];
		}
	}
}

/**
 * Return a valid number with a given value.
 * @param val The value to be converted to a number (if possible).
 * @param defaultVal The fallback if the value cannot be converted into a number.
 * @returns The value cast to a number, or the fallback if not possible.
 */
function validNum(val: any, defaultVal: number | null) {
	const colVal = +val;
	return (isNaN(colVal) ? defaultVal : colVal) || 0;
}

/**
 * Get the glow color from the provided color value.
 * @param colors An array of RGB colors, or a glow value.
 * @returns The glow color.
 */
function getGlowColor(colors: { g?: number } | [number, number, number]) {
	const glowCol = colors["g"] || (colors[2] === 0 ? colors[1] : colors[2]) || WHITE; // white glow if both colors are black
	return glowCol;
}

/**
 * Validate the icon ID.
 * @param id The ID to be validated.
 * @param form The form of the player.
 * The validated ID.
 */
function validateIconID(id: number, form: string) {
	let realID = Math.min(iconData.newIconCounts[form], Math.abs(validNum(id, 1)));
	if (realID == 0 && !["player", "player_ball"].includes(form)) realID = 1;
	return realID;
}

/**
 * Parse the icon color.
 * @param col The color as a string or a number.
 * @returns The converted color in number format.
 */
export function parseIconColor(col: string | number | null) {
	if (!col) return WHITE;
	else if (typeof col == "string" && col.length >= 6) return parseInt(col, 16);
	const rgb = iconData.colors[col];
	return rgb ? rgbToDecimal(rgb) : WHITE;
}

/**
 * Parse the icon form.
 * @param form The form to be parsed.
 * The detected form, or `player` if none is found.
 */
export function parseIconForm(form: string) {
	const foundForm = iconData.forms[form];
	return foundForm ? foundForm.form : "player";
}

/**
 * Load icon layers.
 * @param form The form of the player.
 * @param id The ID of the player.
 * @param cb The callback once the icons are loaded.
 * @returns The return value of the callback.
 */
export async function loadIconLayers(form: string, id: number): Promise<boolean> {
	const iconStr = `${form}_${padZero(validateIconID(id, form))}`;
	const pendingTexturesToLoad = Object.keys(iconData.gameSheet).filter(gameSheetKeyItem => gameSheetKeyItem.startsWith(iconStr + "_"));

	if (loadedNewIcons[pendingTexturesToLoad[0]]) return true;

	else if (!pendingTexturesToLoad.length) {
		if (iconData.newIcons.includes(iconStr)) return await loadNewIcon(iconStr);
	}

	const texturesToLoad = pendingTexturesToLoad.map(textureName => ({ alias: textureName, src: `/iconkit/icons/${textureName}` }));
	loadedOldIcons = await PIXI.Assets.load(texturesToLoad);
	return false;
}

// 2.2 icon spritesheets
/**
 * Load 2.2 icon spritesheets.
 * @param iconStr The icon name to load.
 * @param cb The callback once the icons are loaded.
 * @returns This function does not return.
 */
async function loadNewIcon(iconStr: string): Promise<boolean> {
	const rawIconPlist = await fetch(`/iconkit/newicons/${iconStr}-hd.plist`);
	const plist = await rawIconPlist.text()
	const data = parseNewPlist(plist);
	const sheetName = iconStr + "-sheet";
	const texture = await PIXI.Assets.load({ alias: sheetName, src: `/iconkit/newicons/${iconStr}-hd.png` });
	Object.keys(data).forEach(frameName => {
		const bounds = data[frameName];
		const textureRect = new PIXI.Rectangle(bounds.pos[0], bounds.pos[1], bounds.size[0], bounds.size[1]);
		const partTexture = new PIXI.Texture(texture, textureRect);
		loadedNewIcons[frameName] = partTexture;
	});
	return true;
}

const dom_parser = new DOMParser();

/**
 * Parse a specialized property list
 * @param data The property list file to parse
 * @returns The position data of the property list
 */
function parseNewPlist(data: string) {
	const plist = dom_parser.parseFromString(data, "text/xml");
	const iconFrames = plist.children[0].children[0].children[1].children;
	const positionData: Record<string, { pos: number[]; size: number[] }> = {};
	for (let i = 0; i < iconFrames.length; i += 2) {
		const frameName = iconFrames[i].innerHTML;
		const frameData = iconFrames[i + 1].children;
		let isRotated = false;
		iconData.gameSheet[frameName] = {
			spriteOffset: [0, 0],
			spriteSize: [0, 0]
		};
		positionData[frameName] = { // Raw initialization
			pos: [],
			size: []
		};

		for (let n = 0; n < frameData.length; n += 2) {
			const keyName = frameData[n].innerHTML;
			const keyData = frameData[n + 1].innerHTML
			if (["spriteOffset", "spriteSize", "spriteSourceSize"].includes(keyName)) {
				iconData.gameSheet[frameName][keyName] = parseWeirdArray(keyData);
			}

			else if (keyName == "textureRotated") {
				isRotated = frameData[n + 1].outerHTML.includes("true");
				iconData.gameSheet[frameName][keyName] = isRotated;
			}

			else if (keyName == "textureRect") {
				const textureArr = keyData.slice(1, -1).split("},{").map(arrayStr => parseWeirdArray(arrayStr));
				positionData[frameName].pos = textureArr[0];
				positionData[frameName].size = textureArr[1];
			}
		}

		if (isRotated) positionData[frameName].size.reverse();
	}
	return positionData;
}

/**
 * Parse an array while stripping anything other than digits, commas and hyphens.
 * @param data The list representation with commas/hyphens.
 * @returns An array of parsed numbers.
 */
function parseWeirdArray(data: string): number[] {
	return data.replace(/[^0-9,-]/g, "").split(",").map(str => +str);
}

/**
 * Pad a number with 0 until the number has two or more digits.
 * @param num The number to pad.
 * @returns The padded number.
 */
function padZero(num: number) {
	let numStr = num.toString();
	if (num < 10) numStr = "0" + numStr;
	return numStr;
}

/**
 * Convert an RGB value to number format.
 * @param rgb An object containing red, green and blue.
 * @returns The RGB value as a number instead.
 */
export function rgbToDecimal(rgb: Color3B): number {
	return (rgb.r << 16) + (rgb.g << 8) + rgb.b;
}

// very shitty code :) i suck at this stuff

/**
 * Render the selected icon. Not thread-safe.
 */
export function renderIcons() {
	// if (overrideLoader) return;
	const iconsToRender = $('gdicon:not([rendered], [dontload])');
	if (iconsToRender.length < 1) return; // There are no icons to render
	// if (loader.loading) return overrideLoader = true;
	buildIcon(iconsToRender, 0);
}

/**
 * Auxiliary function to render icons in a page.
 * @param elements The list of GDIcon elements.
 * @param current The current index of the element.
 */
export async function buildIcon(elements: JQuery<HTMLElement>, current: number = 0) {
	if (current >= elements.length) return;
	const currentIcon = elements.eq(current);

	const cacheID = currentIcon.attr('cacheID');
	const foundCache = renderedIcons[cacheID || ""];
	if (foundCache) {
		finishIcon(currentIcon, foundCache.name, foundCache.data);
		return buildIcon(elements, current + 1);
	}

	const iconConfig: IIconConfiguration = {
		id: +(currentIcon.attr('iconID') || "0"),
		form: parseIconForm(currentIcon.attr('iconForm') || ""),
		col1: parseIconColor(currentIcon.attr('col1') || ""),
		col2: parseIconColor(currentIcon.attr('col2') || ""),
		glow: currentIcon.attr('glow') == "true",
		app: iconRenderer
	};

	const c = await loadIconLayers(iconConfig.form, iconConfig.id);
	if (c) iconConfig.new = true;
	const icon = new Icon(iconConfig)
	const dataURL = icon.toDataURL();
	const titleStr = `${Object.values(iconData.forms).find(formItem => formItem.form == icon.form)?.name} ${icon.id}`;
	if (cacheID) renderedIcons[cacheID] = {name: titleStr, data: dataURL};
	finishIcon(currentIcon, titleStr, dataURL);
	buildIcon(elements, current + 1);
}

/**
 * Finish the icon render and output to the current canvas.
 * @param currentIcon Where the icon is to be displayed.
 * @param name The name of the icon.
 * @param data The icon image in Base64 format.
 */
function finishIcon(currentIcon: JQuery<HTMLElement>, name: string, data: string) {
	currentIcon.append(`<img title="${name}" style="${currentIcon.attr("imgStyle") || ""}" src="${data}">`)
	currentIcon.attr("rendered", "true")
}

/**
 * Class for an icon in render.
 */
export class Icon {
	app: PIXI.Application;
	sprite: PIXI.Container;
	form: string;
	id: number;
	new: boolean;
	colors: IIconColor;
	glow: boolean;
	layers: IconPart[];
	glowLayers: IconPart[];
	complex: boolean;
	ease: Ease.Ease;
	animationSpeed: number;
	animationFrame: number;
	animationName: string;
	preCrop: {
		pos: [number, number],
		canvas: [number, number]
	};

	/**
	 * @param data The icon configuration.
	 * @param cb The callback once the icon is loaded.
	 */
	constructor(data: IIconConfiguration) {
		this.app = data.app;
		this.sprite = new PIXI.Container();
		this.form = data.form || "player";
		this.id = validateIconID(data.id, this.form);
		this.new = !!data.new;
		this.colors = {
			1: validNum(data.col1, 0xafafaf),    // primary
			2: validNum(data.col2, WHITE),       // secondary
			g: validNum(data.colG, null), // glow
			w: validNum(data.colW, WHITE), // white
			u: validNum(data.colU, WHITE), // ufo
		};

		this.glow = !!data.glow;
		this.layers = [];
		this.glowLayers = [];
		this.complex = ["spider", "robot"].includes(this.form);

		// most forms
		if (!this.complex) {
			let extraSettings: IExtraSettings = {
				new: this.new
			};
			if (data.noUFODome) extraSettings.noDome = true;
			const basicIcon = new IconPart(this.form, this.id, this.colors, this.glow, extraSettings);
			this.sprite.addChild(basicIcon.sprite);
			this.layers.push(basicIcon);
			this.glowLayers.push(basicIcon.sections.find(layer => layer.colorType == "g") as any);
		}

		// spider + robot
		else {
			const idlePosition = this.getAnimation(data.animation || "", data.animationForm).frames[0];
			idlePosition.forEach((position, index) => {
				position.name = iconData.robotAnimations.info[this.form].names[index];
				const part = new IconPart(this.form, this.id, this.colors, false, { part: position, skipGlow: true, new: this.new });
				positionPart(position, index, part.sprite, this.form, this.new);

				const glowPart = new IconPart(this.form, this.id, this.colors, true, { part: position, onlyGlow: true, new: this.new });
				positionPart(position, index, glowPart.sprite, this.form, this.new, true);
				glowPart.sprite.visible = this.glow;
				this.glowLayers.push(glowPart);

				this.layers.push(part);
				this.sprite.addChild(part.sprite);
			});

			const fullGlow = new PIXI.Container();
			this.glowLayers.forEach(layer => fullGlow.addChild(layer.sprite));
			this.sprite.addChildAt(fullGlow, 0);
			this.ease = new Ease.Ease({});
			this.animationSpeed = Math.abs(Number(data.animationSpeed) || 1);
			if (data.animation) this.setAnimation(data.animation, data.animationForm || "");
		}

		if (this.new) this.sprite.scale.set(2);

		this.app.stage.removeChildren();
		this.app.stage.addChild(this.sprite);
	}

	/**
	 * Get all the icon layers.
	 * @returns A list of all the icon layers.
	 */
	getAllLayers() {
		const allLayers: IconLayer[] = [];
		(this.complex ? this.glowLayers : []).concat(this.layers).forEach((part: IconPart) => part.sections.forEach(layer => allLayers.push(layer)));
		return allLayers;
	}

	/**
	 * Set the color of an icon layer.
	 * @param colorType The color type (primary, secondary, etc.).
	 * @param newColor The new color as a decimal value.
	 * @param extra Optional settings that come with setting the color.
	 */
	setColor(colorType: string, newColor: number, extra: IExtraSettings = {}) {
		const colorStr = String(colorType).toLowerCase();
		if (!colorType || !Object.keys(this.colors).includes(colorStr)) return;
		else this.colors[colorStr] = newColor;
		const newGlow = getGlowColor(this.colors);
		this.getAllLayers().forEach(layer => {
			if (colorType != "g" && layer.colorType == colorStr) layer.setColor(newColor);
			if (!extra.ignoreGlow && layer.colorType == "g") layer.setColor(newGlow);
		});
		if (!this.glow && colorStr == "1") {
			const shouldGlow = newColor == 0;
			this.glowLayers.forEach(layer => layer.sprite.visible = shouldGlow);
		}
	}

	/**
	 * Get the name of the form.
	 * @returns The name of the form.
	 */
	formName() {
		return formNames[this.form] || this.form;
	}

	/**
	 * Check if the glow is enabled.
	 * @returns The glow status of the player.
	 */
	isGlowing() {
		return this.glowLayers[0].sprite.visible;
	}

	/**
	 * Set the glow status.
	 * @toggle The toggle status of the glow.
	 */
	setGlow(toggle: boolean) {
		this.glow = !!toggle;
		this.glowLayers.forEach(layer => layer.sprite.visible = (this.colors["1"] == 0 || this.glow));
	}

	/**
	 * Get the current animation form of the robot.
	 * @param name The name of the robot.
	 * @param animForm The animation form of the robot.
	 * @returns The current animation form of the robot.
	 */
	getAnimation(name: string, animForm?: string) {
		const animationList = iconData.robotAnimations.animations[animForm || this.form];
		return animationList[name || "idle"] || animationList["idle"];
	}

	/**
	 * Set the current animation form of the robot.
	 * @param data The name of the robot.
	 * @param animForm The animation form of the robot.
	 */
	setAnimation(data: string, animForm: string) {
		const animData = this.getAnimation(data, animForm) || this.getAnimation("idle");
		this.ease.removeAll();
		this.animationFrame = 0;
		this.animationName = data;
		this.runAnimation(animData, data);
	}

	/**
	 * Run the icon's associated animation.
	 * @param animData The name of the icon.
	 * @param animName The name of the animation.
	 * @param duration The duration of the animation. Optional.
	 */
	runAnimation(animData: IAnimationObject, animName: string, duration?: number) {
		animData.frames[this.animationFrame].forEach((newPart: IPartForSpecialIcons, index: number) => {
			const section = this.layers[index];
			const glowSection = this.glowLayers[index];
			const truePosMultiplier = this.new ? positionMultiplier * 0.5 : positionMultiplier;
			if (!section) return;

			// gd is weird with negative rotations
			let realRot = newPart.rotation;
			if (realRot < -180) realRot += 360;

			const movementData = {
				x: newPart.pos[0] * truePosMultiplier,
				y: newPart.pos[1] * truePosMultiplier * -1,
				scaleX: newPart.scale[0],
				scaleY: newPart.scale[1],
				rotation: realRot * (Math.PI / 180) // radians
			};
			if (newPart.flipped[0]) movementData.scaleX *= -1;
			if (newPart.flipped[1]) movementData.scaleY *= -1;

			const bothSections = [section, glowSection];
			bothSections.forEach((section, sectionIndex) => {
				const easing = this.ease.add(section.sprite, movementData, { duration: duration || 1, ease: 'linear' });
				const continueAfterEase = animData.frames.length > 1 && sectionIndex == 0 && index == 0 && animName == this.animationName;
				if (continueAfterEase) easing.on('complete', () => {
					this.animationFrame++
					if (this.animationFrame >= animData.frames.length) {
						if (animData.info.loop) this.animationFrame = 0;
					}
					if (this.animationFrame < animData.frames.length) {
						this.runAnimation(animData, animName, !duration ? 1 : (animData.info.duration / (this.animationSpeed || 1)));
					}
				});
			});
		});
	}

	/**
	 * Find actual icon size by reading pixel data
	 * (otherwise there's whitespace and shit).
	 */
	autocrop() {
		if (this.new) this.sprite.scale.set(1)
		const spriteSize = [Math.round(this.sprite.width), Math.round(this.sprite.height)];
		const pixels = this.app.renderer.extract.pixels(this.sprite);;
		const xRange = [spriteSize[0], 0];
		const yRange = [spriteSize[1], 0];

		this.preCrop = {
			pos: [this.sprite.position.x, this.sprite.position.y],
			canvas: [this.app.renderer.width, this.app.renderer.height]
		};

		for (let i=3; i < pixels.length; i += 4) {
			const alpha = pixels[i];
			const realIndex = (i-3) / 4;
			const pos = [realIndex % spriteSize[0], Math.floor(realIndex / spriteSize[0])];

			if (alpha > 10) { // if pixel is not blank...
				if (pos[0] < xRange[0]) xRange[0] = pos[0];      // if x pos is < the lowest x pos so far
				else if (pos[0] > xRange[1]) xRange[1] = pos[0]; // if x pos is > the highest x pos so far
				if (pos[1] < yRange[0]) yRange[0] = pos[1];      // if y pos is < the lowest y pos so far
				else if (pos[1] > yRange[1]) yRange[1] = pos[1]; // if y pos is > the highest y pos so far
			}
		}

		// this took hours to figure out. i fucking hate my life
		xRange[1]++;
		yRange[1]++;

		const realWidth = xRange[1] - xRange[0];
		const realHeight = yRange[1] - yRange[0];

		this.app.renderer.resize(realWidth, realHeight);
		const bounds = this.sprite.getBounds();
		this.sprite.position.x -= bounds.x;
		this.sprite.position.y -= bounds.y;

		this.sprite.position.x += (spriteSize[0] - xRange[1]) - xRange[0];
	}

	/**
	 * Revert the crop (by re-adding whitespace and shit).
	 */
	revertCrop() {
		this.app.renderer.resize(...this.preCrop.canvas);
		this.sprite.position.set(...this.preCrop.pos);
		if (this.new) this.sprite.scale.set(2);
	}

	/**
	 * Convert the icon image to base64.
	 * @param dataType The data type of the image.
	 * @returns The base64-encoded image.
	 */
	toDataURL(dataType = "image/png") {
		this.autocrop();
		this.app.renderer.render(this.app.stage);
		const b64data = this.app.view.toDataURL!(dataType);
		this.revertCrop();
		return b64data;
	}

	/**
	 * Export the icon image as PNG.
	 */
	pngExport() {
		const b64data = this.toDataURL();
		const downloader = document.createElement('a');
		downloader.href = b64data;
		downloader.setAttribute("download", `${this.formName()}_${this.id}.png`);
		document.body.appendChild(downloader);
		downloader.click();
		document.body.removeChild(downloader);
	}

	/**
	 * Copy the icon image to the clipboard.
	 */
	copyToClipboard() {
		this.autocrop();
		this.app.renderer.render(this.app.stage);
		this.app.view.toBlob!(blob => {
			if (blob) {
				const item = new ClipboardItem({ "image/png": blob });
				navigator.clipboard.write([item]);
			}
		});
		this.revertCrop();
	}

	/**
	 * Export the image as a layered Photoshop document.
	 */
	psdExport() {
		if (typeof agPsd === "undefined") throw new Error("ag-psd not imported!");
		const glowing = this.isGlowing();
		this.setGlow(true);

		const psd: agPsd.Psd = {
			width: this.app.stage.width,
			height: this.app.stage.height,
			children: []
		};
		const allLayers = this.getAllLayers();
		const renderer = this.app.renderer;
		const complex = this.complex;

		function addPSDLayer(layer: IconLayer, parent: IconPart, sprite: PIXI.Container) {
			allLayers.forEach(currentLayer => currentLayer.sprite.alpha = 0);
			layer.sprite.alpha = 255;

			const layerChild: agPsd.Layer = {
				name: layer.colorName,
				canvas: renderer.extract.canvas(sprite) as HTMLCanvasElement
			};
			if (layer.colorType == "g") {
				if (parent.part) layerChild.name = parent.part.name + " glow";
				else layerChild.blendMode = "linear dodge";
				if (!complex && !glowing) layerChild.hidden = true;
			}
			return layerChild;
		}

		this.layers.forEach(currentLayer => {
			const partName = currentLayer.part ? (currentLayer.part.name || "Icon") : "Icon";
			const folder = {
				name: partName,
				children: currentLayer.sections.map(layer => addPSDLayer(layer, currentLayer, this.sprite)),
				opened: true
			};
			psd.children!.push(folder);
		});

		if (complex) {
			const glowFolder: agPsd.Layer = {
				name: "Glow",
				children: this.glowLayers.map(currentLayer => addPSDLayer(currentLayer.sections[0], currentLayer, this.sprite)),
				opened: true,
				hidden: !glowing
			};
			psd.children!.unshift(glowFolder);
		}

		allLayers.forEach(currentLayer => currentLayer.sprite.alpha = 255);
		const output = agPsd.writePsd(psd);
		const blob = new Blob([output]);
		const downloader = document.createElement('a');
		downloader.href = URL.createObjectURL(blob);
		downloader.setAttribute("download", `${this.formName()}_${this.id}.psd`);
		document.body.appendChild(downloader);
		downloader.click();
		document.body.removeChild(downloader);
		this.setGlow(glowing);
	}
}

/**
 * Class for a part of the icon.
 */
class IconPart {
	sprite: PIXI.Container;
	sections: IconLayer[];
	part: IPartForSpecialIcons;

	/**
	 * @param form The form of the icon.
	 * @param id The ID of the icon.
	 * @param colors The colors the icon has.
	 * @param glow The glow status of the icon.
	 * @param misc Additional settings.
	 */
	constructor(form: string, id: number, colors: IIconColor, glow: boolean, misc: Record<string, any> = {}) {
		if (colors["1"] == 0 && !misc.skipGlow) glow = true; // add glow if p1 is black

		const iconPath = `${form}_${padZero(id)}`;
		const partString = misc.part ? "_" + padZero(misc.part.part) : "";
		const sections: IIconPartSection = {};
		if (misc.part) this.part = misc.part;

		this.sprite = new PIXI.Container();
		this.sections = [];

		if (!misc.skipGlow) {
			const glowCol = getGlowColor(colors);
			sections.glow = new IconLayer(`${iconPath}${partString}_glow_001.png`, glowCol, "g", misc.new);
			if (!glow) sections.glow.sprite.visible = false;
		}

		if (!misc.onlyGlow) {
			if (form == "bird" && !misc.noDome) { // ufo top
				sections.ufo = new IconLayer(`${iconPath}_3_001.png`, WHITE, "u", misc.new);
			}

			sections.col1 = new IconLayer(`${iconPath}${partString}_001.png`, colors["1"], "1", misc.new);
			sections.col2 = new IconLayer(`${iconPath}${partString}_2_001.png`, colors["2"], "2", misc.new);

			const extraPath = `${iconPath}${partString}_extra_001.png`;
			if (iconData.gameSheet[extraPath]) {
				sections.white = new IconLayer(extraPath, colors["w"], "w", misc.new);
			}
		}

		const layerOrder = ["glow", "ufo", "col2", "col1", "white"]
			.map((orderItem: "glow" | "ufo" | "col1" | "col2" | "white") => sections[orderItem])
			.filter(orderItem => orderItem) as IconLayer[];
		layerOrder.forEach(orderItem => {
			this.sections.push(orderItem);
			this.sprite.addChild(orderItem.sprite);
		});
	}
}

/**
 * Class for a single layer of an icon.
 */
class IconLayer {
	offsets: { spriteOffset: number[] };
	sprite: PIXI.Sprite;
	colorType: string;
	colorName: string;
	angleOffset: number;
	color: number;

	/**
	 * @param path The path of the icon layer.
	 * @param color The color of the icon layer, as a string or a number.
	 * @param colorType The color type of the icon layer.
	 * @param isNew If the icon is released in 2.2.
	 */
	constructor(path: string, color: string | number, colorType: string, isNew: boolean) {
		const loadedTexture = isNew ? loadedNewIcons[path] : loadedOldIcons[path];
		this.offsets = iconData.gameSheet[path] || { spriteOffset: [0, 0] };
		this.sprite = new PIXI.Sprite(loadedTexture || PIXI.Texture.EMPTY);

		this.colorType = colorType;
		this.colorName = colorNames[colorType];
		this.setColor(color);

		this.sprite.position.x += this.offsets.spriteOffset[0];
		this.sprite.position.y -= this.offsets.spriteOffset[1];


		if ("textureRotated" in this.offsets && this.offsets.textureRotated) {
			this.sprite.angle = -90;
		}
		this.angleOffset = this.sprite.angle;

		this.sprite.anchor.set(0.5);
	}

	/**
	 * Set the color of the layer.
	 * @param color The color as a string or a number.
	 */
	setColor(color: string | number) {
		this.color = validNum(color, WHITE);
		this.sprite.tint = this.color;
	}
}