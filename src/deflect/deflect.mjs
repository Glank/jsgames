import * as gu from "../game_utils.mjs";
import * as mbl from "../mobile_check.js";
import * as collision from "../collision.mjs";
import * as mtx from "../mtx.mjs";

(function() {
	var div = document.getElementById("game");
	var game = gu.initGame(div, 480, 480*2);
  var engine = new collision.CollisionEngine();
	
  var ballInitPoint = mtx.create_v2(game.width/2, game.height/2);
	var ballInitSpeed = 500;
  var ball = collision.initCircle(mtx.copy_v2(ballInitPoint, mtx.uninit_v2()), 20);
  var ballPhysics = new collision.BasicPhysics("bounce", {
    enforce_no_overlap: function(other) { return other.type === 'rline'; }
  });
	var gameState = 'countdown';
	var countDownTime = 3;
	var heldVelocity = null;
  var resetBall = function() {
		gameState = 'countdown';
		countDownTime = 3;
    ball.set('center', mtx.copy_v2(ballInitPoint, mtx.uninit_v2()));
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
  });
  // bottom
  bounding_wall_bodies[3].onCollision(function(event){
    resetBall();
  });

  var paddleLength = 150;
  var paddleYOffset = 100;
  var paddleRadius = 10;
  var paddleAngularSpeed = 3; // radians/second
  var paddleSpeed = 1000; // pxls/second
  var playerPaddle = collision.initRoundedLine(
    [game.width/2-paddleLength/2, game.height-paddleYOffset],
    [game.width/2+paddleLength/2, game.height-paddleYOffset],
    paddleRadius
  );
  var aiPaddle = collision.initRoundedLine(
    [game.width/2-paddleLength/2, paddleYOffset],
    [game.width/2+paddleLength/2, paddleYOffset],
    paddleRadius
  );
  var paddlePhysicsParams = {
    enforce_no_overlap: function(other) { return other.type === 'inf_bound'; },
    ignore: function(other) { return other.type === 'circle'; }
  };
  var playerPaddlePhysics = new collision.BasicPhysics("stop", paddlePhysicsParams);
  var aiPaddlePhysics = new collision.BasicPhysics("stop", paddlePhysicsParams);
  engine.addBody(playerPaddle, playerPaddlePhysics);
  engine.addBody(aiPaddle, aiPaddlePhysics);

  var startMenu = new gu.Menu('Deflect', game);
  startMenu.subtitle = "ErnestMakes.com";
	startMenu.add(new gu.MenuItem('One Player', function() {
    game.menu = null;
    game.paused = false;
  }));
  var pausedMenu = new gu.Menu('Paused', game);
	pausedMenu.add(new gu.MenuItem('Unpause', function() {
    game.menu = null;
    game.paused = false;
  }));
  game.menu = startMenu;

	game.draw = function(ctx) {
    ctx.beginPath();
		ctx.arc(ball.get('center')[0], ball.get('center')[1], ball.get('radius'), 0, 2*Math.PI);
    ctx.closePath();
    ctx.fillStyle = "blue";
		ctx.fill();

    var paddles = [playerPaddle, aiPaddle];
    for (var i in paddles) {
      var paddle = paddles[i];
      ctx.lineWidth = paddle.get('radius')*2;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(paddle.get('p1')[0], paddle.get('p1')[1]);
      ctx.lineTo(paddle.get('p2')[0], paddle.get('p2')[1]);
      ctx.strokeStyle = "black";
      ctx.stroke();
    }

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
      var txt = ''+Math.ceil(countDownTime);
      ctx.font = "bold 120px arial";
      gu.fillTextCentered(ctx, txt, game.width/2, game.height/2);
		}
	};

	var getAngle = function(paddle) {
		var p1_p2 = mtx.sub_v2(paddle.get('p2'), paddle.get('p1'), mtx.uninit_v2());
		return Math.atan2(p1_p2[1], p1_p2[0]);
	};
	
	var getCenter = function(paddle) {
		return mtx.average_v2(paddle.get('p1'), paddle.get('p2'), mtx.uninit_v2());
	};

	var setAngle = function(paddle, angle) {
    var center = getCenter(paddle);
		var delta = mtx.create_v2(
			paddleLength*0.5*Math.cos(angle),
			paddleLength*0.5*Math.sin(angle)
		);
		mtx.sub_v2(center, delta, paddle.get('p1'));
		mtx.add_v2(center, delta, paddle.get('p2'));
	};

  var playerXDir = 0;
  var playerAngleDir = 0;
	var aiXDir = 0;
  var timeSinceBallSpeedUp = 0;
  game.update = function(dt) {
    if (!gu.isFullscreen()) {
			pause();
      return;
    }

		if (gameState === 'countdown') {
			countDownTime -= dt;
			if (countDownTime < 0) {
				gameState = 'play';
				releaseBall();
			}
		} else if(gameState === 'play') {
			timeSinceBallSpeedUp += dt;
			if (timeSinceBallSpeedUp > 10) {
				mtx.mult_s_v2(1.25, ballPhysics.velocity, ballPhysics.velocity);
				timeSinceBallSpeedUp = 0;
			}
		}

    if (mbl.isMobileBrowser()) {
      var center = getCenter(playerPaddle); 
      if (game.touchesDown.length === 0) {
        playerXDir = 0;
        playerAngleDir = 0;
      } else {
        var x;
        if (game.touchesDown.length === 1) {
          playerAngleDir = 0;
          var t = game.touchesDown[0];
          x = t.x;
        } else if (game.touchesDown.length === 2) {
          var t0 = game.touchesDown[0];
          var t1 = game.touchesDown[1];
          if (t1.x < t0.x) {
            var tmp = t0;
            t0 = t1;
            t1 = tmp;
          }
          x = (t0.x+t1.x)/2;
          var dx = t1.x-t0.x;
          var dy = t1.y-t0.y;
          var targetAngle = Math.atan2(dy, dx);
          var paddleAngle = getAngle(playerPaddle);
          if (targetAngle < (paddleAngle-0.05))
            playerAngleDir = -1;
          else if (targetAngle > (paddleAngle+0.05))
            playerAngleDir = 1;
          else
            playerAngleDir = 0;
        }
        if (x < center[0]-10)
          playerXDir = -1;
        else if (x > center[0]+10)
          playerXDir = 1;
        else
          playerXDir = 0;
      }
    }
    playerPaddlePhysics.velocity[0] = playerXDir*paddleSpeed;
    var paddleAngle = playerAngleDir*dt*paddleAngularSpeed+getAngle(playerPaddle);
    setAngle(playerPaddle, paddleAngle);

		// update AI
		var aiCenter = getCenter(aiPaddle);
		if (aiCenter[0] < ball.get('center')[0]-10)
			aiXDir = 1;
		else if (aiCenter[0] > ball.get('center')[0]+10)
			aiXDir = -1;
		else
			aiXDir = 0;
    aiPaddlePhysics.velocity[0] = aiXDir*paddleSpeed/5;

    engine.update(dt);
    if (isNaN(playerPaddle.get('p1')[0]) || playerPaddle.get('p1')[0] < 0 || playerPaddle.get('p1')[0] > game.width) {
      throw Error();
    }
  };

  game.set_frame_interval(Math.trunc(1000/60)); // ~60fps

  game.addTouchListener(function(e) {});

  document.addEventListener('keydown', function(e) {
    if(e.code === 'ArrowLeft') {
      playerXDir = -1;
    } else if(e.code === 'ArrowRight') {
      playerXDir = 1;
    } else if(e.code === 'ArrowDown') {
      playerAngleDir = -1;
    } else if(e.code === 'ArrowUp') {
      playerAngleDir = 1;
    }
  });
  document.addEventListener('keyup', function(e) {
    if(e.code === 'ArrowLeft' && playerXDir === -1) {
      playerXDir = 0;
    } else if(e.code === 'ArrowRight' && playerXDir === 1) {
      playerXDir = 0;
    } else if(e.code === 'ArrowDown' && playerAngleDir === -1) {
      playerAngleDir = 0;
    } else if(e.code === 'ArrowUp' && playerAngleDir === 1) {
      playerAngleDir = 0;
    }
  });

  game.print_debug = true;
})();
