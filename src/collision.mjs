// My attempt at a 'simple' collision detection engine.

import * as mtx from "./mtx.mjs";

// The default broad pass for the CollisionEngine. Tests every possible body combination.
export function exhaustive(bodies, testCollision) {
	for (var i = 0; i < bodies.length; i++) {
		for (var j = i+1; j < bodies.length; j++) {
			testCollision(bodies[i], bodies[j]);
		}
	}
}

// TODO: implement a more efficient broad pass

export class CollisionEngine {
	constructor() {
		// a list of CollisionBodies (see below)
		this._bodies = [];
		// the physics that may apply to any given body
		this._physics = [];
		// a function which takes a list of bodies and a callback 'testCollision' which should be called on every pair of bodies that might collide.
		this.broad_pass = exhaustive;
		// Collision test types:
		// ss: static-static, test(body1, body2)
		// ds: dynamic-static, test(body1start, body1end, body2)
		// dd: dynamic-dynamic test(body1start, body1end, body2start, body2end)
		this.collision_tests = {
			"inf_bound:inf_bound": "none",
			"rline:rline": "none", // TODO
			"circle:circle": {
				"call_type": "ss",
				"test": _test_collision_circle_circle
			},
			"circle:inf_bound": {
				"call_type": "ds",
				"test": _test_collision_circle_inf_bound
			},
			"circle:rline": {
				"call_type": "ss",
				"test": _test_collision_circle_rline
			},
			"rline:inf_bound": {
				"call_type": "ds",
				"test": _test_collision_rline_inf_bound
			}
		}
	}
	_handle_collision(body, event) {
		event.engine = this;
		event.body = body;
		var physics = this._physics[body._index];
		if (physics)
			physics._on_collision(event);
		event.physics = physics;
		for (var i in body._on_collision_callbacks) {
			body._on_collision_callbacks[i](event);
		}
	}
	_handle_overlap(body, event) {
		event.engine = this;
		event.body = body;
		var physics = this._physics[body._index];
		if (physics)
			physics._on_overlap(event);
		event.physics = physics;
		for (var i in body._on_overlap_callbacks) {
			body._on_overlap_callbacks[i](event);
		}
	}
	testCollision(body1, body2, forceStatic) {
		var key = body1._type+':'+body2._type;
		var swapped = false;
		if (!(key in this.collision_tests)) {
			swapped = true;
			var tmp = body1;
			body1 = body2;
			body2 = tmp;
			key = body1._type+':'+body2._type;
		}
		var test = this.collision_tests[key];
		if (test === 'none')
			return null;
		if (!test)
			throw new Error("No collision test for body interaction "+key);
		var collision = null;
		var b1p1 = body1._prev_params;
		var b1p2 = body1._params;
		var b2p1 = body2._prev_params;
		var b2p2 = body2._params;
		if (forceStatic) {
			b1p1 = b1p2;
			b2p1 = b2p2;
		}
		if (test.call_type === "ss")
			collision = test.test(b1p2, b2p2);
		else if (test.call_type=== "ds")
			collision = test.test(b1p1, b1p2, b2p2);
		else if (test.call_type === "dd")
			collision = test.test(b1p1, b1p2, b2p1, b2p2);
		else
			throw new Error("Unknown collision test call_type: "+test.call_type);
		if (collision && swapped) {
			var tmp = collision._normal1;
			collision._normal1 = collision._normal2;
			collision._normal2 = tmp;
		}
		return collision;
	}
	addBody(body, physics) {
		body._index = this._bodies.length;
		this._bodies.push(body);
		if (physics) {
			physics._index = body._index;
			this._physics[body._index] = physics;
		}
	}
	update(dt) {
		for(var i in this._physics) {
			var physics = this._physics[i];
			var body = this._bodies[i];
			physics._update(body, dt);
		}
		var collisions = [];
		var collision_tests = this.collision_tests;
		var this_engine = this;
		function testCollisionCallback(body1, body2) {
			var collision = this_engine.testCollision(body1, body2);
			if (collision) {
				collision._body1_idx = body1._index;
				collision._body2_idx = body2._index;
				collisions.push(collision);
			}
		}
		this.broad_pass(this._bodies, testCollisionCallback);
		collisions.sort(function cmp(a,b) { return a.t-b.t; });
		for (var i in this._bodies) {
			this._bodies[i]._prev_overlapping = this._bodies[i]._overlapping || new Set();
			this._bodies[i]._overlapping = new Set();
		}
		for (var i in collisions) {
			var collision = collisions[i];
			var body1 = this._bodies[collision._body1_idx];
			var body2 = this._bodies[collision._body2_idx];
			// These are debug constraints. They should always be true but are costly to calculate.
			// TODO: remove in prod
			if (collision._normal1) {
				var l = mtx.length_v2(collision._normal1);
				if (l < 0.999  || l > 1.001 )
					throw new Error("Invalid _normal1 from "+body1._type+":"+body2._type+" of length "+l);
			}	
			if (collision._normal2) {
				var l = mtx.length_v2(collision._normal2);
				if (l < 0.999  || l > 1.001)
					throw new Error("Invalid _normal2 from "+body1._type+":"+body2._type)+" of length "+l;
			}	
			body1._overlapping.add(body2._index);
			body2._overlapping.add(body1._index);
			collision.real_interval = dt;

			collision.other = body2;
			collision.normal = collision._normal1;
			collision.other_normal = collision._normal2;
			if (!body1._prev_overlapping.has(body2._index))
				this._handle_collision(body1, collision);
			this._handle_overlap(body1, collision);

			collision.other = body1;
			collision.normal = collision._normal2;
			collision.other_normal = collision._normal1;
			if (!body2._prev_overlapping.has(body1._index))
				this._handle_collision(body2, collision);
			this._handle_overlap(body2, collision);
		}
		for (var i in this._bodies) {
			var body = this._bodies[i];
			body._prev_params = body._copy_params(body._prev_params);
		}
	}
}

// Supported Types:
// 	- 'circle' with parameters [radius, center]
//  - 'rline' (rounded line segment) with parameters [radius, p1, p2]
//	- 'inf_bound' with parameters [normal, point]
class CollisionBody {
	constructor(type, params) {
		this._type = type;
		this._params = params;
		this._on_collision_callbacks = [];
		this._on_overlap_callbacks = [];
		this.translate = function() { throw new Error('Translate unsuported in CollisionBody '+type); };
		this._copy_params = function() { throw new Error('_copy_params not implemented for '+type); };
		this.travel = function() { throw new Error('travel not implemented for '+type); };
		if (this._type === 'circle') {
			this.translate = function(delta) {
				mtx.add_v2(delta, this._params.center, this._params.center);
			};
			this._copy_params = function(out) {
				out = out || {};
				out.radius = this._params.radius;
				out.center = mtx.copy_v2(this._params.center, out.center || mtx.uninit_v2());
				return out;
			};
			this.travel = function(out) {
				return mtx.sub_v2(this._params.center, this._prev_params.center, out || mtx.uninit_v2());
			};
		} else if (this._type === 'rline') {
			this.translate = function(delta) {
				mtx.add_v2(delta, this._params.p1, this._params.p1);
				mtx.add_v2(delta, this._params.p2, this._params.p2);
			};
			this._copy_params = function(out) {
				out = out || {};
				out.radius = this._params.radius;
				out.p1 = mtx.copy_v2(this._params.p1, out.p1 || mtx.uninit_v2());
				out.p2 = mtx.copy_v2(this._params.p2, out.p2 || mtx.uninit_v2());
				return out;
			}
			this.travel = function(out) {
				var center_start = mtx.uninit_v2();
				mtx.average_v2(this._prev_params.p1, this._prev_params.p2, center_start);
				var center_end = mtx.uninit_v2();
				mtx.average_v2(this._params.p1, this._params.p2, center_end);
				return mtx.sub_v2(center_end, center_start, out || mtx.uninit_v2());
			}
		} else if (this._type === 'inf_bound') {
			this._copy_params = function() {
				return {
					point:mtx.copy_v2(this._params.point, mtx.uninit_v2()),
					normal:mtx.copy_v2(this._params.normal, mtx.uninit_v2())
				};
			};
		} else {
			throw new Error('Invalid CollisionBody type: '+type);
		}
		// the parameters before any given physics update
		this._prev_params = this._copy_params();
	}
	setParameter(key, value) {
		this._params[key] = value;
	}
	// On collision callbacks are called when a collision occures.
	onCollision(callback) {
		this._on_collision_callbacks.push(callback);
	}
	// On overlap callbacks are called every update that this object overlaps another, once for each overlap.
	onOverlap(callback) {
		this._on_overlap_callbacks.push(callback);
	}
}

export class BasicPhysics {
	constructor(collision_behavior, params) {
		this.velocity = mtx.create_v2(0,0);
		this.acceleration = mtx.create_v2(0,0);
		this.setCollisionBehavior(collision_behavior || 'none', params);
		// a list of normals acting against this body preventing it from moving in that direction.
		this._blocking_normals = [];
	}
	_update(body, dt) {
		// update velocity based on blocking normals, clearing the blocking normals in the process
		while (this._blocking_normals.length > 0) {
			var normal = this._blocking_normals.pop();
			var s = mtx.dot_v2(this.velocity, normal);
			if (s < 0) {
				// project the normal in the direction of the velocity
				var n_proj = mtx.mult_s_v2(s/mtx.dot_v2(this.velocity, this.velocity), this.velocity, mtx.uninit_v2());
				// remove a scale of that projection fromt the velocity
				mtx.mult_s_add_v2(-s, n_proj, this.velocity, this.velocity);
			}
		}
		body.translate(mtx.mult_s_v2(dt, this.velocity, mtx.uninit_v2()));
		mtx.mult_s_add_v2(dt, this.acceleration, this.velocity, this.velocity);
	}
	setCollisionBehavior(behavior, params) {
		this._params = params || {};
		this._on_collision = function(){};
		this._on_overlap = function(){};
		this.behavior = behavior;
		if (!('enforce_no_overlap' in this._params))
			this._params.enforce_no_overlap = function() {return false;};
		if (!('ignore' in this._params))
			this._params.ignore = function() {return false;};
		if (behavior === 'none') {
			// keep defaults
		} else if (behavior === 'bounce' || behavior === 'stop') {
			if (!('bounciness' in this._params))
				this._params.bounciness = 1;
			if (this._params.bounciness < 0 || this._params.bounciness > 1)
				throw new Error("Invalid bounciness: "+this._params.bounciness);
			this._on_overlap = function(event){
				if (this._params.ignore(event.other))
					return;
				// prevent further travel in against the direction of the overlap
				if (event.normal && behavior === 'stop')
					this._blocking_normals.push(mtx.copy_v2(event.normal, mtx.uninit_v2()));
				// reflect the velocity using the normal if velocity is going against the normal
				if (this.behavior === 'bounce') {
					var s = -(1+this._params.bounciness)*mtx.dot_v2(this.velocity, event.normal);
					if (s > 0) {
						mtx.mult_s_add_v2(s, event.normal, this.velocity, this.velocity);
					}
				}
				// back up to the point of collision
				var backtravel = mtx.uninit_v2();
				mtx.mult_s_v2(event.t-1, event.body.travel(), backtravel);	
				event.body.translate(backtravel);
				if (this.behavior === 'bounce') {
					// travel along the new velocity for the time after the bounce
					var forwardtravel = mtx.mult_s_v2(
						(1-event.t)*event.real_interval, this.velocity, mtx.uninit_v2());
					event.body.translate(forwardtravel);
				}
				if (this._params.enforce_no_overlap(event.other)) {
					// forcefully move this object along the collision normal until it's no longer overlapping
					var collision = event.engine.testCollision(event.body, event.other, true);
					if (collision) {
						var minTranslation = 0;
						var maxTranslation = 1;
						var curTranslated = 0;
						var deltaLength = maxTranslation;
						var deltaVector = mtx.uninit_v2();
						var iters = 0;
						var phase = 'expand';
						while ((maxTranslation-minTranslation) > 0.1 && iters < 10) {
							mtx.mult_s_v2(deltaLength-curTranslated, event.normal, deltaVector);
							event.body.translate(deltaVector);
							curTranslated = deltaLength;
							collision = event.engine.testCollision(event.body, event.other, true);
							if (collision) {
								if (phase === 'expand') {
									minTranslation = maxTranslation;
									maxTranslation *= 2;
									deltaLength = maxTranslation;
								} else {
									minTranslation = deltaLength;
									deltaLength = 0.5*(maxTranslation+minTranslation);
								}
							} else {
								phase = 'narrow';
								maxTranslation = deltaLength;
								deltaLength = 0.5*(maxTranslation+minTranslation);
							}
							iters++;
						}
					}
				}
			};
		} else {
			throw new Error('Invalid collision behavior: '+behavior);
		}
	}
}

function _test_collision_circle_inf_bound(circle1, circle2, inf_bound) {
	// assumes inf_bound.normal is noramlized
	// assumes circle1.radius === circle2.radius if circle1 !== null
	// Get the vector from a point on the inf_bound to the second circle's center
	var ibp_to_c2c = mtx.uninit_v2();
	mtx.sub_v2(circle2.center, inf_bound.point, ibp_to_c2c);
	// Dot that vector with the inf_bound's normal to get the
	// signed distance from the inf_bound to circle2's center.
	var d = mtx.dot_v2(ibp_to_c2c, inf_bound.normal);
	if (d > circle2.radius) {
		// no collision detected
		return null;
	}
	// collision detected
	var collision = {
		'_normal1': inf_bound.normal, // normal acting against first body
	};
	if (circle1 === null) {
		collision.t = 1;
		return collision;
	}
	// calculate exact t
	var c1c_to_c2c = mtx.uninit_v2();
	mtx.sub_v2(circle2.center, circle1.center, c1c_to_c2c);
	collision.t = 1 - ((circle2.radius-d)/mtx.length_v2(c1c_to_c2c));
	if (collision.t > 1) collision.t = 1;
	if (collision.t < 0) collision.t = 0;
	return collision;
}

function _test_collision_circle_circle(circleA, circleB) {
	var a_to_b = mtx.sub_v2(circleB.center, circleA.center, mtx.uninit_v2());
	var d = mtx.length_v2(a_to_b);
	if (d > (circleA.radius+circleB.radius)) {
		// no collision detected
		return null;
	}
	var collision = {t:1};
	// the normal acting against circleB
	collision._normal2 = mtx.mult_s_v2(1/d, a_to_b, mtx.uninit_v2());
	// the normal acting against circleA
	collision._normal1 = mtx.mult_s_v2(-1, collision._normal2, a_to_b);
	return collision;
}

function _test_collision_rline_inf_bound(rline1, rline2, inf_bound) {
	var rline1_c1 = {
		radius: rline1.radius,
		center: rline1.p1
	};
	var rline1_c2 = {
		radius: rline1.radius,
		center: rline1.p2
	};
	var rline2_c1 = {
		radius: rline2.radius,
		center: rline2.p1
	};
	var rline2_c2 = {
		radius: rline2.radius,
		center: rline2.p2
	};
	var collision1 = _test_collision_circle_inf_bound(rline1_c1, rline2_c1, inf_bound);
	var collision2 = _test_collision_circle_inf_bound(rline1_c2, rline2_c2, inf_bound);
	if (!collision1 || !collision2) {
		return collision1 || collision2;
	}
	if (collision1.t <= collision2.t)
		return collision1;
	return collision2;
}

function _test_collision_circle_rline(circle, rline) {
	// get the vector from the start to the end of rline
	var p12 = mtx.sub_v2(rline.p2, rline.p1, mtx.uninit_v2());
	// and a vector from p1 to the circle's center
	var p1_to_c = mtx.sub_v2(circle.center, rline.p1, mtx.uninit_v2());
	// get the projection of that vector to the circle's center along p12
	var s = mtx.dot_v2(p12, p1_to_c)/mtx.dot_v2(p12, p12);
	if (0 < s && s < 1) {
		var proj = mtx.mult_s_v2(s, p12, mtx.uninit_v2());
		// use that to get the normal from the rline to the circle's center
		var norm = mtx.add_v2(rline.p1, proj, mtx.uninit_v2());
		mtx.sub_v2(circle.center, norm, norm);
		var d = mtx.length_v2(norm);
		if (d <= circle.radius + rline.radius) {
			mtx.normalize_v2(norm, norm);
			var collision = {
				_normal1: norm, // the normal acting against the circle
				_normal2: mtx.mult_s_v2(-1, norm, mtx.uninit_v2()), // the normal acting against the rline
				t: 1
			}
			return collision;
		}
	}
	var rline_c1 = {
		radius: rline.radius,
		center: rline.p1
	};
	var collision = _test_collision_circle_circle(circle, rline_c1);
	if (collision)
		return collision;
	var rline_c2 = {
		radius: rline.radius,
		center: rline.p2
	};
	return _test_collision_circle_circle(circle, rline_c2);
}

export function initCircle(center, radius) {
	var params = {center: center, radius: radius};
	return new CollisionBody('circle', params);
}

export function initInfiniteBoundary(point, normal) {
	var params = {point: point, normal:mtx.normalize_v2(normal, mtx.uninit_v2())};
	return new CollisionBody('inf_bound', params);
}

export function initRoundedLine(point1, point2, radius) {
	var params = {p1:point1, p2:point2, radius:radius};
	return new CollisionBody('rline', params);
}
