// A small matrix module
// Inspiration and code snippits taken from glmatrix:
// https://glmatrix.net/

var EPSILON = 0.00001;
var ARRAY_TYPE = (typeof Float32Array !== 'undefined') ? Float32Array : Array;

// Creates a 2x2 matrix who's values may not be fully initialized.
export function uninit_2x2() {
	return new ARRAY_TYPE(4);
}

export function create_2x2(s00, s01, s10, s11) {
	var m = uninit_2x2();
	m[0] = s00;
	m[1] = s01;
	m[2] = s10;
	m[3] = s11;
	return m;
}

export function det_2x2(m) {
	return m[0] * m[3] - m[2] * m[1];
}

export function inv_2x2(m, out) {
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

export function mult_2x2(a, b, out) {
  out[0] = a[0]*b[0]+a[1]*b[2];
  out[1] = a[0]*b[1]+a[1]*b[3];
  out[2] = a[2]*b[0]+a[3]*b[2];
  out[3] = a[2]*b[1]+a[3]*b[3];
  return out;
}

export function eq_2x2(a,b) {
  return (Math.abs(a[0]-b[0]) < EPSILON) &&
    (Math.abs(a[1]-b[1]) < EPSILON) &&
    (Math.abs(a[2]-b[2]) < EPSILON) &&
    (Math.abs(a[3]-b[3]) < EPSILON);
}

export function uninit_v2() {
  return new ARRAY_TYPE(2);
}

export function create_v2(s0, s1) {
  var v = uninit_v2();
  v[0] = s0; 
  v[1] = s1;
  return v;
}

export function mult_2x2_v2(m, v, out) {
  out[0] = m[0]*v[0]+m[1]*v[1];
  out[1] = m[2]*v[0]+m[3]*v[1];
  return out;
}

export function dot_v2(a, b) {
  return a[0]*b[0] + a[1]*b[1];
}

export function mult_s_v2(s, v, out) {
  out[0] = s*v[0];
  out[1] = s*v[1];
  return out;
}

export function add_v2(a, b, out) {
  out[0] = a[0]+b[0];
  out[1] = a[1]+b[1];
  return out;
}

// out = a-b
export function sub_v2(a, b, out) {
  out[0] = a[0]-b[0];
  out[1] = a[1]-b[1];
  return out;
}

// out = s*v+w
export function mult_s_add_v2(s, v, w, out) {
  out[0] = s*v[0]+w[0];
  out[1] = s*v[1]+w[1];
  return out;
}

export function length_v2(v) {
  return Math.sqrt(v[0]*v[0]+v[1]*v[1]);
}

export function normalize_v2(v, out) {
  var s = 1/Math.sqrt(v[0]*v[0]+v[1]*v[1]);
  return mult_s_v2(s, v, out);
}

