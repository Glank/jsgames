import * as mtx from "../mtx.mjs";

function initBall(game) {
	var ball = {
		'x': game.width/2.0,
		'y': game.height/2.0,
		'speed': game.height/4.0, // pixels per second
    'max_speed': game.height*2,
		'transparent_to_paddle': false
	};
  ball.angle = (3*Math.PI/2)+((Math.random()-0.5)/2.5)*Math.PI;
	return ball;
}

function initPaddle(game) {
	var p = {
		'x': game.width/2.0,
		'y': game.height-50,
		'angle': 0,
		'max_angle': Math.PI/4,
		'length': game.width/5.0,
		'speed': game.width/2, // pixels per second
		'angular_velocity': Math.PI, // rads per second
		'x_dir': 0, // [-1, 0, 1]
		'angle_dir': 0 // [-1, 0, 1]
	};
	p.points = function() {
		var dx = p.length*0.5*Math.cos(p.angle);
		var dy = p.length*0.5*Math.sin(p.angle);
		return [
			p.x-dx, p.y-dy,
			p.x+dx, p.y+dy
		];
	};
	return p;
}

export function initPong(game) {
	game.pong = {}
	game.pong.ball = initBall(game)
	game.pong.paddle = initPaddle(game);
	return game.pong;
}

export function updatePong(dt, game) {
	var ball = game.pong.ball;
	var paddle = game.pong.paddle;

	var p_start = paddle.points();
	if (paddle.x_dir === -1)
		paddle.x -= paddle.speed*dt;
	else if (paddle.x_dir === 1)
		paddle.x += paddle.speed*dt;
	if (paddle.angle_dir === -1) {
		paddle.angle -= paddle.angular_velocity*dt;
		if (paddle.angle < -paddle.max_angle)
			paddle.angle = -paddle.max_angle;
	} else if (paddle.angle_dir === 1) {
		paddle.angle += paddle.angular_velocity*dt;
		if (paddle.angle > paddle.max_angle)
			paddle.angle = paddle.max_angle;
	}
	var p_end = paddle.points();
	if (p_end[0] < 0 || p_end[2] > game.width) {
		var dx = -p_end[0];
		if (p_end[2] > game.width)
			dx = game.width-p_end[2];
		paddle.x += dx;
		p_end = paddle.points();
	}

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

// Calculates the signed orthoganal distance from a point to a line segment defined by two points.
// Sign: a point above a line starting from the origin, pointing in the positive x direction should have a positive sign.
// A point below the same line should have a negative sign.
function sgnd_orth_dist(point, line_a, line_b) {
	// translate system to line_b
	const p = mtx.uninit_v2();
	mtx.sub_v2(point, line_b, p);
	const v = mtx.uninit_v2();
	mtx.sub_v2(line_b, line_a, v);
	mtx.normalize_v2(v, v);
	// inverse rotation matrix
	const r = mtx.create_2x2(
		v[0], v[1],
		-v[1], v[0]);
	const p2 = v; // v no longer used, re-using memory
	mtx.mult_2x2_v2(r, p, p2);
	return p2[1]
}

function moving_line_and_point_collision(line_start, line_end, point_start, point_end) {
	// init temporal values at end for calculating first max_d
	const p0 = mtx.create_v2(point_start[0], point_start[1]);
	const pd = mtx.create_v2(point_end[0]-point_start[0], point_end[1]-point_start[1]);
	const pt = mtx.create_v2(point_end[0], point_end[1]);

	const a0 = mtx.create_v2(line_start[0], line_start[1]);
	const b0 = mtx.create_v2(line_start[2], line_start[3]);
	const ad = mtx.create_v2(line_end[0]-line_start[0], line_end[1]-line_start[1]);
	const bd = mtx.create_v2(line_end[2]-line_start[2], line_end[3]-line_start[3]);
	const at = mtx.create_v2(line_end[0], line_end[1]);
	const bt = mtx.create_v2(line_end[2], line_end[3]);

	var min_t = 0;
	var max_t = 1;
	var min_d = sgnd_orth_dist(p0, a0, b0);
	if (min_d === 0)
		return { 't':0, 'p':p0, 'a':a0, 'b':b0 };
	var max_d = sgnd_orth_dist(pt, at, bt);
	if (max_d === 0)
		return { 't':1, 'p':pt, 'a':at, 'b':bt };
	var min_s = min_d>0;
	var max_s = max_d>0;
	
	if (min_s === max_s)
		return null; // the signed orth dist never changes signs, so there can't be a collision

	var mid_t, mid_d, mid_s;
	// 8 binary search iterations,
	// increase or decreese to trade off speed for accuracy
	for(var i = 0; i < 8; i++) {
		mid_t = 0.5*(min_t+max_t);
		mtx.mult_s_add_v2(mid_t, pd, p0, pt);
		mtx.mult_s_add_v2(mid_t, ad, a0, at);
		mtx.mult_s_add_v2(mid_t, bd, b0, bt);
		mid_d = sgnd_orth_dist(pt, at, bt);
		if(mid_d === 0)
			return { 't':mid_t, 'p':pt, 'a':at, 'b':bt };
		mid_s = mid_d > 0;
		if (mid_s === min_s) {
			min_t = mid_t;
			//min_d = mid_d;
			mid_s = mid_s;
		} else {
			max_t = mid_t;
			//max_d = mid_d;
			max_s = mid_s;
		}
	}
	mid_t = 0.5*(min_t+max_t);
	mtx.mult_s_add_v2(mid_t, pd, p0, pt);
	return { 't':mid_t, 'p':pt, 'a':at, 'b':bt };
}

function moving_segment_and_point_collision(seg_start, seg_end, point_start, point_end) {
	const c = moving_line_and_point_collision(seg_start, seg_end, point_start, point_end);
	if (c === null)
		return null;
	const ab = mtx.uninit_v2();
	mtx.sub_v2(c.b, c.a, ab);
	// translate the system so that a is <0,0>
	const p = mtx.uninit_v2();
	mtx.sub_v2(c.p, c.a, p);
	// scale system down to normalize ab
	const s = mtx.isqrt(mtx.dot_v2(ab, ab));
	mtx.mult_s_v2(s, ab, ab);
	mtx.mult_s_v2(s, p, p);
	// rotate system to place ab on the x axis
	const r = mtx.create_2x2(
		ab[0], ab[1],
		-ab[1], ab[0]);
	const p1 = ab; // ab no longer needed, re-using memory
	mtx.mult_2x2_v2(r, p, p1);
	// check to see if the collision point is outside the segment's range 
	if (p1[0] < 0 || 1 < p1[0])
		return null;
	// include the segment offset in the collision data
	c.s = p1[0];
	return c;
}

// exports for testing purposes only
export var _test = {
	'sgnd_orth_dist': sgnd_orth_dist,
	'moving_line_and_point_collision': moving_line_and_point_collision,
	'moving_segment_and_point_collision': moving_segment_and_point_collision
};
