import {assert, approx}  from "../src/test_utils.mjs";
import {initPong, updatePong, _test} from "../src/old_pong/pong.mjs";
import * as mtx from "../src/mtx.mjs";

function testBall() {
  var game = {
    'width': 200,
    'height': 500
  }
  var pong = initPong(game);
  var ball = pong.ball;
  assert(ball.x === 100, 'ball.x should be 100');
  assert(ball.y === 250, 'ball.y should be 250');

  ball.angle = 0;
  updatePong(1/8.0, game);
  var expected_x = 100+ball.speed/8;
  assert(ball.x === expected_x, 'ball.x should be '+expected_x+' not '+ball.x);
}

function testOrthDist() {
  var p = mtx.create_v2(1, 1); 
  var a = mtx.create_v2(0, 0);
  var b = mtx.create_v2(2, 0);
  var d = _test.sgnd_orth_dist(p, a, b);
  assert(approx(d, 1), 'dist should be approx 1, not '+d);

  p = mtx.create_v2(2, 2);
  d = _test.sgnd_orth_dist(p, a, b);
  assert(approx(d, 2), 'dist should be approx 2, not '+d);

  b = mtx.create_v2(0, 1);
  d = _test.sgnd_orth_dist(p, a, b);
  assert(approx(d, -2), 'dist should be approx -2, not '+d);

  b = mtx.create_v2(1, 1);
  d = _test.sgnd_orth_dist(p, a, b);
  assert(approx(d, 0), 'dist should be approx 0, not '+d);
}

function approx_v2(v1, v2, err){
  return approx(v1[0], v2[0], err) && approx(v1[1], v2[1], err);
}
  

function testCollision1() {
  var line_start = [0, 0, 2, 0];
  var line_end = line_start;
  var point_start = [1, 1];
  var point_end = [1, -1];
  var c = _test.moving_line_and_point_collision(
    line_start, line_end, point_start, point_end);
  assert(c !== null, 'expected collision');
  assert(approx(c.t, 0.5), 'collision should be at t~=0.5');
  assert(approx_v2(c.p, [1, 0]), 'collision should be at p~=<1, 0>');
  assert(approx_v2(c.a, [0, 0]), 'collision should be at a~=<0, 0>');
  assert(approx_v2(c.b, [2, 0]), 'collision should be at b~=<2, 0>');
}

function testCollision2() {
  var line_start = [0, -1, 2, -1];
  var line_end = [0, 1, 2, 1];
  var point_start = [1, 1];
  var point_end = [1, -1];
  var c = _test.moving_line_and_point_collision(
    line_start, line_end, point_start, point_end);
  assert(c !== null, 'expected collision');
  assert(approx(c.t, 0.5), 'collision should be at t~=0.5');
  assert(approx_v2(c.p, [1, 0]), 'collision should be at p~=<1, 0>');
  assert(approx_v2(c.a, [0, 0]), 'collision should be at a~=<0, 0>');
  assert(approx_v2(c.b, [2, 0]), 'collision should be at b~=<2, 0>');
}

function testCollision3() {
  var line_start = [0, 0, 2, 0];
  var line_end = [0, 0, 0, 2];
  var point_start = [1, 1];
  var point_end = [1, 1];
  var c = _test.moving_line_and_point_collision(
    line_start, line_end, point_start, point_end);
  assert(c !== null, 'expected collision');
  assert(approx(c.t, 0.5), 'collision should be at t~=0.5');
  assert(approx_v2(c.p, [1, 1]), 'collision should be at p~=<1, 1>');
  assert(approx_v2(c.a, [0, 0]), 'collision should be at a~=<0, 0>');
  assert(approx_v2(c.b, [1, 1]), 'collision should be at b~=<1, 1>');
}

function testCollision4() {
  var line_start = [0.001, 0, 2, 0];
  var line_end = [0, 0.001, 0, 2];
  var point_start = [.999, 1];
  var point_end = [1, 1.001];
  var c = _test.moving_line_and_point_collision(
    line_start, line_end, point_start, point_end);
  assert(c!== null, 'expected collision');
  assert(approx(c.t, 0.5), 'collision should be at t~=0.5');
  assert(approx_v2(c.p, [1, 1]), 'collision should be at p~=<1, 1>');
  assert(approx_v2(c.a, [0, 0]), 'collision should be at a~=<0, 0>');
  assert(approx_v2(c.b, [1, 1]), 'collision should be at b~=<1, 1>');
}

function testCollision5() {
  var seg_start = [0, 0, 2, 0];
  var seg_end = seg_start;
  var point_start = [3, 1];
  var point_end = [3, -1];
  var c = _test.moving_segment_and_point_collision(
    seg_start, seg_end, point_start, point_end);
  assert(c === null, 'no collision expected');
  c = _test.moving_line_and_point_collision(
    seg_start, seg_end, point_start, point_end);
  assert(c !== null, 'collision expected');
}

function testCollision6() {
  var seg_start = [0, 0, 2, 0];
  var seg_end = seg_start;
  var point_start = [-1, 1];
  var point_end = [-1, -1];
  var c = _test.moving_segment_and_point_collision(
    seg_start, seg_end, point_start, point_end);
  assert(c === null, 'no collision expected');
  c = _test.moving_line_and_point_collision(
    seg_start, seg_end, point_start, point_end);
  assert(c !== null, 'collision expected');
}

function testCollision7() {
  var seg_start = [0, 0, 2, 0];
  var seg_end = seg_start;
  var point_start = [1, 1];
  var point_end = [1, -1];
  var c = _test.moving_segment_and_point_collision(
    seg_start, seg_end, point_start, point_end);
  assert(c !== null, 'expected collision');
  assert(approx(c.t, 0.5), 'collision should be at t~=0.5');
  assert(approx_v2(c.p, [1, 0]), 'collision should be at p~=<1, 0>');
  assert(approx_v2(c.a, [0, 0]), 'collision should be at a~=<0, 0>');
  assert(approx_v2(c.b, [2, 0]), 'collision should be at b~=<2, 0>');
  assert(approx(c.s, 0.5), 'collision should be at s~=0.5');
}

function testCollisions() {
	testCollision1();
	testCollision2();
	testCollision3();
	testCollision4();
	testCollision5();
	testCollision6();
	testCollision7();
}

function testReflect1() {
  var ra = mtx.create_v2(0,1);
  var rb = mtx.create_v2(0,-1);
  var wa = mtx.create_v2(-1,0);
  var wb = mtx.create_v2(1,0);
  var c = mtx.create_v2(0,0);
  var r = _test.reflect(ra, rb, wa, wb, c);
  assert(approx_v2(r, [0, 1]), 'reflection should be <0,1> not '+r);
}

function testReflect2() {
  var ra = mtx.create_v2(0,1);
  var rb = mtx.create_v2(0,-1);
  var wa = mtx.create_v2(-1,-1);
  var wb = mtx.create_v2(1,1);
  var c = mtx.create_v2(0,0);
  var r = _test.reflect(ra, rb, wa, wb, c);
  assert(approx_v2(r, [-1, 0]), 'reflection should be <-1,0> not '+r);
}

function testPBSD() {
  // test paddle_ball_sdist
  // paddle_ball_sdist(pa, pb, pr, b, br, cout, nout)
	var base_cases = [
		[[mtx.create_v2(0,0), mtx.create_v2(2,0), 1, mtx.create_v2(0,0), 1],
     [-2, null, null]],
		[[mtx.create_v2(0,0), mtx.create_v2(2,0), 1, mtx.create_v2(-1,0), 1],
     [-1, null, null]],
		[[mtx.create_v2(0,0), mtx.create_v2(2,0), 1, mtx.create_v2(-2,0), 1],
     [0, mtx.create_v2(-1,0), mtx.create_v2(-1, 0)]],
		[[mtx.create_v2(0,0), mtx.create_v2(2,0), 1, mtx.create_v2(-3,0), 1],
     [1, null, null]],
		[[mtx.create_v2(0,0), mtx.create_v2(2,0), 1, mtx.create_v2(2,0), 1],
     [-2, null, null]],
		[[mtx.create_v2(0,0), mtx.create_v2(2,0), 1, mtx.create_v2(3,0), 1],
     [-1, null, null]],
		[[mtx.create_v2(0,0), mtx.create_v2(2,0), 1, mtx.create_v2(4,0), 1],
     [0, mtx.create_v2(3,0), mtx.create_v2(1,0)]],
		[[mtx.create_v2(0,0), mtx.create_v2(2,0), 1, mtx.create_v2(5,0), 1],
     [1, null, null]],
		[[mtx.create_v2(0,0), mtx.create_v2(2,0), 1, mtx.create_v2(1,0), 1],
     [-2, null, null]],
		[[mtx.create_v2(0,0), mtx.create_v2(2,0), 1, mtx.create_v2(1,1), 1],
     [-1, null, null]],
		[[mtx.create_v2(0,0), mtx.create_v2(2,0), 1, mtx.create_v2(1,2), 1],
     [0, mtx.create_v2(1,1), mtx.create_v2(0,1)]],
		[[mtx.create_v2(0,0), mtx.create_v2(2,0), 1, mtx.create_v2(1,3), 1],
     [1, null, null]],
		[[mtx.create_v2(0,0), mtx.create_v2(2,0), 1, mtx.create_v2(1,-1), 1],
     [-1, null, null]],
		[[mtx.create_v2(0,0), mtx.create_v2(2,0), 1, mtx.create_v2(1,-2), 1],
     [0, mtx.create_v2(1,-1), mtx.create_v2(0,-1)]],
		[[mtx.create_v2(0,0), mtx.create_v2(2,0), 1, mtx.create_v2(1,-3), 1],
      [1, null, null]]
	];
	var rotations = [
		0*Math.PI,
		0.37*Math.PI,
		0.74*Math.PI,
		1.2*Math.PI,
		1.86*Math.PI
	];
	var translations = [
		mtx.create_v2(0,0),
		mtx.create_v2(0.1, 0),
		mtx.create_v2(-0.1, 0),
		mtx.create_v2(0, 0.1),
		mtx.create_v2(0, -0.1),
		mtx.create_v2(-1,2),
		mtx.create_v2(2,-3.5),
		mtx.create_v2(0.12,0.75),
		mtx.create_v2(-1,-1)
	];
	var transform = function(ri, ti, p) {
    if(p===null)
      return null;
		var r = rotations[ri];
		var t = translations[ti];
		var rot = mtx.create_2x2(
			Math.cos(r), -Math.sin(r),
			Math.sin(r), Math.cos(r)
		);
		var p1 = mtx.uninit_v2();
		var p2 = mtx.uninit_v2();
		mtx.mult_2x2_v2(rot, p, p1);
		mtx.add_v2(p1, t, p2);
		return p2;
	};
  var act_cout = mtx.create_v2(0,0);
  var act_nout = mtx.create_v2(0,0);
	for(var c = 0; c < base_cases.length; c++) {
		for(var r = 0; r < rotations.length; r++) {
			for(var t = 0; t < translations.length; t++) {
				var params = base_cases[c][0];
				var exp_sdist = base_cases[c][1][0];
        var exp_cout = transform(r,t,base_cases[c][1][1]);
        var exp_nout = transform(r,0,base_cases[c][1][2]); // don't translate the normal
				var pa = transform(r,t,params[0]);
				var pb = transform(r,t,params[1]);
				var b = transform(r,t,params[3]);
        var sdist_wo_out = _test.paddle_ball_sdist(
					pa, pb, params[2], b, params[4],
          null, null);
				var act_sdist = _test.paddle_ball_sdist(
					pa, pb, params[2], b, params[4],
          act_cout, act_nout);
        assert(sdist_wo_out == act_sdist, "sdist shouldn't change without output params");
				assert(approx(exp_sdist, act_sdist),
					'Expected sdist '+exp_sdist+' but got '+act_sdist+' in case '+c+', '+r+', '+t);
        if(exp_cout) {
          assert(approx_v2(exp_cout, act_cout),
            'Expected cout '+exp_cout+' but got '+act_cout+' in case '+c+', '+r+', '+t);
        }
        if(exp_nout) {
          assert(approx_v2(exp_nout, act_nout),
            'Expected nout '+exp_nout+' but got '+act_nout+' in case '+c+', '+r+', '+t);
        }
			}
		}
	}
}

testBall();
testOrthDist();
testCollisions();
testReflect1();
testReflect2();
testPBSD();
