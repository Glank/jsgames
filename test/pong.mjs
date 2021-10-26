import {assert} from "../src/test_utils.mjs";
import {initBall, updateBall, orth_dist2} from "../src/pong/pong.mjs";
import * as mtx from "../src/mtx.mjs";

function testBall() {
  var display = {
    'width': 200,
    'height': 100
  }
  var ball = initBall(display);
  assert(ball.x === 100, 'ball.x should be 100');
  assert(ball.y === 50, 'ball.y should be 50');

  ball.angle = 0;
  updateBall(ball, 1.0, display);
  var expected_x = 100+ball.speed;
  assert(ball.x === expected_x, 'ball.x should be '+expected_x+' not '+ball.x);
}

function testOrthDist2() {
  var p = mtx.create_v2(1, 1); 
  var a = mtx.create_v2(0, 0);
  var b = mtx.create_v2(2, 0);
  var d = orth_dist2(p, a, b);
  assert(d === 1, 'dist should be 1');

  p = mtx.create_v2(2, 2);
  d = orth_dist2(p, a, b);
  assert(d === 4, 'dist should be 4');

  b = mtx.create_v2(1, 1);
  d = orth_dist2(p, a, b);
  assert(d === 0, 'dist should be 0');
}

testBall();
testOrthDist2();
