'use strict';

// A small matrix module
// Inspiration and code snippits taken from glmatrix:
// https://glmatrix.net/

var EPSILON = 0.00001;
var ARRAY_TYPE = (typeof Float32Array !== 'undefined') ? Float32Array : Array;

// Creates a 2x2 matrix who's values may not be fully initialized.
function uninit_2x2() {
  return new ARRAY_TYPE(4);
}

function create_2x2(s00, s01, s10, s11) {
  var m = uninit_2x2();
  m[0] = s00;
  m[1] = s01;
  m[2] = s10;
  m[3] = s11;
  return m;
}

function set_2x2(s00, s01, s10, s11, m) {
  m[0] = s00;
  m[1] = s01;
  m[2] = s10;
  m[3] = s11;
  return m;
}

function det_2x2(m) {
  return m[0] * m[3] - m[2] * m[1];
}

function inv_2x2(m, out) {
  var det = det_2x2(m);
  if (Math.abs(det) < EPSILON) {
    return null;
  }
  var det_i = 1/det;
  out[0] = det_i*m[3]
  out[1] = -det_i*m[1]
  out[2] = -det_i*m[2]
  out[3] = det_i*m[0]
  return out;
}

function mult_2x2(a, b, out) {
  out[0] = a[0]*b[0]+a[1]*b[2];
  out[1] = a[0]*b[1]+a[1]*b[3];
  out[2] = a[2]*b[0]+a[3]*b[2];
  out[3] = a[2]*b[1]+a[3]*b[3];
  return out;
}

function eq_2x2(a,b) {
  return (Math.abs(a[0]-b[0]) < EPSILON) &&
    (Math.abs(a[1]-b[1]) < EPSILON) &&
    (Math.abs(a[2]-b[2]) < EPSILON) &&
    (Math.abs(a[3]-b[3]) < EPSILON);
}

function uninit_v2() {
  return new ARRAY_TYPE(2);
}

function create_v2(s0, s1) {
  var v = uninit_v2();
  v[0] = s0; 
  v[1] = s1;
  return v;
}

function mult_2x2_v2(m, v, out) {
  out[0] = m[0]*v[0]+m[1]*v[1];
  out[1] = m[2]*v[0]+m[3]*v[1];
  return out;
}

function dot_v2(a, b) {
  return a[0]*b[0] + a[1]*b[1];
}

function mult_s_v2(s, v, out) {
  out[0] = s*v[0];
  out[1] = s*v[1];
  return out;
}

function add_v2(a, b, out) {
  out[0] = a[0]+b[0];
  out[1] = a[1]+b[1];
  return out;
}

// out = a-b
function sub_v2(a, b, out) {
  out[0] = a[0]-b[0];
  out[1] = a[1]-b[1];
  return out;
}

// out = s*v+w
function mult_s_add_v2(s, v, w, out) {
  out[0] = s*v[0]+w[0];
  out[1] = s*v[1]+w[1];
  return out;
}

function length_v2(v) {
  return Math.sqrt(v[0]*v[0]+v[1]*v[1]);
}

function normalize_v2(v, out) {
  var s = 1/Math.sqrt(v[0]*v[0]+v[1]*v[1]);
  return mult_s_v2(s, v, out);
}

function copy_v2(v, out) {
  out[0] = v[0];
  out[1] = v[1];
  return out;
}

function set_v2(s0, s1, out) {
  out[0] = s0;
  out[1] = s1;
  return out;
}

function average_v2(v1, v2, out) {
  out[0] = 0.5*(v1[0]+v2[0]);
  out[1] = 0.5*(v1[1]+v2[1]);
  return out;
}

// returns a non-normalized vector orthoganal to the base in the direction of target
function orth_v2(base, target, out) {
  var b2 = dot_v2(base, base);
  var tb = dot_v2(target, base);
  out[0] = b2*target[0]-tb*base[0];
  out[1] = b2*target[1]-tb*base[1];
  return out;
}

module.exports = {
  EPSILON: EPSILON,
  ARRAY_TYPE: ARRAY_TYPE,
  uninit_2x2: uninit_2x2,
  create_2x2: create_2x2,
  set_2x2: set_2x2,
  det_2x2: det_2x2,
  inv_2x2: inv_2x2,
  mult_2x2: mult_2x2,
  eq_2x2: eq_2x2,
  uninit_v2: uninit_v2,
  create_v2: create_v2,
  mult_2x2_v2: mult_2x2_v2,
  dot_v2: dot_v2,
  mult_s_v2: mult_s_v2,
  add_v2: add_v2,
  sub_v2: sub_v2,
  mult_s_add_v2: mult_s_add_v2,
  length_v2: length_v2,
  normalize_v2: normalize_v2,
  copy_v2: copy_v2,
  set_v2: set_v2,
  average_v2: average_v2,
  orth_v2: orth_v2
};