declare module PIXI {
	class Loader {
		/**
		 * @param baseUrl - The base url for all resources loaded by this loader.
		 * @param concurrency - The number of resources to load concurrently.
		 */
		constructor(baseUrl?: string, concurrency?: string);
		/**
		 * A premade instance of the loader that can be used to load resources.
		 */
		public static get shared(): Loader;
	}
	/**
	 * A filter is a special shader that applies post-processing effects to an input texture and writes into an output
	 * render-target.
	 *
	 * Example of the
	 * BlurFilter.
	 *
	 * ### Usage
	 * Filters can be applied to any DisplayObject or Container.
	 * PixiJS' `FilterSystem` renders the container into temporary Framebuffer,
	 * then filter renders it to the screen.
	 * Multiple filters can be added to the `filters` array property and stacked on each other.
	 *
	 * ```
	 * const filter = new PIXI.Filter(myShaderVert, myShaderFrag, { myUniform: 0.5 });
	 * const container = new PIXI.Container();
	 * container.filters = [filter];
	 * ```
	 *
	 * ### Previous Version Differences
	 *
	 * In PixiJS **v3**, a filter was always applied to _whole screen_.
	 *
	 * In PixiJS **v4**, a filter can be applied _only part of the screen_.
	 * Developers had to create a set of uniforms to deal with coordinates.
	 *
	 * In PixiJS **v5** combines _both approaches_.
	 * Developers can use normal coordinates of v3 and then allow filter to use partial Framebuffers,
	 * bringing those extra uniforms into account.
	 *
	 * Also be aware that we have changed default vertex shader, please consult
	 * Wiki.
	 *
	 * ### Frames
	 *
	 * The following table summarizes the coordinate spaces used in the filtering pipeline:
	 *
	 * <table>
	 * <thead>
	 *   <tr>
	 *     <th>Coordinate Space</th>
	 *     <th>Description</th>
	 *   </tr>
	 * </thead>
	 * <tbody>
	 *   <tr>
	 *     <td>Texture Coordinates</td>
	 *     <td>
	 *         The texture (or UV) coordinates in the input base-texture's space. These are normalized into the (0,1) range along
	 *         both axes.
	 *     </td>
	 *   </tr>
	 *   <tr>
	 *     <td>World Space</td>
	 *     <td>
	 *         A point in the same space as the world bounds of any display-object (i.e. in the scene graph's space).
	 *     </td>
	 *   </tr>
	 *   <tr>
	 *     <td>Physical Pixels</td>
	 *     <td>
	 *         This is base-texture's space with the origin on the top-left. You can calculate these by multiplying the texture
	 *         coordinates by the dimensions of the texture.
	 *     </td>
	 *   </tr>
	 * </tbody>
	 * </table>
	 *
	 * ### Built-in Uniforms
	 *
	 * PixiJS viewport uses screen (CSS) coordinates, `(0, 0, renderer.screen.width, renderer.screen.height)`,
	 * and `projectionMatrix` uniform maps it to the gl viewport.
	 *
	 * **uSampler**
	 *
	 * The most important uniform is the input texture that container was rendered into.
	 * _Important note: as with all Framebuffers in PixiJS, both input and output are
	 * premultiplied by alpha._
	 *
	 * By default, input normalized coordinates are passed to fragment shader with `vTextureCoord`.
	 * Use it to sample the input.
	 *
	 * ```
	 * const fragment = `
	 * varying vec2 vTextureCoord;
	 * uniform sampler2D uSampler;
	 * void main(void)
	 * {
	 *    gl_FragColor = texture2D(uSampler, vTextureCoord);
	 * }
	 * `;
	 *
	 * const myFilter = new PIXI.Filter(null, fragment);
	 * ```
	 *
	 * This filter is just one uniform less than AlphaFilter.
	 *
	 * **outputFrame**
	 *
	 * The `outputFrame` holds the rectangle where filter is applied in screen (CSS) coordinates.
	 * It's the same as `renderer.screen` for a fullscreen filter.
	 * Only a part of  `outputFrame.zw` size of temporary Framebuffer is used,
	 * `(0, 0, outputFrame.width, outputFrame.height)`,
	 *
	 * Filters uses this quad to normalized (0-1) space, its passed into `aVertexPosition` attribute.
	 * To calculate vertex position in screen space using normalized (0-1) space:
	 *
	 * ```
	 * vec4 filterVertexPosition( void )
	 * {
	 *     vec2 position = aVertexPosition * max(outputFrame.zw, vec2(0.)) + outputFrame.xy;
	 *     return vec4((projectionMatrix * vec3(position, 1.0)).xy, 0.0, 1.0);
	 * }
	 * ```
	 *
	 * **inputSize**
	 *
	 * Temporary framebuffer is different, it can be either the size of screen, either power-of-two.
	 * The `inputSize.xy` are size of temporary framebuffer that holds input.
	 * The `inputSize.zw` is inverted, it's a shortcut to evade division inside the shader.
	 *
	 * Set `inputSize.xy = outputFrame.zw` for a fullscreen filter.
	 *
	 * To calculate input normalized coordinate, you have to map it to filter normalized space.
	 * Multiply by `outputFrame.zw` to get input coordinate.
	 * Divide by `inputSize.xy` to get input normalized coordinate.
	 *
	 * ```
	 * vec2 filterTextureCoord( void )
	 * {
	 *     return aVertexPosition * (outputFrame.zw * inputSize.zw); // same as /inputSize.xy
	 * }
	 * ```
	 * **resolution**
	 *
	 * The `resolution` is the ratio of screen (CSS) pixels to real pixels.
	 *
	 * **inputPixel**
	 *
	 * `inputPixel.xy` is the size of framebuffer in real pixels, same as `inputSize.xy * resolution`
	 * `inputPixel.zw` is inverted `inputPixel.xy`.
	 *
	 * It's handy for filters that use neighbour pixels, like FXAAFilter.
	 *
	 * **inputClamp**
	 *
	 * If you try to get info from outside of used part of Framebuffer - you'll get undefined behaviour.
	 * For displacements, coordinates has to be clamped.
	 *
	 * The `inputClamp.xy` is left-top pixel center, you may ignore it, because we use left-top part of Framebuffer
	 * `inputClamp.zw` is bottom-right pixel center.
	 *
	 * ```
	 * vec4 color = texture2D(uSampler, clamp(modifiedTextureCoord, inputClamp.xy, inputClamp.zw))
	 * ```
	 * OR
	 * ```
	 * vec4 color = texture2D(uSampler, min(modifigedTextureCoord, inputClamp.zw))
	 * ```
	 *
	 * ### Additional Information
	 *
	 * Complete documentation on Filter usage is located in the
	 * Wiki.
	 *
	 * Since PixiJS only had a handful of built-in filters, additional filters can be downloaded
	 * here from the PixiJS Filters repository.
	 *
	 * @class
	 * @memberof PIXI
	 * @extends PIXI.Shader
	 */
	class Filter {
	}

	namespace filters {
		/**
		 * The ColorMatrixFilter class lets you apply a 5x4 matrix transformation on the RGBA
		 * color and alpha values of every pixel on your displayObject to produce a result
		 * with a new set of RGBA color and alpha values. It's pretty powerful!
		 *
		 * ```js
		 *  let colorMatrix = new PIXI.filters.ColorMatrixFilter();
		 *  container.filters = [colorMatrix];
		 *  colorMatrix.contrast(2);
		 * ```
		 * @author Clément Chenebault <clement@goodboydigital.com>
		 * @class
		 * @extends PIXI.Filter
		 * @memberof PIXI.filters
		 */
		class ColorMatrixFilter extends Filter {
			/**
			 * The opacity value to use when mixing the original and resultant colors.
			 *
			 * When the value is 0, the original color is used without modification.
			 * When the value is 1, the result color is used.
			 * When in the range (0, 1) the color is interpolated between the original and result by this amount.
			 *
			 * @member {number}
			 * @default 1
			 */
			get alpha(): number;
			set alpha(value: number);
			/**
			 * Adjusts brightness
			 *
			 * @param {number} b - value of the brigthness (0-1, where 0 is black)
			 * @param {boolean} multiply - if true, current matrix and matrix are multiplied. If false,
			 *  just set the current matrix with @param matrix
			 */
			public brightness(b: number, multiply: boolean): void;
		}
	}
	/**
	 * Base resource class for textures that manages validation and uploading, depending on its type.
	 *
	 * Uploading of a base texture to the GPU is required.
	 *
	 * @class
	 * @memberof PIXI
	 */
	abstract class Resource {
		constructor(width?: number, height?: number);
	}
	/**
	 * Rectangle object is an area defined by its position, as indicated by its top-left corner
	 * point (x, y) and by its width and its height.
	 *
	 * @class
	 * @memberof PIXI
	 */
	class Rectangle {
		constructor(x?: number, y?: number, width?: number, height?: number);
	}
	/**
	 * Resource type for HTMLCanvasElement.
	 * @class
	 * @extends PIXI.BaseImageResource
	 * @memberof PIXI
	 */
	class CanvasResource {
		constructor(source: HTMLCanvasElement);
	}
	/**
	 * A Texture stores the information that represents an image.
	 * All textures have a base texture, which contains information about the source.
	 * Therefore you can have many textures all using a single BaseTexture
	 *
	 * @class
	 * @extends PIXI.utils.EventEmitter
	 * @memberof PIXI
	 * @typeParam R - The BaseTexture's Resource type.
	 * @typeParam RO - The options for constructing resource.
	 */
	class BaseTexture<R extends Resource = Resource, RO = any> {

	}
	/**
	 * A texture stores the information that represents an image or part of an image.
	 *
	 * It cannot be added to the display list directly; instead use it as the texture for a Sprite.
	 * If no frame is provided for a texture, then the whole image is used.
	 *
	 * You can directly create a texture from an image and then reuse it multiple times like this :
	 *
	 * ```js
	 * let texture = PIXI.Texture.from('assets/image.png');
	 * let sprite1 = new PIXI.Sprite(texture);
	 * let sprite2 = new PIXI.Sprite(texture);
	 * ```
	 *
	 * If you didnt pass the texture frame to constructor, it enables `noFrame` mode:
	 * it subscribes on baseTexture events, it automatically resizes at the same time as baseTexture.
	 *
	 * Textures made from SVGs, loaded or not, cannot be used before the file finishes processing.
	 * You can check for this by checking the sprite's _textureID property.
	 * ```js
	 * var texture = PIXI.Texture.from('assets/image.svg');
	 * var sprite1 = new PIXI.Sprite(texture);
	 * //sprite1._textureID should not be undefined if the texture has finished processing the SVG file
	 * ```
	 * You can use a ticker or rAF to ensure your sprites load the finished textures after processing. See issue #3068.
	 *
	 * @class
	 * @extends PIXI.utils.EventEmitter
	 * @memberof PIXI
	 * @typeParam R - The BaseTexture's Resource type.
	 */
	class Texture<R extends Resource = Resource> {
		constructor(baseTexture: BaseTexture<R>, frame?: Rectangle,
			orig?: Rectangle, trim?: Rectangle, rotate?: number, anchor?: any);
		static readonly EMPTY: Texture<CanvasResource>;
		static readonly WHITE: Texture<CanvasResource>;
	}
	/**
	 * The base class for all objects that are rendered on the screen.
	 *
	 * This is an abstract class and can not be used on its own; rather it should be extended.
	 *
	 * ## Display objects implemented in PixiJS
	 *
	 * | Display Object                  | Description                                                           |
	 * | ------------------------------- | --------------------------------------------------------------------- |
	 * | PIXI.Container          | Adds support for `children` to DisplayObject                          |
	 * | PIXI.Graphics           | Shape-drawing display object similar to the Canvas API                |
	 * | PIXI.Sprite             | Draws textures (i.e. images)                                          |
	 * | PIXI.Text               | Draws text using the Canvas API internally                            |
	 * | PIXI.BitmapText         | More scaleable solution for text rendering, reusing glyph textures    |
	 * | PIXI.TilingSprite       | Draws textures/images in a tiled fashion                              |
	 * | PIXI.AnimatedSprite     | Draws an animation of multiple images                                 |
	 * | PIXI.Mesh               | Provides a lower-level API for drawing meshes with custom data        |
	 * | PIXI.NineSlicePlane     | Mesh-related                                                          |
	 * | PIXI.SimpleMesh         | v4-compatibile mesh                                                   |
	 * | PIXI.SimplePlane        | Mesh-related                                                          |
	 * | PIXI.SimpleRope         | Mesh-related                                                          |
	 *
	 * ## Transforms
	 *
	 * The transform of a display object describes the projection from its
	 * local coordinate space to its parent's local coordinate space. The following properties are derived
	 * from the transform:
	 *
	 * <table>
	 *   <thead>
	 *     <tr>
	 *       <th>Property</th>
	 *       <th>Description</th>
	 *     </tr>
	 *   </thead>
	 *   <tbody>
	 *     <tr>
	 *       <td>pivot</td>
	 *       <td>
	 *         Invariant under rotation, scaling, and skewing. The projection of into the parent's space of the pivot
	 *         is equal to position, regardless of the other three transformations. In other words, It is the center of
	 *         rotation, scaling, and skewing.
	 *       </td>
	 *     </tr>
	 *     <tr>
	 *       <td>position</td>
	 *       <td>
	 *         Translation. This is the position of the pivot in the parent's local
	 *         space. The default value of the pivot is the origin (0,0). If the top-left corner of your display object
	 *         is (0,0) in its local space, then the position will be its top-left corner in the parent's local space.
	 *       </td>
	 *     </tr>
	 *     <tr>
	 *       <td>scale</td>
	 *       <td>
	 *         Scaling. This will stretch (or compress) the display object's projection. The scale factors are along the
	 *         local coordinate axes. In other words, the display object is scaled before rotated or skewed. The center
	 *         of scaling is the pivot.
	 *       </td>
	 *     </tr>
	 *     <tr>
	 *       <td>rotation</td>
	 *       <td>
	 *          Rotation. This will rotate the display object's projection by this angle (in radians).
	 *       </td>
	 *     </tr>
	 *     <tr>
	 *       <td>skew</td>
	 *       <td>
	 *         <p>Skewing. This can be used to deform a rectangular display object into a parallelogram.</p>
	 *         <p>
	 *         In PixiJS, skew has a slightly different behaviour than the conventional meaning. It can be
	 *         thought of the net rotation applied to the coordinate axes (separately). For example, if "skew.x" is
	 *         ⍺ and "skew.y" is β, then the line x = 0 will be rotated by ⍺ (y = -x*cot⍺) and the line y = 0 will be
	 *         rotated by β (y = x*tanβ). A line y = x*tanϴ (i.e. a line at angle ϴ to the x-axis in local-space) will
	 *         be rotated by an angle between ⍺ and β.
	 *         </p>
	 *         <p>
	 *         It can be observed that if skew is applied equally to both axes, then it will be equivalent to applying
	 *         a rotation. Indeed, if "skew.x" = -ϴ and "skew.y" = ϴ, it will produce an equivalent of "rotation" = ϴ.
	 *         </p>
	 *         <p>
	 *         Another quite interesting observation is that "skew.x", "skew.y", rotation are communtative operations. Indeed,
	 *         because rotation is essentially a careful combination of the two.
	 *         </p>
	 *       </td>
	 *     </tr>
	 *     <tr>
	 *       <td>angle</td>
	 *       <td>Rotation. This is an alias for rotation, but in degrees.</td>
	 *     </tr>
	 *     <tr>
	 *       <td>x</td>
	 *       <td>Translation. This is an alias for position.x!</td>
	 *     </tr>
	 *     <tr>
	 *       <td>y</td>
	 *       <td>Translation. This is an alias for position.y!</td>
	 *     </tr>
	 *     <tr>
	 *       <td>width</td>
	 *       <td>
	 *         Implemented in Container. Scaling. The width property calculates scale.x by dividing
	 *         the "requested" width by the local bounding box width. It is indirectly an abstraction over scale.x, and there
	 *         is no concept of user-defined width.
	 *       </td>
	 *     </tr>
	 *     <tr>
	 *       <td>height</td>
	 *       <td>
	 *         Implemented in Container. Scaling. The height property calculates scale.y by dividing
	 *         the "requested" height by the local bounding box height. It is indirectly an abstraction over scale.y, and there
	 *         is no concept of user-defined height.
	 *       </td>
	 *     </tr>
	 *   </tbody>
	 * </table>
	 *
	 * ## Bounds
	 *
	 * The bounds of a display object is defined by the minimum axis-aligned rectangle in world space that can fit
	 * around it. The abstract `calculateBounds` method is responsible for providing it (and it should use the
	 * `worldTransform` to calculate in world space).
	 *
	 * There are a few additional types of bounding boxes:
	 *
	 * | Bounds                | Description                                                                              |
	 * | --------------------- | ---------------------------------------------------------------------------------------- |
	 * | World Bounds          | This is synonymous is the regular bounds described above. See `getBounds()`.             |
	 * | Local Bounds          | This the axis-aligned bounding box in the parent's local space. See `getLocalBounds()`.  |
	 * | Render Bounds         | The bounds, but including extra rendering effects like filter padding.                   |
	 * | Projected Bounds      | The bounds of the projected display object onto the screen. Usually equals world bounds. |
	 * | Relative Bounds       | The bounds of a display object when projected onto a ancestor's (or parent's) space.     |
	 * | Natural Bounds        | The bounds of an object in its own local space (not parent's space, like in local bounds)|
	 * | Content Bounds        | The natural bounds when excluding all children of a `Container`.                         |
	 *
	 * ### calculateBounds
	 *
	 * Container already implements `calculateBounds` in a manner that includes children.
	 *
	 * But for a non-Container display object, the `calculateBounds` method must be overridden in order for `getBounds` and
	 * `getLocalBounds` to work. This method must write the bounds into `this._bounds`.
	 *
	 * Generally, the following technique works for most simple cases: take the list of points
	 * forming the "hull" of the object (i.e. outline of the object's shape), and then add them
	 * using PIXI.Bounds#addPointMatrix.
	 *
	 * ```js
	 * calculateBounds(): void
	 * {
	 *     const points = [...];
	 *
	 *     for (let i = 0, j = points.length; i < j; i++)
	 *     {
	 *         this._bounds.addPointMatrix(this.worldTransform, points[i]);
	 *     }
	 * }
	 * ```
	 *
	 * You can optimize this for a large number of points by using PIXI.Bounds#addVerticesMatrix to pass them
	 * in one array together.
	 *
	 * ## Alpha
	 *
	 * This alpha sets a display object's **relative opacity** w.r.t its parent. For example, if the alpha of a display
	 * object is 0.5 and its parent's alpha is 0.5, then it will be rendered with 25% opacity (assuming alpha is not
	 * applied on any ancestor further up the chain).
	 *
	 * The alpha with which the display object will be rendered is called the worldAlpha.
	 *
	 * ## Renderable vs Visible
	 *
	 * The `renderable` and `visible` properties can be used to prevent a display object from being rendered to the
	 * screen. However, there is a subtle difference between the two. When using `renderable`, the transforms  of the display
	 * object (and its children subtree) will continue to be calculated. When using `visible`, the transforms will not
	 * be calculated.
	 *
	 * It is recommended that applications use the `renderable` property for culling. See
	 * @pixi-essentials/cull or
	 * pixi-cull for more details.
	 *
	 * Otherwise, to prevent an object from rendering in the general-purpose sense - `visible` is the property to use. This
	 * one is also better in terms of performance.
	 *
	 * @class
	 * @extends PIXI.utils.EventEmitter
	 * @memberof PIXI
	 */
	abstract class DisplayObject {}
	/**
	 * Container is a general-purpose display object that holds children. It also adds built-in support for advanced
	 * rendering features like masking and filtering.
	 *
	 * It is the base class of all display objects that act as a container for other objects, including Graphics
	 * and Sprite.
	 *
	 * ```js
	 * import { BlurFilter } from '@pixi/filter-blur';
	 * import { Container } from '@pixi/display';
	 * import { Graphics } from '@pixi/graphics';
	 * import { Sprite } from '@pixi/sprite';
	 *
	 * let container = new Container();
	 * let sprite = Sprite.from("https://s3-us-west-2.amazonaws.com/s.cdpn.io/693612/IaUrttj.png");
	 *
	 * sprite.width = 512;
	 * sprite.height = 512;
	 *
	 * // Adds a sprite as a child to this container. As a result, the sprite will be rendered whenever the container
	 * // is rendered.
	 * container.addChild(sprite);
	 *
	 * // Blurs whatever is rendered by the container
	 * container.filters = [new BlurFilter()];
	 *
	 * // Only the contents within a circle at the center should be rendered onto the screen.
	 * container.mask = new Graphics()
	 *  .beginFill(0xffffff)
	 *  .drawCircle(sprite.width / 2, sprite.height / 2, Math.min(sprite.width, sprite.height) / 2)
	 *  .endFill();
	 * ```
	 *
	 * @class
	 * @extends PIXI.DisplayObject
	 * @memberof PIXI
	 */
	class Container extends DisplayObject {
		visible: boolean;
		constructor();
		addChild<T extends DisplayObject[]>(...children: T): T[0]
	}
	/**
	 * The Sprite object is the base for all textured objects that are rendered to the screen
	 *
	 * A sprite can be created directly from an image like this:
	 *
	 * ```js
	 * let sprite = PIXI.Sprite.from('assets/image.png');
	 * ```
	 *
	 * The more efficient way to create sprites is using a PIXI.Spritesheet,
	 * as swapping base textures when rendering to the screen is inefficient.
	 *
	 * ```js
	 * PIXI.Loader.shared.add("assets/spritesheet.json").load(setup);
	 *
	 * function setup() {
	 *   let sheet = PIXI.Loader.shared.resources["assets/spritesheet.json"].spritesheet;
	 *   let sprite = new PIXI.Sprite(sheet.textures["image.png"]);
	 *   ...
	 * }
	 * ```
	 *
	 * @class
	 * @extends PIXI.Container
	 * @memberof PIXI
	 */
	class Sprite extends Container {
		constructor(texture?: Texture);
	}
    interface IApplicationOptions {}
    /**
     * Convenience class to create a new PIXI application.
     *
     * This class automatically creates the renderer, ticker and root container.
     *
     * @example
     * // Create the application
     * const app = new PIXI.Application();
     *
     * // Add the view to the DOM
     * document.body.appendChild(app.view);
     *
     * // ex, add display objects
     * app.stage.addChild(PIXI.Sprite.from('something.png'));
     *
     * @class
     * @memberof PIXI
     */
    class Application {
        constructor(options?: IApplicationOptions);
    }
}