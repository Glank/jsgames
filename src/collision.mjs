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
		this.bodies = [];
		// a function which takes the collision engine and a callback 'testCollision' which should be called on every pair of bodies that might collide.
		this.broad_pass = exhaustive;
		// a set of bodies (indexes) that currently overlap used for disambiguating new vs sustained collisions
		this.current_overlaps = new Set(),
	}
	update(dt) {
		// TODO
		for (var body in this.bodies) {
			body._modified = false;
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
		// this is a flag indicating that the parameters have changed since the last engine update
		this._modified = true;
		this.translate = function() { throw 'Translate unsuported in CollisionBody '+type; };
		this.physics = null;
		if (this._type === 'circle') {
			this.translate = function(delta) { return _translate_circle(this, delta) };
		) else if (this._type === 'rline') {
			// TODO
		} else if (this._type === 'inf_bound') {
			// TODO
		} else {
			throw 'Invalid CollisionBody type: '+type;
		}
	}
	setParameters(newParams) {
		this._params = newParams;
		this._modified = true;
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
