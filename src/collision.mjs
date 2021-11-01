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

// TODO: implement sweep and prune

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
			"circle:circle": {
				"call_type": "ss",
				"test": _test_collision_circle_circle
			},
			"circle:inf_bound": {
				"call_type": "ds",
				"test": _test_collision_circle_inf_bound
			}
		}
	}
	_handle_collision(body, event) {
		event.body = body;
		var physics = this._physics[body._index];
		if (physics)
			physics._on_collision(event);
		event.physics = physics;
		for (var i in body._on_collision_callbacks) {
			body._on_collision_callbacks[i](event);
		}
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
		function testCollision(body1, body2) {
			var key = body1._type+':'+body2._type;
			if (!(key in collision_tests)) {
				var tmp = body1;
				body1 = body2;
				body2 = tmp;
				key = body1._type+':'+body2._type;
			}
			var test = collision_tests[key];
			if (test === 'none')
				return;
			if (!test)
				throw new Error("No collision test for body interaction "+key);
			var collision = null;
			if (test.call_type === "ss")
				collision = test.test(body1._params, body2._params);
			else if (test.call_type=== "ds")
				collision = test.test(body1._prev_params, body1._params, body2._params);
			else if (test.call_type === "dd")
				collision = test.test(body1._prev_params, body1._params, body2._prev_params, body2._params);
			else
				throw new Error("Unknown collision test call_type: "+test.call_type);
			if (collision) {
				collision._body1_idx = body1._index;
				collision._body2_idx = body2._index;
				collisions.push(collision);
			}
		}
		this.broad_pass(this._bodies, testCollision);
		collisions.sort(function cmp(a,b) { return a.t-b.t; });
		for (var i in this._bodies) {
			this._bodies[i]._prev_overlapping = this._bodies[i]._overlapping || new Set();
			this._bodies[i]._overlapping = new Set();
		}
		for (var i in collisions) {
			var collision = collisions[i];
			var body1 = this._bodies[collision._body1_idx];
			var body2 = this._bodies[collision._body2_idx];
			body1._overlapping.add(body2._index);
			body2._overlapping.add(body1._index);
			if (body1._prev_overlapping.has(body2._index))
				continue;

			collision.real_interval = dt;

			collision.other = body2;
			collision.normal = collision._normal1;
			collision.other_normal = collision._normal2;
			this._handle_collision(body1, collision);

			collision.other = body1;
			collision.normal = collision._normal2;
			collision.other_normal = collision._normal1;
			this._handle_collision(body2, collision);
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
			// TODO
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
	onCollision(callback) {
		this._on_collision_callbacks.push(callback);
	}
}

export class BasicPhysics {
	constructor(collision_behavior) {
		this.velocity = mtx.create_v2(0,0);
		this.acceleration = mtx.create_v2(0,0);
		this.setCollisionBehavior(collision_behavior || 'none');
	}
	_update(body, dt) {
		body.translate(mtx.mult_s_v2(dt, this.velocity, mtx.uninit_v2()));
		mtx.mult_s_add_v2(dt, this.acceleration, this.velocity, this.velocity);
	}
	setCollisionBehavior(behavior) {
		if (behavior === 'none') {
			this._on_collision = function(){};
		} else if (behavior === 'bounce') {
			this._on_collision = function(event){
				// reflect the velocity using the normal
				var s = -2*mtx.dot_v2(this.velocity, event.normal);
				if (s > 0)
					mtx.mult_s_add_v2(s, event.normal, this.velocity, this.velocity);
				// back up to the point of collision
				var backtravel = event.body.travel();
				mtx.mult_s_v2(event.t-1, backtravel, backtravel);	
				event.body.translate(backtravel);
				// travel along the new velocity for the time after the bounce
				var forwardtravel = mtx.mult_s_v2(
					(1-event.t)*event.real_interval, this.velocity, mtx.uninit_v2());
				event.body.translate(forwardtravel);
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

export function initCircle(center, radius) {
	var params = {center: center, radius: radius};
	return new CollisionBody('circle', params);
}

export function initInfiniteBoundary(point, normal) {
	var params = {point: point, normal:mtx.normalize_v2(normal, mtx.uninit_v2())};
	return new CollisionBody('inf_bound', params);
}
