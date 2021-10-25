export function initBall(game) {
	var ball = {
		'x': game.width/2.0,
		'y': game.height/2.0,
		'speed': game.height/4.0, // pixels per second
    'max_speed': game.height*2
	};
  ball.angle = (3*Math.PI/2)+((Math.random()-0.5)/2.5)*Math.PI;
	return ball;
}

export function updateBall(ball, dt, game) {
	var dx = ball.speed*Math.cos(ball.angle);
	var dy = ball.speed*Math.sin(ball.angle);
	ball.x += dx*dt;
	ball.y += dy*dt;

	// handle bouncing off walls
	var bounced = false;
	if(ball.x < 0) {
    var over = -ball.x;
		ball.x = over;
		dx *= -1;
		bounced = true;
	}
	if(ball.x > game.width) {
    var over = ball.x-game.width;
		ball.x = game.width-over;
		dx *= -1;
		bounced = true;
	}
	if(ball.y < 0) {
    var over = -ball.y;
		ball.y = over;
		dy *= -1;
		bounced = true;
	}
	if(ball.y > game.height) {
    var over = ball.y-game.height;
		ball.y = game.height-over;
		dy *= -1;
		bounced = true;
	}
	
	ball.angle = Math.atan2(dy, dx);
	if(bounced) {
		if (ball.speed < ball.max_speed)
			ball.speed *= 1.05;
		// ball.angle += (Math.random()-0.5)/2;
	}
}
