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
	/*
	div.style.display = "flex";
	div.style["flex-direction"] = "row";
	div.style["justify-content"] = "center";
	*/
	div.style.border = "2px solid red";
	div.style["background-color"] = "black";
  var display = document.createElement("canvas");
  display.width = width;
  display.height = height;
  div.appendChild(display);
  var game = {
    "display": display,
    "draw": null,
		"update": null,
		"container_overflow": null,
		"_frame_interval": 50,
  };
  game.redraw = function() {
		var ctx = display.getContext("2d");
		ctx.fillStyle = "#FFFFFF";
		ctx.fillRect(0, 0, display.width, display.height);
    if(game.draw !== null) {
			ctx.save()
      game.draw(ctx);
			ctx.restore();
    }
  };
  game._loop = function() {
		container = div.getBoundingClientRect();
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
		if(game.update !== null) {
			// TODO: measure actaul time elapsed
			game.update(game._frame_interval/1000.0);
		}
		window.requestAnimationFrame(game.redraw);
  }
  game._interval = window.setInterval(game._loop, game._frame_interval);
  return game;
}
