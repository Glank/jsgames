import * as gu from "../game_utils.mjs";
import * as mbl from "../mobile_check.mjs";
import * as collision from "../collision.mjs";
import * as mtx from "../mtx.mjs";

function boxContains(box, touch) {
	return box[0] <= touch.x && touch.x < box[2] && box[1] <= touch.y && touch.y < box[3];
}

const paddlePhysicsParams = {
	enforce_no_overlap: function(other) { return other.type === 'inf_bound'; },
	ignore: function(other) { return other.type === 'circle'; }
};
const paddleYOffset = 100;
function initPaddle(game, engine, side, initControl) {
	var paddle = {
  	length: 150,
		radius: 10,	
		angularSpeed: 3, // radians/second
		xDir: 0, // [-1, 0, 1]
		angularDir: 0, // [-1, 0, 1]
		side: side
	};
	paddle.setControl = function(control) {
		paddle.control = control;
		if (control === 'human')
			paddle.speed = 1000; // pxls/second
		else if (control === 'ai')
			paddle.speed = 200; // pxls/second
		else
			throw Error('Invalid paddle control: '+control);
	};
	paddle.setControl(initControl);
	if (side === 'top') {
		paddle.y = paddleYOffset;
		paddle.touchBox = [0, 0, game.width, game.height/2];
	} else if (side === 'bottom') {
		paddle.y = game.height-paddleYOffset; 
		paddle.touchBox = [0, game.height/2, game.width, game.height];
	} else {
		throw Error('Invalid paddle side: '+side);
	}
  paddle.body = collision.initRoundedLine(
    [game.width/2-paddle.length/2, paddle.y],
    [game.width/2+paddle.length/2, paddle.y],
    paddle.radius
  );
  paddle.physics = new collision.BasicPhysics("stop", paddlePhysicsParams);
	paddle.draw = function(ctx) {
		ctx.lineWidth = paddle.body.get('radius')*2;
		ctx.lineCap = "round";
		ctx.beginPath();
		ctx.moveTo(paddle.body.get('p1')[0], paddle.body.get('p1')[1]);
		ctx.lineTo(paddle.body.get('p2')[0], paddle.body.get('p2')[1]);
		ctx.strokeStyle = "black";
		ctx.stroke();
	};
	paddle.getAngle = function() {
		var p1_p2 = mtx.sub_v2(paddle.body.get('p2'), paddle.body.get('p1'), mtx.uninit_v2());
		return Math.atan2(p1_p2[1], p1_p2[0]);
	};
	paddle.getCenter = function() {
		return mtx.average_v2(paddle.body.get('p1'), paddle.body.get('p2'), mtx.uninit_v2());
	};
	paddle.setAngle = function(angle) {
    var center = paddle.getCenter();
		var delta = mtx.create_v2(
			paddle.length*0.5*Math.cos(angle),
			paddle.length*0.5*Math.sin(angle)
		);
		mtx.sub_v2(center, delta, paddle.body.get('p1'));
		mtx.add_v2(center, delta, paddle.body.get('p2'));
	};
	paddle.update = function(dt, ball, game) {
		if (paddle.control === 'ai') {
			var center = paddle.getCenter();
			if (center[0] < ball.get('center')[0]-10)
				paddle.xDir = 1;
			else if (center[0] > ball.get('center')[0]+10)
				paddle.xDir = -1;
			else
				paddle.xDir = 0;
		} else if (paddle.control === 'human' && mbl.isMobileBrowser()) {
			var touches = []
			for (var i in game.touchesDown) {
				if (boxContains(paddle.touchBox, game.touchesDown[i])) {
					touches.push(game.touchesDown[i]);
				}
			}
      var center = paddle.getCenter(); 
      if (touches.length === 0) {
        paddle.xDir = 0;
        paddle.angularDir = 0;
      } else {
        var x;
        if (touches.length === 1) {
          paddle.angularDir = 0;
          var t = touches[0];
          x = t.x;
        } else if (touches.length === 2) {
          var t0 = touches[0];
          var t1 = touches[1];
          if (t1.x < t0.x) {
            var tmp = t0;
            t0 = t1;
            t1 = tmp;
          }
          x = (t0.x+t1.x)/2;
          var dx = t1.x-t0.x;
          var dy = t1.y-t0.y;
          var targetAngle = Math.atan2(dy, dx);
          var paddleAngle = paddle.getAngle();
          if (targetAngle < (paddleAngle-0.05))
            paddle.angularDir = -1;
          else if (targetAngle > (paddleAngle+0.05))
            paddle.angularDir = 1;
          else
            paddle.angularDir = 0;
        }
        if (x < center[0]-10)
          paddle.xDir = -1;
        else if (x > center[0]+10)
          paddle.xDir = 1;
        else
          paddle.xDir = 0;
      }
		}
    paddle.physics.velocity[0] = paddle.xDir*paddle.speed;
    var newAngle = paddle.angularDir*dt*paddle.angularSpeed+paddle.getAngle();
    paddle.setAngle(newAngle);
	};
	paddle.handleKeyDown = function(e) {
		if (paddle.control !== 'human')
			return;
		if (paddle.side === 'top') {
			if(e.code === 'KeyA') {
				paddle.xDir = -1;
			} else if(e.code === 'KeyD') {
				paddle.xDir = 1;
			} else if(e.code === 'KeyS') {
				paddle.angularDir = -1;
			} else if(e.code === 'KeyW') {
				paddle.angularDir = 1;
			}
		} else if (paddle.side === 'bottom') {
			if(e.code === 'ArrowLeft') {
				paddle.xDir = -1;
			} else if(e.code === 'ArrowRight') {
				paddle.xDir = 1;
			} else if(e.code === 'ArrowDown') {
				paddle.angularDir = -1;
			} else if(e.code === 'ArrowUp') {
				paddle.angularDir = 1;
			}
		} else {
			throw Error('Invalid paddle side: '+paddle.side);
		}
	};
	paddle.handleKeyUp = function(e) {
		if (paddle.control !== 'human')
			return;
		if (paddle.side === 'top') {
			if(e.code === 'KeyA' && paddle.xDir === -1) {
				paddle.xDir = 0;
			} else if(e.code === 'KeyD' && paddle.xDir === 1) {
				paddle.xDir = 0;
			} else if(e.code === 'KeyS' && paddle.angularDir === -1) {
				paddle.angularDir = 0;
			} else if(e.code === 'KeyW' && paddle.angularDir === 1) {
				paddle.angularDir = 0;
			}
		} else if (paddle.side === 'bottom') {
			if(e.code === 'ArrowLeft' && paddle.xDir === -1) {
				paddle.xDir = 0;
			} else if(e.code === 'ArrowRight' && paddle.xDir === 1) {
				paddle.xDir = 0;
			} else if(e.code === 'ArrowDown' && paddle.angularDir === -1) {
				paddle.angularDir = 0;
			} else if(e.code === 'ArrowUp' && paddle.angularDir === 1) {
				paddle.angularDir = 0;
			}
		} else {
			throw Error('Invalid paddle side: '+paddle.side);
		}
	};
  engine.addBody(paddle.body, paddle.physics);
	return paddle;
}

function sound(src) {
  var this_ = {};
  this_.sound = new Howl({
    src: [src]
  });
  //this_.sound = document.createElement("audio");
  //this_.sound.src = src;
  //this_.sound.setAttribute("preload", "auto");
  //this_.sound.setAttribute("controls", "none");
  //this_.sound.style.display = "none";
  //document.body.appendChild(this_.sound);
  this_.play = function(){
    //this_.sound.currentTime = 0;
    this_.sound.play();
  }
  return this_;
}

(function() {
	var div = document.getElementById("game");
	var game = gu.initGame(div, 480, 480*2);
  var engine = new collision.CollisionEngine();

	try {
		//sound('../sound/bounce1.mp3').play();
		const AudioContext = window.AudioContext || window.webkitAudioContext;
		const audioCtx = new AudioContext();
		const oscillator1 = audioCtx.createOscillator();
		const oscillator2 = audioCtx.createOscillator();
		const gainNode = audioCtx.createGain();
		oscillator1.detune.value = 100; // value in cents
		oscillator1.frequency.value = 440;
		oscillator1.start(0);
		oscillator2.detune.value = 100; // value in cents
		oscillator2.frequency.value = 880;
		oscillator2.start(0);
		gainNode.gain.value = 0.02;
		function playFrequency(f, type, time) {
			if (Math.random() < 0.5) {
				try {
					oscillator2.disconnect(gainNode);
				} catch(e){}
				oscillator1.connect(gainNode);
			} else {
				try {
					oscillator1.disconnect(gainNode);
				} catch(e){}
				oscillator2.connect(gainNode);
			}
			gainNode.gain.value = 0.02;
			//oscillator.frequency.setValueAtTime(f, audioCtx.currentTime);
			//oscillator.type = type;
			gainNode.connect(audioCtx.destination);
			audioCtx.resume();
			setTimeout(function() {
				try {
					gainNode.gain.value = 0;
					gainNode.disconnect(audioCtx.destination);
					audioCtx.suspend();
				} catch (e){}
			}, time*1000);
		}
		var audioParams = {
			'bounce1': [220, 'square', 0.1],
			'bounce2': [220, 'sawtooth', 0.1],
			'success': [659.25, 'triangle', 0.5],
			'beep1': [440, 'sine', 0.1],
			'beep2': [880, 'sine', 0.5]
		};
		function makePlayFunction(key) {
			var play = function() {
				playFrequency(audioParams[key][0], audioParams[key][1], audioParams[key][2]);
				game.debug.audio = key;
			}
			return play;
		}

		game.sounds = {};
		for (var key in audioParams) {
			game.sounds[key] = {
				play: makePlayFunction(key)
			};
		}
	} catch (e) {
		game.debug.error_message = e.message;
		game.debug.error_stack = e.stack;
	}
  //game.sounds.bounce1 = sound('../sound/bounce1.mp3');
  //game.sounds.bounce2 = sound('../sound/bounce2.mp3');
  //game.sounds.success = sound('../sound/success.mp3');
  //game.sounds.beep1 = sound('../sound/beep1.mp3');
  //game.sounds.beep2 = sound('../sound/beep2.mp3');
	
  var ballInitPoint = mtx.create_v2(game.width/2, game.height/2);
	var ballInitSpeed = 500;
  var ball = collision.initCircle(mtx.copy_v2(ballInitPoint, mtx.uninit_v2()), 20);
  var ballPhysics = new collision.BasicPhysics("bounce", {
    enforce_no_overlap: function(other) { return other.type === 'rline'; }
  });
	var topScore = 0;
	var bottomScore = 0;
	var gameState = 'countdown';
	var countDownTime = 3;
	var heldVelocity = null;
  var resetBall = function() {
		gameState = 'countdown';
		countDownTime = 4;
		var spread = 0.125*Math.PI; // max radians the ball's velocity can diverge from vertical
    var angle = (Math.random()*2-1)*spread;
		if (Math.random() < 0.5) {
			// towards the player
			angle += 0.5*Math.PI;
		} else {
			// towards the AI
			angle += 1.5*Math.PI;
		}
		heldVelocity = mtx.uninit_v2();
    mtx.set_v2(ballInitSpeed*Math.cos(angle), ballInitSpeed*Math.sin(angle), heldVelocity);
    mtx.set_v2(0, 0, ballPhysics.velocity);
    ball.set('center', mtx.copy_v2(ballInitPoint, mtx.uninit_v2()));
  };
	var releaseBall = function() {
		mtx.copy_v2(heldVelocity, ballPhysics.velocity);
		heldVelocity = null;
	};
	var pause = function() {
		game.paused = true; 
    game.menu = pausedMenu;
		if (heldVelocity === null) {
			heldVelocity = mtx.uninit_v2();
			mtx.copy_v2(ballPhysics.velocity, heldVelocity);
			mtx.set_v2(0, 0, ballPhysics.velocity);
		}
		countDownTime = 3;
		gameState = 'countdown';
	};
  resetBall();
  engine.addBody(ball, ballPhysics);

  // increse the ball's vertical velocity if it's stuck bouncing between the walls
  var unbrokenWallHits = 0;
  ball.onCollision(function(event) {
    if (event.other.type === 'inf_bound')
      unbrokenWallHits += 1;
    else
      unbrokenWallHits = 0;
    
    if (unbrokenWallHits >= 5) {
      unbrokenWallHits = 0;
      var ballSpeed = mtx.length_v2(ballPhysics.velocity);
      ballPhysics.velocity[1] *= 1.5;
      if (ballPhysics.velocity[1] === 0)
        ballPhysics.velocity[1] -= 20;
      var angle = Math.atan2(ballPhysics.velocity[1], ballPhysics.velocity[0]);
      mtx.set_v2(ballSpeed*Math.cos(angle), ballSpeed*Math.sin(angle), ballPhysics.velocity);
    }
  });

  var bounding_walls = [
    [[0,0], [1,0]], // left
    [[0,0], [0,1]], // top
    [[game.width,0], [-1,0]], // right
    [[0,game.height], [0,-1]], // bottom
  ];
  var bounding_wall_bodies = [];
  for (var i in bounding_walls) {
    var point = bounding_walls[i][0];
    var normal = bounding_walls[i][1];
    var body = collision.initInfiniteBoundary(point, normal);
    bounding_wall_bodies.push(body);
    engine.addBody(body);
  }
  // top
  bounding_wall_bodies[1].onCollision(function(event){
    resetBall();
    game.sounds.success.play();
		bottomScore++;
  });
  // bottom
  bounding_wall_bodies[3].onCollision(function(event){
    resetBall();
    game.sounds.success.play();
		topScore++;
  });

  ball.onCollision(function(e) {
    if(e.other.type === 'rline')
      game.sounds.bounce1.play();
    else if(e.other === bounding_wall_bodies[0] || e.other === bounding_wall_bodies[2])
      game.sounds.bounce2.play();
  });

	var bottomPaddle = initPaddle(game, engine, 'bottom', 'human');
	var topPaddle = initPaddle(game, engine, 'top', 'ai');

  var startMenu = new gu.Menu('Deflect', game);
  startMenu.subtitle = "ErnestMakes.com";
	startMenu.add(new gu.MenuItem('One Player', function() {
    game.menu = null;
    game.paused = false;
		topScore = 0;
		bottomScore = 0;
		topPaddle.setControl('ai');
    topPaddle.setAngle(0);
		resetBall();
  }));
	startMenu.add(new gu.MenuItem('Two Player', function() {
    game.menu = null;
    game.paused = false;
		topScore = 0;
		bottomScore = 0;
		topPaddle.setControl('human');
		resetBall();
  }));
  var pausedMenu = new gu.Menu('Paused', game);
	pausedMenu.add(new gu.MenuItem('Unpause', function() {
    game.menu = null;
    game.paused = false;
  }));
	pausedMenu.add(new gu.MenuItem('New Game', function() {
    game.menu = startMenu;
    game.paused = true;
  }));
  game.menu = startMenu;

	game.draw = function(ctx) {
		// draw scores
		ctx.fillStyle = "#808080";
		ctx.font = "bold 120px arial";
		if (mbl.isMobileBrowser()) {
			ctx.save();
			ctx.translate(0.5*game.width, 0.25*game.height);
			ctx.rotate(Math.PI);
			gu.fillTextCentered(ctx, ''+topScore+' : '+bottomScore, 0, 0);
			ctx.restore();
			gu.fillTextCentered(ctx, ''+bottomScore+' : '+topScore, 0.5*game.width, 0.75*game.height);
		} else {
			gu.fillTextCentered(ctx, ''+topScore, 0.5*game.width, 0.25*game.height);
			gu.fillTextCentered(ctx, ''+bottomScore, 0.5*game.width, 0.75*game.height);
		}

    ctx.beginPath();
		ctx.arc(ball.get('center')[0], ball.get('center')[1], ball.get('radius'), 0, 2*Math.PI);
    ctx.closePath();
    ctx.fillStyle = "blue";
		ctx.fill();

		bottomPaddle.draw(ctx);
		topPaddle.draw(ctx);

    // touches down
    for (var i = 0; i < game.touchesDown.length; i++) {
      const radius = 100;
      var touch = game.touchesDown[i];
      ctx.beginPath();
      ctx.arc(touch.x, touch.y, radius, 0, 2*Math.PI);
      ctx.closePath();
      ctx.fillStyle = "#FF000080";
      ctx.fill();
    }

    if (gameState === 'countdown') {
			// tint screen
      ctx.fillStyle = "#00000030";
      ctx.fillRect(0,0,game.width,game.height);
      ctx.fillStyle = "#000000";
      var txt = '';
			var count = Math.ceil(countDownTime);
			if (count <= 3)
				txt = ''+count;
      ctx.font = "bold 120px arial";
			if (mbl.isMobileBrowser()) {
				ctx.save();
				ctx.translate(0.333*game.width, 0.5*game.height);
				ctx.rotate(Math.PI);
				gu.fillTextCentered(ctx, txt, 0, 0);
				ctx.restore();
				gu.fillTextCentered(ctx, txt, 0.667*game.width, 0.5*game.height);
			} else {
				gu.fillTextCentered(ctx, txt, 0.5*game.width, 0.5*game.height);
			}
		}
	};

  var timeSinceBallSpeedUp = 0;
  game.update = function(dt) {
    if (!gu.isFullscreen()) {
			pause();
      return;
    }

		if (gameState === 'countdown') {
      var old = Math.trunc(countDownTime);
			countDownTime -= dt;
			var cur = Math.trunc(countDownTime);
			if (countDownTime < 0) {
        game.sounds.beep2.play();
				gameState = 'play';
				releaseBall();
			} else if (cur < old && cur < 3) {
        game.sounds.beep1.play();
      }
		} else if(gameState === 'play') {
			timeSinceBallSpeedUp += dt;
			if (timeSinceBallSpeedUp > 10) {
				mtx.mult_s_v2(1.25, ballPhysics.velocity, ballPhysics.velocity);
				timeSinceBallSpeedUp = 0;
			}
		}

		bottomPaddle.update(dt, ball, game);
		topPaddle.update(dt, ball, game);

    engine.update(dt);
    if (isNaN(bottomPaddle.body.get('p1')[0]) || bottomPaddle.body.get('p1')[0] < 0 || bottomPaddle.body.get('p1')[0] > game.width) {
      throw Error("Invalid paddle state after update.");
    }

  };

  game.set_frame_interval(Math.trunc(1000/60)); // ~60fps

  game.addTouchListener(function(e) {});

  document.addEventListener('keydown', function(e) {
		topPaddle.handleKeyDown(e);
		bottomPaddle.handleKeyDown(e);
  });
  document.addEventListener('keyup', function(e) {
		topPaddle.handleKeyUp(e);
		bottomPaddle.handleKeyUp(e);
  });

  game.print_debug = true;
})();
