import {isMobileBrowser} from "./mobile_check.js";

export function closeFullscreen() {
  // https://www.w3schools.com/howto/howto_js_fullscreen.asp
  if (document.exitFullscreen) {
    document.exitFullscreen();
  } else if (document.webkitExitFullscreen) { /* Safari */
    document.webkitExitFullscreen();
  } else if (document.msExitFullscreen) { /* IE11 */
    document.msExitFullscreen();
  }
}

export function isFullscreen() {
  // https://stackoverflow.com/questions/7130397/how-do-i-make-a-div-full-screen
  return document.fullscreenElement ||
    document.webkitFullscreenElement ||
    document.mozFullScreenElement ||
    document.msFullscreenElement;
}
  
export function tryFullscreen(element) {
  // https://stackoverflow.com/questions/7130397/how-do-i-make-a-div-full-screen
  if (element.requestFullscreen) {
    element.requestFullscreen();
  } else if (element.mozRequestFullScreen) {
    element.mozRequestFullScreen();
  } else if (element.webkitRequestFullscreen) {
    element.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
  } else if (element.msRequestFullscreen) {
    element.msRequestFullscreen();
  }
}

class Game {
	constructor(div, width, height) {
		div.style.border = "2px solid red";
		div.style["background-color"] = "black";
		var display = document.createElement("canvas");
		display.width = width;
		display.height = height;
		display.style["background-color"] = "white";
		display.style["margin"] = 0;
		display.style["position"] = "absolute";
		display.style["top"] = "50%";
		display.style["left"] = "50%";
		display.style["-ms-transform"] = "translate(-50%, -50%)";
		display.style["transform"] = "translate(-50%, -50%)";
		div.appendChild(display);
		this.div = div;
		this.width = width;
		this.height = height;
		this.display = display;
		// used for keeping track of which direction to stretch
		// to fit the enclosing container.
		// values are 'horizontal' or 'vertical'
		this.container_overflow = null;
		this.rotated = false;
		this.print_debug = false;
		this.debug = {};
		this.avg_framerate = 0;
		this.paused = false;
		this.max_dt = 0.1;


		var game = this;
		this.touchesDown = [];
		this.touchCallbacks = [];
		var touchHandler = function(e, catagory) {
			try {
				var rect = game.display.getBoundingClientRect();
				var touchesDown = [];
				var x,y;
				for (var i = 0; i < e.touches.length; i++) {
					if (game.rotated) {
						y = game.height-(e.touches[i].clientX - rect.left)/rect.width*game.display.width;
						x = (e.touches[i].clientY - rect.top)/rect.height*game.display.height;
					} else {
						x = (e.touches[i].clientX - rect.left)/rect.width*game.display.width;
						y = (e.touches[i].clientY - rect.top)/rect.height*game.display.height;
					}
					touchesDown[i] = {'x':x, 'y':y};
				}
				game.touchesDown = touchesDown;
				var event = {
					game: game,
					catagory: catagory
				}
				for (var i in game.touchCallbacks) {
					game.touchCallbacks[i](event);
				}
			} catch (err) {
				game.debug.error_message = err.message;
				game.debug.error_stack = err.stack;
			}
		};
		display.addEventListener('touchstart', function(e){
			touchHandler(e, 'start');
		});
		display.addEventListener('touchmove', function(e){
			touchHandler(e, 'move');
		});
		display.addEventListener('touchend', function(e){
			touchHandler(e, 'end');
		});
		display.addEventListener('touchcancel', function(e){
			touchHandler(e, 'cancel');
		});

		this.set_frame_interval(50);

		// functions to be given
		this.draw = null;
		this.update = null;
	}
  redraw() {
		var ctx = this.display.getContext("2d");
		ctx.clearRect(0, 0, this.display.width, this.display.height);
    //ctx.fillStyle = "#FFFFFF";
    //ctx.fillRect(0,0, this.display.width, this.display.height);
    if(this.draw) {
			ctx.save()
			if(this.rotated) {
				ctx.translate(this.display.width, 0);
				ctx.rotate(Math.PI/2);
			}
      this.draw(ctx);
			if(this.print_debug) {
				ctx.fillStyle = "#0000FF";
				ctx.font = "10px Courier";
				ctx.fillText('fps: '+this.avg_framerate.toFixed(0), 2, 10);
				var i = 0;
				for (const [key, value] of Object.entries(this.debug)) {
          var lines = (''+value).split('\n');
          var key_str = ''+key+': ';
          var key_box = ctx.measureText(key_str);
          var val_x = key_box.width+4;
          ctx.fillText(key_str, 2, 22+i*12);
          for (var l in lines) {
            ctx.fillText(lines[l], val_x, 22+i*12);
            i++;
          }
				}
			}
			ctx.restore();
    }
  }
  _loop () {
		var container = this.div.getBoundingClientRect();
		var should_rotate = false;
		if(isMobileBrowser() && isFullscreen()) {
			var nonrotated_fit = 0; // % of screen used if not rotated
			if(container.width/this.width > container.height/this.height) {
				var real_width = this.width*container.height/this.height;
				nonrotated_fit = real_width/(0.0+container.width);
			} else {
				var real_height = this.height*container.width/this.width;
				nonrotated_fit = real_height/(0.0+container.height);
			}

			var rotated_fit = 0; // % of screen used if rotated
			if(container.width/this.height > container.height/this.width) {
				var real_width = this.height*container.height/this.width;
				rotated_fit = real_width/(0.0+container.width);
			} else {
				var real_height = this.width*container.width/this.height;
				rotated_fit = real_height/(0.0+container.height);
			}
			should_rotate = rotated_fit > nonrotated_fit;
		}
		if(should_rotate !== this.rotated) {
			this.rotated = should_rotate;
			var tmp = this.display.width;
			this.display.width = this.display.height;
			this.display.height = tmp;
		}
		if(container.width/this.display.width > container.height/this.display.height) {
			if(this.container_overflow !== "horizontal") {	
				this.display.style["width"] = "";
				this.display.style["height"] = "100%";
				this.container_overflow = "horizontal";
			}
		} else {
			if(this.container_overflow !== "vertical") {
				this.display.style["width"] = "100%";
				this.display.style["height"] = "";
				this.container_overflow = "vertical";
			}
		}
		var dt = this._frame_interval/1000.0;
		if (performance.now) {
			if (this._last_updated) {
				var now = performance.now();
				dt = (now-this._last_updated)/1000.0;
				this._last_updated = now;
			} else {
				this._last_updated = performance.now();
			}
		}
		var game = this;
		window.requestAnimationFrame(function() {game.redraw()});
		this.avg_framerate = (this.avg_framerate*15+(1/dt))/16;
		if (this.update && (!this.paused)) {
      try {
        this.update(Math.min(dt, this.max_dt));
      } catch(err) {
        this.debug.error_message = err.message;
        this.debug.error_stack = err.stack;
        console.log(err.message);
        console.log(err.stack);
      }
    }
  };
	set_frame_interval(milliseconds) {
		this._frame_interval = milliseconds;
		window.clearInterval(this._interval);
		var game = this;
		this._interval = window.setInterval(function() {game._loop();}, this._frame_interval);
	};
	addTouchListener(callback) {
		this.touchCallbacks.push(callback);
	}
}

export function initGame(div, width, height){
  return new Game(div, width, height);
}

export class MenuItem {
	constructor(text, callback) {
		this.type = 'item'
		this.text = text;
		this.callback = callback;
	}
}

export class Menu extends MenuItem {
	constructor(title_text, parent) {
		var this_ = this;
		this.parent = parent;
		super(title_text, function() {
			if (parent)
				parent._submenu_shown = this_;
		});
		this.type = 'menu';
		this._children = [];
		if (this.parent) {
			this._children.push(new MenuItem('< Back', function() {
				this_.parent._submenu_shown = null;
			}));
		}
		this._submenu_shown = null;
	};
	add(item) {
		if (!(item instanceof MenuItem))
			throw new Error("Trying to add item that isn't a MenuItem");
		this._children.append(item);
	}
	_draw(ctx) {
		// TODO
	}
	_on_click(event) {
		// TODO
	}
}
