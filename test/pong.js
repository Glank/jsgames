#include src/test_utils.js
#include src/pong/pong.js

ball = newBall(10, 5);
assert(ball.x === 5, 'ball.x should be 5');
assert(ball.y === 2, 'ball.y should be 2');
