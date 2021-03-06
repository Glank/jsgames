'use strict';
var assert = require("../src/test_utils.js").assert;
var mtx = require("../src/mtx.js");

function test_inverse() {
  var a = mtx.create_2x2(
    1, 0,
    0, 1
  );

  assert(mtx.det_2x2(a) === 1, "Determinant of 'a' should be 1.");
  
  var b = mtx.uninit_2x2();
  var inv = mtx.inv_2x2(a,b)
  assert(b === inv, "Could not invert.");

  assert(mtx.eq_2x2(inv, a), "'inv' should equal 'a'");
}

function test_mult() {
  var a = mtx.create_2x2(
    2.5, -1,
    3, 2
  );

  var b = mtx.create_2x2(
    1, 0,
    0, 1
  );

  var c = mtx.uninit_2x2();
  var prod = mtx.mult_2x2(a,b,c);
  assert(c === prod, "Could not multiply.");

  var d = mtx.uninit_2x2();
  var a_inv = mtx.inv_2x2(a, d);
  assert(d === a_inv, "Could not invert.");

  var e = mtx.uninit_2x2();
  var a_inv_prod = mtx.mult_2x2(a_inv, prod, e);
  assert(e === a_inv_prod, "Could not multiply.");
  assert(mtx.eq_2x2(a_inv_prod, b), "'a_inv_prod' should equal 'b'");
}

function test_orth() {
  var base = [3, 1];
  var target = [2, 1];
  var orth = mtx.orth_v2(base,target, mtx.uninit_v2());
  assert(mtx.dot_v2(orth, base) === 0, "orth should return a vector orthoganal to base");;
}

test_inverse();
test_mult();
test_orth();
