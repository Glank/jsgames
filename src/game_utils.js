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
  var display = document.createElement("canvas");
  display.width = width;
  display.height = height;
  var buffer = document.createElement("canvas");
  buffer.width = width;
  buffer.height = height;
  buffer.style.display = "none";
  div.appendChild(display);
  div.appendChild(buffer);
  var game = {
    "display": display,
    "buffer": buffer,
    "draw": null,
    "frame_interval": 50
  };
  game.redraw = function() {
    if(game.draw !== null) {
      var ctx = buffer.getContext("2d");
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, buffer.width, buffer.height);
      game.draw(ctx);
    }
    var ctx = display.getContext("2d");
    ctx.drawImage(buffer, 0, 0, display.width, display.height);
  };
  game._loop = function() {
    game.redraw();
    // TODO: update display alignment
    var prev_update = game.last_update;
    game.last_update = (new Date()).getMilliseconds();
    var delta = game.last_update-prev_update;
    window.setTimeout(game._loop, game.frame_interval-delta);
  }
  game.redraw();
  game.last_update = (new Date()).getMilliseconds();
  window.setTimeout(game._loop, game.frame_interval);
  return game;
}
