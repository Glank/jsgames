function preloadedSound(src) {
  var this_ = {};
	var xhr = new XMLHttpRequest();
	xhr.open('GET', src, false);
	var src_buf = src;
	xhr.onload = function () {
			var blob = new Blob(Uint8Array.from(xhr.response, c => c.charCodeAt(0)), {type:'audio/mpeg'});
			src_buf = URL.createObjectURL(blob);
	};
	xhr.send();
  this_.sound = document.createElement("audio");
  this_.sound.src = src;
  this_.sound.setAttribute("preload", "auto");
  this_.sound.setAttribute("controls", "none");
  this_.sound.style.display = "none";
  document.body.appendChild(this_.sound);
  this_.play = function(){
    this_.sound.currentTime = 0;
    this_.sound.play();
  }
  return this_;
}

class AudioManager {
  constructor() {
    this.sounds = {};
  }
  play(sound) {
    // TODO
  }
}
