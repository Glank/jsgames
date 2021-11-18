'use strict';

function assert(condition, message) {
  if(!condition)
    throw new Error(message);
}

var TEST_APPROX_ERROR = 0.01;

function approx(a, b, err) {
  if (!err) {
    err = TEST_APPROX_ERROR;
  }
  return Math.abs(b-a) < err;
}

module.exports = {
	assert: assert,
	//TEST_APPROX_ERROR: TEST_APPROX_ERROR,
	approx: approx
};
