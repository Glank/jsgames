import {assert} from "../src/test_utils.mjs";
import {initBall, updateBall} from "../src/pong/pong.mjs";

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

testBall();

