export class AudioManager {
  constructor() {
    this.effects = {};
  	this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
		this.masterGainNode = this.audioCtx.createGain();
		this.masterGainNode.gain.value = 1;
		this.masterGainNode.connect(this.audioCtx.destination);

		this.toneGainNode = null;
		this.oscillator = null;
		this.toneVolume = 0.5;

		this.game = null;
  }
	_displayError(err) {
		if (this.game) {
			this.game.debug.error_message = err.message;
			this.game.debug.error_stack= err.stack;
		}
		console.log(err);
	}
	// opts: {frequency, type ('sine'), durration (0.2), rampUp (0.01), rampDown (0.05)}
	createToneEffect(name, opts) {
		var effect = {
			type: 'tone',
			frequency: opts.frequency,
			tone_type: opts.type || 'sine',
			durration: opts.durration || 0.2,
			rampUp: opts.rampUp || 0.01,
			rampDown: opts.rampDown || 0.05
		};
		if (effect.rampUp + effect.rampDown > effect.durration) {
			throw new Error('rampUp + rampDown > durration for tone '+name);
		}
		if (!this.toneGainNode) {
			// tone oscillator uninitialized, so initilize
			this.toneGainNode = this.audioCtx.createGain();
			this.toneGainNode.gain.value = 0;
			this.toneGainNode.connect(this.masterGainNode);
			this.oscillator = this.audioCtx.createOscillator();
			this.oscillator.connect(this.toneGainNode);
			this.oscillator.start(0);
		}
		this.effects[name] = effect;
	}
	loadEffect(name, src) {
		var effect = {
			type:'sample',
			data:null,
			source:null
		};
		effect.promis = fetch(src)
			.then(response => response.arrayBuffer())
			.then(buf => this.audioCtx.decodeAudioData(buf))
			.then(data => effect.data = data)
			.catch(err => this._displayError(err));
		this.effects[name] = effect;
	}
  playEffect(name) {
		var effect = this.effects[name];
		if (effect.type === 'sample')
			this._playSample(effect);
		else if (effect.type === 'tone')
			this._playTone(effect);
		else
			this._displayError(new Error('Invalid audio effect type: '+effect.type));
  }
	_playSample(effect) {
		if (!effect.data)
			return;
    if (effect.source !== null) {
      try {
        effect.source.disconnect(this.masterGainNode);
        effect.source.stop(this.audioCtx.currentTime);
      } catch(err) {
				this._displayError(err);
      }
    }
    effect.source = this.audioCtx.createBufferSource();
    effect.source.buffer = effect.data;
    effect.source.connect(this.masterGainNode);
    effect.source.start(this.audioCtx.currentTime);
		this.audioCtx.resume();
	}
	_playTone(effect) {
		this.oscillator.frequency.cancelScheduledValues(this.audioCtx.currentTime);
		this.oscillator.frequency.setValueAtTime(effect.frequency, this.audioCtx.currentTime);
		this.oscillator.type = effect.tone_type;
		this.toneGainNode.gain.cancelScheduledValues(this.audioCtx.currentTime);
		if (effect.rampUp === 0) {
			this.toneGainNode.gain.setValueAtTime(this.toneVolume, this.audioCtx.currentTime);
		} else {
			this.toneGainNode.gain.setValueAtTime(0, this.audioCtx.currentTime);
			this.toneGainNode.gain.linearRampToValueAtTime(this.toneVolume, this.audioCtx.currentTime+effect.rampUp);
		}
		if (effect.rampDown === 0) {
			this.toneGainNode.gain.setValueAtTime(0, this.audioCtx.currentTime+effect.durration);
		} else {
			this.toneGainNode.gain.setValueAtTime(this.toneVolume, this.audioCtx.currentTime+effect.durration-effect.rampDown);
			this.toneGainNode.gain.linearRampToValueAtTime(0, this.audioCtx.currentTime+effect.durration);
		}
		this.audioCtx.resume();
	}
}
