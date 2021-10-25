// requires src/mobile_check.js

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

function initGame(div, width, height){
	div.style.border = "2px solid red";
	div.style["background-color"] = "black";
  var display = document.createElement("canvas");
  display.width = width;
  display.height = height;
	display.style["background-color"] = "white";
  div.appendChild(display);
  var game = {
		"width": width,
		"height": height,
    "display": display,
		"container_overflow": null,
		"on_mobile": isMobileBrowser(),
		"rotated": false,
		"_frame_interval": 50,
		"debug": null
  };
  game.redraw = function() {
		var ctx = display.getContext("2d");
		ctx.clearRect(0, 0, display.width, display.height);
    if(game.draw) {
			ctx.save()
			if(game.rotated) {
				ctx.translate(display.width, 0);
				ctx.rotate(Math.PI/2);
			}
      game.draw(ctx);
			if(game.debug) {
				ctx.fillStyle = "#0000FF";
				ctx.fillText(game.debug, 2, 10);
			}
			ctx.restore();
    }
  };
  game._loop = function() {
		container = div.getBoundingClientRect();
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
		if (game.update) {
			if (performance.now) {
				if (game._last_updated) {
					var now = performance.now();
					var delta = (now-game._last_updated)/1000.0;
					game.update(delta);
					game._last_updated = now;
				} else {
					game._last_updated = performance.now();
					game.update(game._frame_interval/1000.0);
				}
			} else {
				game.update(game._frame_interval/1000.0);
			}
		}
		window.requestAnimationFrame(game.redraw);
  };
  game._interval = window.setInterval(game._loop, game._frame_interval);
	game.set_frame_interval = function(interval) {
		game._frame_interval = interval;
		window.clearInterval(game._interval);
		game._interval = window.setInterval(game._loop, game._frame_interval);
	};
  return game;
}
