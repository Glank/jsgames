'use strict';

var aud = require('../audio.js');

(function() {
  
  var audioManager = new aud.AudioManager();
  audioManager.loadEffect('success', '../sound/success.mp3');
  audioManager.createToneEffect('beep', {frequency:440, type:'square'});
	document.getElementById('latencyLabel').innerHTML = audioManager.audioCtx.baseLatency;

  document.getElementById('sample').onclick = function() {
		audioManager.playEffect('success');
  };
  document.getElementById('tone').onclick = function() {
    audioManager.playEffect('beep');
  };
}())
