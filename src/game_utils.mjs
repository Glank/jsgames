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

export function initGame(div, width, height){
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
  var game = {
		"width": width,
		"height": height,
    "display": display,
		"container_overflow": null,
		"on_mobile": isMobileBrowser(),
		"rotated": false,
		"_frame_interval": 50,
		"print_debug": false,
		"debug": {},
		"avg_framerate": 0,
		"paused": false,
    "max_dt": 0.1,
  };
  game.redraw = function() {
		var ctx = display.getContext("2d");
		ctx.clearRect(0, 0, display.width, display.height);
    //ctx.fillStyle = "#FFFFFF";
    //ctx.fillRect(0,0,display.width, display.height);
    if(game.draw) {
			ctx.save()
			if(game.rotated) {
				ctx.translate(display.width, 0);
				ctx.rotate(Math.PI/2);
			}
      game.draw(ctx);
			if(game.print_debug) {
				ctx.fillStyle = "#0000FF";
				ctx.font = "10px Courier";
				ctx.fillText('fps: '+game.avg_framerate.toFixed(0), 2, 10);
				var i = 0;
				for (const [key, value] of Object.entries(game.debug)) {
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
  };
  game._loop = function() {
		var container = div.getBoundingClientRect();
		var should_rotate = false;
		if(game.on_mobile && isFullscreen()) {
			var nonrotated_fit = 0; // % of screen used if not rotated
			if(container.width/game.width > container.height/game.height) {
				var real_width = game.width*container.height/game.height;
				nonrotated_fit = real_width/(0.0+container.width);
			} else {
				var real_height = game.height*container.width/game.width;
				nonrotated_fit = real_height/(0.0+container.height);
			}

			var rotated_fit = 0; // % of screen used if rotated
			if(container.width/game.height > container.height/game.width) {
				var real_width = game.height*container.height/game.width;
				rotated_fit = real_width/(0.0+container.width);
			} else {
				var real_height = game.width*container.width/game.height;
				rotated_fit = real_height/(0.0+container.height);
			}
			should_rotate = rotated_fit > nonrotated_fit;
		}
		if(should_rotate !== game.rotated) {
			game.rotated = should_rotate;
			var tmp = display.width;
			display.width = display.height;
			display.height = tmp;
		}
		if(container.width/display.width > container.height/display.height) {
			if(game.container_overflow !== "horizontal") {	
				display.style["width"] = "";
				display.style["height"] = "100%";
				game.container_overflow = "horizontal";
			}
		} else {
			if(game.container_overflow !== "vertical") {
				display.style["width"] = "100%";
				display.style["height"] = "";
				game.container_overflow = "vertical";
			}
		}
		var dt = game._frame_interval/1000.0;
		if (performance.now) {
			if (game._last_updated) {
				var now = performance.now();
				dt = (now-game._last_updated)/1000.0;
				game._last_updated = now;
			} else {
				game._last_updated = performance.now();
			}
		}
		if (game.update && (!game.paused)) {
      try {
        game.update(Math.min(dt, game.max_dt));
      } catch(err) {
        game.debug.error_message = err.message;
        game.debug.error_stack = err.stack;
      }
    }
		game.avg_framerate = (game.avg_framerate*15+(1/dt))/16;
		window.requestAnimationFrame(game.redraw);
  };
  game._interval = window.setInterval(game._loop, game._frame_interval);
	game.set_frame_interval = function(interval) {
		game._frame_interval = interval;
		window.clearInterval(game._interval);
		game._interval = window.setInterval(game._loop, game._frame_interval);
	};
	game.touchesDown = [];
	game.addTouchListener = function(callback) {
		var handler = function(e, catagory) {
			var rect = display.getBoundingClientRect();
			var touchesDown = [];
			var x,y;
			for (var i = 0; i < e.touches.length; i++) {
				if (game.rotated) {
					y = game.height-(e.touches[i].clientX - rect.left)/rect.width*display.width;
					x = (e.touches[i].clientY - rect.top)/rect.height*display.height;
				} else {
					x = (e.touches[i].clientX - rect.left)/rect.width*display.width;
					y = (e.touches[i].clientY - rect.top)/rect.height*display.height;
				}
				touchesDown[i] = {'x':x, 'y':y};
			}
			game.touchesDown = touchesDown;
			var evnt = {
				game: game,
				catagory: catagory
			}
			callback(evnt);
		};
		display.addEventListener('touchstart', function(e){
			handler(e, 'start');
		});
		display.addEventListener('touchmove', function(e){
			handler(e, 'move');
		});
		display.addEventListener('touchend', function(e){
			handler(e, 'end');
		});
		display.addEventListener('touchcancel', function(e){
			handler(e, 'cancel');
		});
	};
  return game;
}
