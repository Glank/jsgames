// My attempt at a 'simple' collision detection engine.

import * as mtx from "../mtx.mjs";

// The default broad pass for the CollisionEngine. Tests every possible body combination.
export function exhaustive(engine, testCollision) {
	for (var i = 0; i < engine.bodies.length; i++) {
		for (var j = i+1; j < engine.bodies.length; j++) {
			testCollision(engine.bodies[i], engine.bodies[j]);
		}
	}
}

// TODO: implement sweep and prune

export class CollisionEngine {
	constructor() {
		// a list of CollisionBodies (see below)
		this._bodies = [];
		// a function which takes the collision engine and a callback 'testCollision' which should be called on every pair of bodies that might collide.
		this.broad_pass = exhaustive;
		// a directory of previous states of the object bodies. Each state record is of the form:
		// body_index: {
		//   overlapping: null || list,
		//   params: body parameters
		// }
		this.previous_states = {},
		// Collision test types:
		// ss: static-static, test(body1, body2)
		// ds: dynamic-static, test(body1start, body1end, body2)
		// dd: dynamic-dynamic test(body1start, body1end, body2start, body2end)
		this.collision_tests = {
			"circle:inf_bound": {
				"call_type": "ds",
				"test": _test_collision_circle_inf_bound
			}
		}
		this.on_collision_callbacks = {}
	}
	addBody(body) {
		body.index = this._bodies.length;
		this._bodies.push(body);
	}
	update(dt) {
		// TODO: apply physics updates
		var collisions = []
		var collision_tests = this.collision_tests;
		function testCollision(body1, body2) {
			var key = body1.type+':'+body2.type;
			if (!(key in collision_tests)) {
				var tmp = body1;
				body1 = body2;
				body2 = tmp;
				key = body1.type+':'+body2.type;
			}
			var test = collision_tests[key];
			if (!test)
				throw "No collision test for body interaction "+key;
			var collision = null;
			if test.call_type === "ss":
				collision = test.test(body1._params, body2._params);
			else if test.call_type=== "ds":
				collision = test.test(body1._prev_params, body1._params, body2._params);
			else if test.call_type === "dd":
				collision = test.test(body1._prev_params, body1._params, body2._prev_params, body2._params);
			else:
				throw "Unknown collision test call_type: "+test.call_type;
			if (collision) {
				collision.body1 = body1.index;
				collision.body2 = body2.index;
				collisions.push(collision);
			}
		}
		this.broad_pass(this._bodies, testCollision);
		collisions.sort(function cmp(a,b) { return a.t-b.t; });
		// TODO: sort and resolve collisions
		for (var body in this._bodies) {
			body._prev_params = body._params;
		}
	}
}

// Supported Types:
// 	- 'circle' with parameters [radius, center]
//  - 'rline' (rounded line segment) with parameters [radius, p1, p2]
//	- 'inf_bound' with parameters [normal, point]
export class CollisionBody {
	constructor(type, params) {
		this._type = type;
		this._params = params;
		// the parameters before any given physics update
		this._prev_params = params;
		this.translate = function() { throw 'Translate unsuported in CollisionBody '+type; };
		this.physics = null;
		if (this._type === 'circle') {
			this.translate = function(delta) { return _translate_circle(this, delta) };
		) else if (this._type === 'rline') {
			// TODO
		} else if (this._type === 'inf_bound') {
			// no translate
		} else {
			throw 'Invalid CollisionBody type: '+type;
		}
	}
	setParameters(newParams) {
		this._params = newParams;
	}
}

function _translate_circle(body, delta) {
	newParams = {
		'radius': body.params.radius,
		'center': mtx.uninit_v2(),
	}
	mtx.add_v2(delta, body.params.center, newParams.center);
	return newParams;
}

function _test_collision_circle_inf_bound(circle1, circle2, inf_bound) {
	// assumes inf_bound.normal is noramlized
	// assumes circle1.radius === circle2.radius if circle1 !== null
	// Get the vector from a point on the inf_bound to the second circle's center
	var ibp_to_c2c = mtx.uninit_v2();
	mtx.sub_v2(inf_bound.point, circle2.center, ibp_to_c2c);
	// Dot that vector with the inf_bound's normal to get the
	// signed distance from the inf_bound to circle2's center.
	var d = mtx.dot(ibp_to_c2c, inf_bound.norml);
	if (d > circle2.radius) {
		// no collision detected
		return null;
	}
	// collision detected
	collision = {
		'normal1': inf_bound.normal, // normal acting against first body
	};
	if (circle1 === null) {
		collision.t = 1;
		return collision;
	}
	// calculate exact t
	var c1c_to_c2c = mtx.uninit_v2();
	mtx.sub_v2(circle2.center, circle1.center, c1c_to_c2c);
	collision.t = (circle2.radius-d)/mtx.length_v2(c1c_to_c2c);
	return collision;
}
