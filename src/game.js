'use strict';

var isMobileBrowser = require('./mobile_check.js').isMobileBrowser;

function closeFullscreen() {
  // https://www.w3schools.com/howto/howto_js_fullscreen.asp
  if (document.exitFullscreen) {
    document.exitFullscreen();
  } else if (document.webkitExitFullscreen) { /* Safari */
    document.webkitExitFullscreen();
  } else if (document.msExitFullscreen) { /* IE11 */
    document.msExitFullscreen();
  }
}

function isFullscreen() {
  // https://stackoverflow.com/questions/7130397/how-do-i-make-a-div-full-screen
  return document.fullscreenElement ||
    document.webkitFullscreenElement ||
    document.mozFullScreenElement ||
    document.msFullscreenElement;
}
  
function tryFullscreen(element) {
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
    this.audio = null;

		this.ad_server = document.ad_server || 'https://ernestmakes.com/help';
		this.ad_countdown = -1;
		var ad_counter = document.createElement('label');
    ad_counter.style['background-color'] = 'white';
    ad_counter.style['position'] = 'absolute';
    ad_counter.style['top'] = '0';
    ad_counter.style['right'] = '0';
		ad_counter.style['display'] = 'inline-block';
		this.ad_counter = ad_counter;
		this.ads_played = 0;
		this.max_ads = 1;

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

    this.menu = null;
    this.clickListeners = [];
    var clickHandler = function(e) {
      try {
        var rect = game.display.getBoundingClientRect();
        var touchesDown = [];
        var x,y;
        if (game.rotated) {
          y = game.height-(eclientX - rect.left)/rect.width*game.display.width;
          x = (e.clientY - rect.top)/rect.height*game.display.height;
        } else {
          x = (e.clientX - rect.left)/rect.width*game.display.width;
          y = (e.clientY - rect.top)/rect.height*game.display.height;
        }
        var event = {'x': x, 'y': y};
        if (game.menu)
          game.menu._on_click(event);
        for (var i in game.clickListeners)
          game.clickListeners[i](event);
        if (game.audio) {
          game.audio.acquirePermissions();
        }
      } catch (err) {
        game.debug.error_message = err.message;
        game.debug.error_stack = err.stack;
        console.log(err.message);
        console.log(err.stack);
      }
    };
    display.onclick = function(e) {
      clickHandler(e);
    };

    this.set_frame_interval(50);

    // functions to be given
    this.draw = null;
    this.update = null;
  }
	_updateAdCounter() {
		this.ad_counter.innerHTML = 'Ad will end in '+(this.ad_countdown|0)+' seconds...';
	}
	playAd(seconds) {
		if (this.ads_played >= this.max_ads)
			return;
		this.ads_played++;
		this.ad_countdown = seconds || 10;
		var game = this;
		//var params = {mode:'cors'};
    fetch(this.ad_server+'?width='+this.width+'&height='+this.height)
			.then(response => response.text())
			.then(function(text) {
				game.div.innerHTML = text;
				game._updateAdCounter();
				game.div.appendChild(game.ad_counter);
			});
	}
  redraw() {
    var ctx = this.display.getContext("2d");
    ctx.clearRect(0, 0, this.display.width, this.display.height);
		if (this.ad_countdown > 0) {
			this._updateAdCounter();
			return;
		}
    if(this.draw || this.menu) {
      ctx.save()
      if(this.rotated) {
        ctx.translate(this.display.width, 0);
        ctx.rotate(Math.PI/2);
      }
      try {
        if(this.menu) {
          this.menu._draw(ctx);
        } else if (this.draw) {
          this.draw(ctx);
        }
      } catch (err) {
        this.debug.error_message = err.message;
        this.debug.error_stack = err.stack;
        console.log(err.message);
        console.log(err.stack);
      }
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
		if (this.ad_countdown >= 0) {
			this.ad_countdown -= dt;
			if (this.ad_countdown < 0) {
				// restore the display once the ad times out
				this.div.innerHTML = '';
				this.div.appendChild(this.display);
			}
		}
    var game = this;
    window.requestAnimationFrame(function() {
      game.redraw();
    });
    this.avg_framerate = (this.avg_framerate*15+(1/dt))/16;
    if (this.update && (!this.paused) && (!this.menu) && (this.ad_countdown < 0)) {
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
    this._interval = window.setInterval(function() {
      game._loop();
    }, this._frame_interval);
  };
  addTouchListener(callback) {
    this.touchCallbacks.push(callback);
  }
  addClickListener(callback) {
    this.clickListeners.push(callback);
  }
}

function initGame(div, width, height){
  return new Game(div, width, height);
}

class MenuItem {
  constructor(text, callback) {
    this.type = 'item'
    this.text = text;
    this.callback = callback;
  }
}

function fillTextCentered(ctx, txt, x, y) {
  var txt_box = ctx.measureText(txt);
  var box_height = (txt_box.fontBoundingBoxAscent + txt_box.fontBoundingBoxDescent) || txt_box.actualBoundingBoxAscent;
  var txt_x = x-0.5*txt_box.width
  var txt_y = y-0.5*box_height+(txt_box.fontBoundingBoxAscent || txt_box.actualBoundingBoxAscent);
  ctx.fillText(txt, txt_x, txt_y);
}

class Menu extends MenuItem {
  constructor(title_text, game, parent) {
    super(title_text, null);
    var this_ = this;
    this.callback = function() {
      if (parent)
        parent._submenu_shown = this_;
    };
    this.parent = parent;
    this.game = game;
    this.type = 'menu';
    this.subtitle = null;
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
    if (this._children.length >= 5)
      throw new Error("Trying to add too many children to Menu.");
    this._children.push(item);
  }
  _draw(ctx) {
    ctx.fillStyle = "#000000";
    ctx.font = "bold 100px arial";
    var x = 0.5*this.game.width;
    var y_div = this.game.height/8;
    fillTextCentered(ctx, this.text, x, 1.5*y_div);
    if (this.subtitle) {
      ctx.font = "30px arial";
      fillTextCentered(ctx, this.subtitle, x, 2*y_div);
    }
    ctx.font = "bold 40px arial";
    for (var i = 0; i < this._children.length; i++) {
      fillTextCentered(ctx, this._children[i].text, x, (3+i)*y_div);
    }
  }
  _on_click(event) {
    if (!isFullscreen()) {
      tryFullscreen(this.game.div);
      return;
    }
    var y_div = this.game.height/8;
    var div = event.y/y_div;
    var button = Math.floor(div-2.5);
    if (button >= 0 && button < this._children.length) {
      this._children[button].callback();
    }
  }
}


module.exports = {
  closeFullscreen: closeFullscreen,
  isFullscreen: isFullscreen,
  tryFullscreen: tryFullscreen,
  initGame: initGame,
  MenuItem: MenuItem,
  fillTextCentered: fillTextCentered,
  Menu: Menu
};
