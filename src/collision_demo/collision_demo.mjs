import {initGame, tryFullscreen, isFullscreen} from "../game.mjs";
import * as collision from "../collision.mjs";
import * as mtx from "../mtx.mjs";

function randomColor() {
  var r = 0, g = 0, b = 0;
  while ((r+g+b < 500) || (r+g+b > 650)) {
    r = Math.trunc(Math.random()*256);
    g = Math.trunc(Math.random()*256);
    b = Math.trunc(Math.random()*256);
  }
  return '#'+r.toString(16)+g.toString(16)+b.toString(16);
}
(function() {
  var div = document.getElementById("game");
  var game = initGame(div, 480, 480*2);
  var engine = new collision.CollisionEngine();
  var balls = [];
  var colors = [];
  for (var i = 0; i < 10; i++) {
    var x = Math.random()*game.width;
    var y = Math.random()*game.height;
    var theta = Math.random()*Math.PI*2;
    var speed = game.width/2;
    var ball = collision.initCircle([x, y], 20);
    var ballPhysics = new collision.BasicPhysics('bounce', {
      enforce_no_overlap: function(other) { return other.type === 'rline'; }
    });
    var color = randomColor();
    if (i === 0) {
      ballPhysics.acceleration = [0, 200];
      color = "#000000";
    } else {
      ballPhysics.velocity = [speed*Math.cos(theta), speed*Math.sin(theta)];
    }
    engine.addBody(ball, ballPhysics);
    balls.push(ball);
    colors.push(color);
  }
  // left wall
  engine.addBody(collision.initInfiniteBoundary([0,0], [1, 0]));
  // right
  engine.addBody(collision.initInfiniteBoundary([game.width,0], [-1, 0]));
  // top
  engine.addBody(collision.initInfiniteBoundary([0,0], [0, 1]));
  // bottom
  engine.addBody(collision.initInfiniteBoundary([0,game.height], [0, -1]));
  // paddle
  var paddleLength = 150;
  var paddleCenter = [game.width/2, game.height-100];
  var paddleAngle = 0;
  var paddle = collision.initRoundedLine(
    [paddleCenter[0]+paddleLength/2*Math.cos(paddleAngle), paddleCenter[1]+paddleLength/2*Math.sin(paddleAngle)],
    [paddleCenter[0]-paddleLength/2*Math.cos(paddleAngle), paddleCenter[1]-paddleLength/2*Math.sin(paddleAngle)],
    7
  );
  var paddlePhysics = new collision.BasicPhysics('stop', {
    enforce_no_overlap: function(other) { return other.type === 'inf_bound'; },
    ignore: function(other) { return other.type === 'circle'; },
  });
  engine.addBody(paddle, paddlePhysics);
  game.draw = function(ctx) {
    for (var i = 0; i < balls.length; i++) {
      var ball = balls[i];
      ctx.beginPath();
      ctx.arc(ball.get('center')[0], ball.get('center')[1], ball.get('radius'), 0, 2*Math.PI);
      ctx.closePath();
      ctx.fillStyle = colors[i];
      ctx.fill();
    }

    ctx.lineWidth = paddle.get('radius')*2;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(paddle.get('p1')[0], paddle.get('p1')[1]);
    ctx.lineTo(paddle.get('p2')[0], paddle.get('p2')[1]);
    ctx.strokeStyle = "black";
    ctx.stroke();
  };
  var t = 0;
  game.update = function(dt) {
    t += dt;
    paddlePhysics.velocity[0] += 100*Math.sin(t*2*Math.PI/5);
    paddleAngle = Math.PI/4*Math.sin(t*2*Math.PI/4);
    paddleCenter = mtx.average_v2(paddle.get('p1'), paddle.get('p2'), mtx.uninit_v2());
    paddle.set('p1',
      [paddleCenter[0]+paddleLength/2*Math.cos(paddleAngle), paddleCenter[1]+paddleLength/2*Math.sin(paddleAngle)]);
    paddle.set('p2',
      [paddleCenter[0]-paddleLength/2*Math.cos(paddleAngle), paddleCenter[1]-paddleLength/2*Math.sin(paddleAngle)]);
    game.debug.paddle = ""+paddleCenter[0].toFixed(2)+", "+paddleCenter[1].toFixed(2)+", "+paddleAngle;
    engine.update(dt);
  };
  game.set_frame_interval(20);

  var fs_button = document.getElementById("open_fullscreen");
  fs_button.onclick = function() {
    tryFullscreen(div);
  };

  //game.addTouchListener(function(e) {});
  game.print_debug = true;
})();
