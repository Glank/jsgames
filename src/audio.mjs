export class AudioManager {
  constructor() {
    this.effects = {};
  	this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
		this.game = null;
  }
	loadEffect(name, src) {
		var effect = {
			data:null,
			source:null
		};
		var this_ = this;
		effect.promis = fetch(src)
			.then(response => response.arrayBuffer())
			.then(buf => this.audioCtx.decodeAudioData(buf))
			.then(data => effect.data = data)
			.catch(function(err) { 
				if (this_.game) {
					game.debug.error_message = err.message;
					game.debug.error_stack= err.stack;
				}
				console.log(err);
			});
		this.effects[name] = effect;
	}
  playEffect(name) {
		var effect = this.effects[name];
		if (!effect.data)
			return;
    if (effect.source !== null) {
      try {
        effect.source.disconnect(this.audioCtx.destination);
        effect.source.stop(this.audioCtx.currentTime);
      } catch(err) {
				if (this.game) {
					game.debug.error_message = err.message;
					game.debug.error_stack= err.stack;
				}
        console.log(err);
      }
    }
    effect.source = this.audioCtx.createBufferSource();
    effect.source.buffer = effect.data;
    effect.source.connect(this.audioCtx.destination);
    effect.source.start(this.audioCtx.currentTime);
  }
}
