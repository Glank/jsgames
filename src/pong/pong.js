function initBall(game) {
	var ball = {
		'x': game.width/2.0,
		'y': game.height/2.0,
		'speed': 50 // pixels per second
	};
	if(Math.random() < 0.5) {
		ball.angle = 0;
	} else {
		ball.angle = Math.PI;
	}
	return ball;
}

function updateBall(ball, dt, game) {
	var dx = ball.speed*Math.cos(ball.angle);
	var dy = ball.speed*Math.sin(ball.angle);
	ball.x += dx*dt;
	ball.y += dy*dt;

	// handle bouncing off walls
	var bounced = false;
	if(ball.x < 0) {
		ball.x = 0;
		dx *= -1;
		bounced = true;
	}
	if(ball.x > game.width) {
		ball.x = game.width;
		dx *= -1;
		bounced = true;
	}
	if(ball.y < 0) {
		ball.y = 0;
		dy *= -1;
		bounced = true;
	}
	if(ball.y > game.height) {
		ball.y = game.height;
		dy *= -1;
		bounced = true;
	}
	
	ball.angle = Math.atan2(dy, dx);
	if(bounced) {
		if (ball.speed < 200)
			ball.speed += 1;
		ball.angle += (Math.random()-0.5)/2;
	}
}
