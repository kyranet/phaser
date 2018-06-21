/**
 * @author       Richard Davey <rich@photonstorm.com>
 * @copyright    2018 Photon Storm Ltd.
 * @license      {@link https://github.com/photonstorm/phaser/blob/master/license.txt|MIT License}
 */

var Clamp = require('../../../math/Clamp');
var Class = require('../../../utils/Class');
var Vector2 = require('../../../math/Vector2');
var EaseMap = require('../../../math/easing/EaseMap');

/**
 * @classdesc
 * A Camera Pan effect.
 *
 * This effect will scroll the Camera so that the center of its viewport finishes at the given destination,
 * over the duration and with the ease specified.
 *
 * Only the camera scroll is moved. None of the objects it is displaying are impacted, i.e. their positions do
 * not change.
 *
 * The effect will dispatch several events on the Camera itself and you can also specify an `onUpdate` callback,
 * which is invoked each frame for the duration of the effect if required.
 *
 * @class Pan
 * @memberOf Phaser.Cameras.Scene2D.Effects
 * @constructor
 * @since 3.11.0
 *
 * @param {Phaser.Cameras.Scene2D.Camera} camera - The camera this effect is acting upon.
 */
var Pan = new Class({

    initialize:

    function Pan (camera)
    {
        /**
         * The Camera this effect belongs to.
         *
         * @name Phaser.Cameras.Scene2D.Effects.Pan#camera
         * @type {Phaser.Cameras.Scene2D.Camera}
         * @readOnly
         * @since 3.11.0
         */
        this.camera = camera;

        /**
         * Is this effect actively running?
         *
         * @name Phaser.Cameras.Scene2D.Effects.Pan#isRunning
         * @type {boolean}
         * @readOnly
         * @default false
         * @since 3.11.0
         */
        this.isRunning = false;

        /**
         * The duration of the effect, in milliseconds.
         *
         * @name Phaser.Cameras.Scene2D.Effects.Pan#duration
         * @type {integer}
         * @readOnly
         * @default 0
         * @since 3.11.0
         */
        this.duration = 0;

        /**
         * The starting scroll coordinates to pan the camera from.
         * 
         * @name Phaser.Cameras.Scene2D.Effects.Pan#source
         * @type {Phaser.Math.Vector2}
         * @since 3.11.0
         */
        this.source = new Vector2();

        /**
         * The destination scroll coordinates to pan the camera to.
         * 
         * @name Phaser.Cameras.Scene2D.Effects.Pan#destination
         * @type {Phaser.Math.Vector2}
         * @since 3.11.0
         */
        this.destination = new Vector2();

        /**
         * The ease function to use during the pan.
         * 
         * @name Phaser.Cameras.Scene2D.Effects.Pan#ease
         * @type {function}
         * @since 3.11.0
         */
        this.ease;

        /**
         * If this effect is running this holds the current percentage of the progress, a value between 0 and 1.
         *
         * @name Phaser.Cameras.Scene2D.Effects.Pan#progress
         * @type {float}
         * @since 3.11.0
         */
        this.progress = 0;

        /**
         * Effect elapsed timer.
         *
         * @name Phaser.Cameras.Scene2D.Effects.Pan#_elapsed
         * @type {number}
         * @private
         * @since 3.11.0
         */
        this._elapsed = 0;

        /**
         * @callback CameraPanCallback
         *
         * @param {Phaser.Cameras.Scene2D.Camera} camera - The camera on which the effect is running.
         * @param {float} progress - The progress of the effect. A value between 0 and 1.
         * @param {number} x - The Camera's new scrollX coordinate.
         * @param {number} y - The Camera's new scrollY coordinate.
         */

        /**
         * This callback is invoked every frame for the duration of the effect.
         *
         * @name Phaser.Cameras.Scene2D.Effects.Pan#_onUpdate
         * @type {?CameraPanCallback}
         * @private
         * @default null
         * @since 3.11.0
         */
        this._onUpdate;

        /**
         * On Complete callback scope.
         *
         * @name Phaser.Cameras.Scene2D.Effects.Pan#_onUpdateScope
         * @type {any}
         * @private
         * @since 3.11.0
         */
        this._onUpdateScope;
    },

    /**
     * This event is fired when the pan effect begins to run on a camera.
     *
     * @event CameraPanStartEvent
     * @param {Phaser.Cameras.Scene2D.Camera} camera - The camera that the effect began on.
     * @param {Phaser.Cameras.Scene2D.Effects.Pan} effect - A reference to the effect instance.
     * @param {integer} duration - The duration of the effect.
     * @param {number} x - The destination scroll x coordinate.
     * @param {number} y - The destination scroll y coordinate.
     */

    /**
     * This event is fired when the pan effect completes.
     *
     * @event CameraPanCompleteEvent
     * @param {Phaser.Cameras.Scene2D.Camera} camera - The camera that the effect began on.
     * @param {Phaser.Cameras.Scene2D.Effects.Pan} effect - A reference to the effect instance.
     */

    /**
     * This effect will scroll the Camera so that the center of its viewport finishes at the given destination,
     * over the duration and with the ease specified.
     *
     * @method Phaser.Cameras.Scene2D.Effects.Pan#start
     * @fires CameraPanStartEvent
     * @fires CameraPanCompleteEvent
     * @since 3.11.0
     *
     * @param {number} x - The destination x coordinate to scroll the center of the Camera viewport to.
     * @param {number} y - The destination y coordinate to scroll the center of the Camera viewport to.
     * @param {integer} [duration=1000] - The duration of the effect in milliseconds.
     * @param {(string|function)} [ease='Linear'] - The ease to use for the pan. Can be any of the Phaser Easing constants or a custom function.
     * @param {boolean} [force=false] - Force the shake effect to start immediately, even if already running.
     * @param {CameraPanCallback} [callback] - This callback will be invoked every frame for the duration of the effect.
     * It is sent four arguments: A reference to the camera, a progress amount between 0 and 1 indicating how complete the effect is,
     * the current camera scroll x coordinate and the current camera scroll y coordinate.
     * @param {any} [context] - The context in which the callback is invoked. Defaults to the Scene to which the Camera belongs.
     *
     * @return {Phaser.Cameras.Scene2D.Camera} The Camera on which the effect was started.
     */
    start: function (x, y, duration, ease, force, callback, context)
    {
        if (duration === undefined) { duration = 1000; }
        if (ease === undefined) { ease = EaseMap.Linear; }
        if (force === undefined) { force = false; }
        if (callback === undefined) { callback = null; }
        if (context === undefined) { context = this.camera.scene; }

        var cam = this.camera;

        if (!force && this.isRunning)
        {
            return cam;
        }

        this.isRunning = true;
        this.duration = duration;
        this.progress = 0;

        //  Starting from
        this.source.set(cam.scrollX, cam.scrollY);

        //  Panning to
        cam.getScroll(x, y, this.destination);

        //  Using this ease
        if (typeof ease === 'string' && EaseMap.hasOwnProperty(ease))
        {
            this.ease = EaseMap[ease];
        }
        else if (typeof ease === 'function')
        {
            this.ease = ease;
        }

        this._elapsed = 0;

        this._onUpdate = callback;
        this._onUpdateScope = context;

        this.camera.emit('camerapanstart', this.camera, this, duration, x, y);

        return cam;
    },

    /**
     * The main update loop for this effect. Called automatically by the Camera.
     *
     * @method Phaser.Cameras.Scene2D.Effects.Pan#update
     * @since 3.11.0
     *
     * @param {integer} time - The current timestamp as generated by the Request Animation Frame or SetTimeout.
     * @param {number} delta - The delta time, in ms, elapsed since the last frame.
     */
    update: function (time, delta)
    {
        if (!this.isRunning)
        {
            return;
        }

        this._elapsed += delta;

        this.progress = Clamp(this._elapsed / this.duration, 0, 1);

        if (this._elapsed < this.duration)
        {
            var v = this.ease(this.progress);

            var x = this.source.x + ((this.destination.x - this.source.x) * v);
            var y = this.source.y + ((this.destination.y - this.source.y) * v);

            this.camera.setScroll(x, y);

            if (this._onUpdate)
            {
                this._onUpdate.call(this._onUpdateScope, this.camera, this.progress, x, y);
            }
        }
        else
        {
            this.camera.setScroll(this.destination.x, this.destination.y);

            if (this._onUpdate)
            {
                this._onUpdate.call(this._onUpdateScope, this.camera, this.progress, this.destination.x, this.destination.y);
            }
    
            this.effectComplete();
        }
    },

    /**
     * Called internally when the effect completes.
     *
     * @method Phaser.Cameras.Scene2D.Effects.Pan#effectComplete
     * @since 3.11.0
     */
    effectComplete: function ()
    {
        this._onUpdate = null;
        this._onUpdateScope = null;

        this.isRunning = false;

        this.camera.emit('camerapancomplete', this.camera, this);
    },

    /**
     * Resets this camera effect.
     * If it was previously running, it stops instantly without calling its onComplete callback or emitting an event.
     *
     * @method Phaser.Cameras.Scene2D.Effects.Pan#reset
     * @since 3.11.0
     */
    reset: function ()
    {
        this.isRunning = false;

        this._onUpdate = null;
        this._onUpdateScope = null;
    },

    /**
     * Destroys this effect, releasing it from the Camera.
     *
     * @method Phaser.Cameras.Scene2D.Effects.Pan#destroy
     * @since 3.11.0
     */
    destroy: function ()
    {
        this.reset();

        this.camera = null;
        this.source = null;
        this.destination = null;
    }

});

module.exports = Pan;