import {assert, approx}  from "../src/test_utils.mjs";
import {initPong, updatePong, _test} from "../src/pong/pong.mjs";
import * as mtx from "../src/mtx.mjs";

function testBall() {
  var game = {
    'width': 200,
    'height': 100
  }
  var pong = initPong(game);
  var ball = pong.ball;
  assert(ball.x === 100, 'ball.x should be 100');
  assert(ball.y === 50, 'ball.y should be 50');

  ball.angle = 0;
  updatePong(1.0, game);
  var expected_x = 100+ball.speed;
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

function approx_v2(v, s0, s1, err){
  return approx(v[0], s0, err) && approx(v[1], s1, err);
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
  assert(approx_v2(c.p, 1, 0), 'collision should be at p~=<1, 0>');
  assert(approx_v2(c.a, 0, 0), 'collision should be at a~=<0, 0>');
  assert(approx_v2(c.b, 2, 0), 'collision should be at b~=<2, 0>');
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
  assert(approx_v2(c.p, 1, 0), 'collision should be at p~=<1, 0>');
  assert(approx_v2(c.a, 0, 0), 'collision should be at a~=<0, 0>');
  assert(approx_v2(c.b, 2, 0), 'collision should be at b~=<2, 0>');
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
  assert(approx_v2(c.p, 1, 1), 'collision should be at p~=<1, 1>');
  assert(approx_v2(c.a, 0, 0), 'collision should be at a~=<0, 0>');
  assert(approx_v2(c.b, 1, 1), 'collision should be at b~=<1, 1>');
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
  assert(approx_v2(c.p, 1, 1), 'collision should be at p~=<1, 1>');
  assert(approx_v2(c.a, 0, 0), 'collision should be at a~=<0, 0>');
  assert(approx_v2(c.b, 1, 1), 'collision should be at b~=<1, 1>');
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
  assert(approx_v2(c.p, 1, 0), 'collision should be at p~=<1, 0>');
  assert(approx_v2(c.a, 0, 0), 'collision should be at a~=<0, 0>');
  assert(approx_v2(c.b, 2, 0), 'collision should be at b~=<2, 0>');
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

testBall();
testOrthDist();
testCollisions();
