import * as collision from "../src/collision.mjs";
import * as mtx from "../src/mtx.mjs";
import {assert, approx}  from "../src/test_utils.mjs";

function circleCollidesWithInfBound() {
  var engine = new collision.CollisionEngine();

  var center = mtx.create_v2(0, 0);
  var circle = collision.initCircle(center, 5);
  engine.addBody(circle);

  var point = mtx.create_v2(-4, 0);
  var normal = mtx.create_v2(1, 0);
  var boundary = collision.initInfiniteBoundary(point, normal);
  engine.addBody(boundary);

  var collision_occured = false;
  var real_callback = function (event) {
    collision_occured = true;
    assert(0 <= event.t && event.t <= 1, "Expected t to be in [0,1] but got "+event.t);
    var diff = mtx.length_v2(mtx.sub_v2(event.normal, mtx.create_v2(1,0), mtx.uninit_v2()))
    assert(approx(diff, 0), "Expected the normal to be approximately <1,0>");
  };
  circle.onCollision(function (event) {
    real_callback(event); 
  });
  engine.update(0.1);
  assert(collision_occured, "Expected ball to collide with boundary.");
  
  circle.translate(mtx.create_v2(-1, 0));
  real_callback = function (event) {
    assert(false, "Expected no collision.");
  };
  engine.update(0.1);

  circle.translate(mtx.create_v2(3, 0));
  engine.update(0.1);

  collision_occured = false;
  circle.translate(mtx.create_v2(-2, 0));
  var real_callback = function (event) {
    collision_occured = true;
    assert(approx(event.t, 0.5), "Expected t to be in 0.5 but got "+event.t);
    var diff = mtx.length_v2(mtx.sub_v2(event.normal, mtx.create_v2(1,0), mtx.uninit_v2()))
    assert(approx(diff, 0), "Expected the normal to be approximately <1,0>");
  };
  engine.update(0.1);
}

function basicPhysics() {
  var engine = new collision.CollisionEngine();

  var center = mtx.create_v2(0, 0);
  var circle = collision.initCircle(center, 1);
  var physics = new collision.BasicPhysics();
  engine.addBody(circle, physics);

  var point = mtx.create_v2(-5, 0);
  var normal = mtx.create_v2(1, 0);
  var boundary = collision.initInfiniteBoundary(point, normal);
  engine.addBody(boundary);

  physics.velocity[0] = -5;
  var collision_occured = false;
  var real_callback = function (event) {
    collision_occured = true;
    assert(approx(event.t, 0.8), "Expected t to be in 0.8 but got "+event.t);
    var diff = mtx.length_v2(mtx.sub_v2(event.normal, mtx.create_v2(1,0), mtx.uninit_v2()))
    assert(approx(diff, 0), "Expected the normal to be approximately <1,0>");
  };
  circle.onCollision(function (event) {
    real_callback(event); 
  });
  engine.update(1.0);
  assert(collision_occured, "Expected ball to collide with boundary.");

  circle.set('center', mtx.create_v2(0, 0));
  physics.velocity[0] = 0;
  physics.acceleration[0] = -1;
  collision_occured = false;
  real_callback = function (event) {
    collision_occured = true;
    var diff = mtx.length_v2(mtx.sub_v2(event.normal, mtx.create_v2(1,0), mtx.uninit_v2()))
    assert(approx(diff, 0), "Expected the normal to be approximately <1,0>");
  };
  for(var t = 0; t < 10 && !collision_occured; t+=0.1) {
    engine.update(0.1);
  }
  assert(collision_occured, "Expected ball to collide with boundary.");
}

function basicBounce() {
  var engine = new collision.CollisionEngine();

  var center = mtx.create_v2(0, 0);
  var circle = collision.initCircle(center, 1);
  var physics = new collision.BasicPhysics('bounce');
  engine.addBody(circle, physics);

  var point = mtx.create_v2(-5, 0);
  var normal = mtx.create_v2(1, 0);
  var boundary = collision.initInfiniteBoundary(point, normal);
  engine.addBody(boundary);

  physics.velocity[0] = -5;
  var collision_occured = false;
  var real_callback = function (event) {
    collision_occured = true;
    assert(approx(event.t, 0.8), "Expected t to be in 0.8 but got "+event.t);
    var diff = mtx.length_v2(mtx.sub_v2(event.normal, mtx.create_v2(1,0), mtx.uninit_v2()))
    assert(approx(diff, 0), "Expected the normal to be approximately <1,0>");
  };
  circle.onCollision(function (event) {
    real_callback(event); 
  });
  engine.update(1.0);
  assert(collision_occured, "Expected ball to collide with boundary.");
  
  var diff = mtx.length_v2(mtx.sub_v2(circle.get('center'), mtx.create_v2(-3,0), mtx.uninit_v2()))
  assert(approx(diff, 0), "Expectedthe new center to be (-3, 0)");
  diff = mtx.length_v2(mtx.sub_v2(physics.velocity, mtx.create_v2(5,0), mtx.uninit_v2()))
  assert(approx(diff, 0), "Expected the new velocity to be <5,0>");
}

function rline() {
  for (var i = 0; i < 2; i++) {
    var engine = new collision.CollisionEngine();
    var p1 = mtx.create_v2(0, 0);
    var p2 = mtx.create_v2(5, 0);
    if (i === 1) {
      var tmp = p1;
      p1 = p2;
      p2 = tmp;
    }
    var rline = collision.initRoundedLine(p1, p2, 1);
    engine.addBody(rline);
    var real_callback;
    rline.onCollision(function(event) { real_callback(event); });

    var point = mtx.create_v2(0, 0);
    var normal = mtx.create_v2(1, 0);
    var boundary = collision.initInfiniteBoundary(point, normal);
    engine.addBody(boundary);

    var collision_occured = false;
    real_callback = function (event) {
      collision_occured = true;
      assert(0 <= event.t && event.t <= 1, "Expected t to be in [0,1] but got "+event.t);
      var diff = mtx.length_v2(mtx.sub_v2(event.normal, mtx.create_v2(1,0), mtx.uninit_v2()))
      assert(approx(diff, 0), "Expected the normal to be approximately <1,0>");
    };
    engine.update(0.1);
    assert(collision_occured, "Expected collision.");

    rline.translate([2,0]);
    real_callback = function (event) {
      assert(false, "Expected no collision.");
    };
    engine.update(0.1);
    engine.update(0.1);

    rline.translate([-2,0]);
    collision_occured = false;
    real_callback = function (event) {
      collision_occured = true;
      assert(approx(event.t, 0.5), "Expected t to be about 0.5 but got "+event.t);
      var diff = mtx.length_v2(mtx.sub_v2(event.normal, mtx.create_v2(1,0), mtx.uninit_v2()))
      assert(approx(diff, 0), "Expected the normal to be approximately <1,0>");
    };
    engine.update(0.1);
    assert(collision_occured, "Expected collision.");
  }
}

function rlineAndBall() {
  for (var i = 1; i < 2; i++) {
    var engine = new collision.CollisionEngine();
    var p1 = [0,0];
    var p2 = [5,0];
    if (i === 1) {
      var tmp = p1;
      p1 = p2;
      p2 = tmp;
    }
    var rline = collision.initRoundedLine(p1, p2, 1);
    engine.addBody(rline);

    var circle = collision.initCircle([2,1], 1);
    engine.addBody(circle);
    var real_callback;
    circle.onCollision(function (event) { real_callback(event); });

    var collision_occured = false;
    real_callback = function(event) {
      collision_occured = true;
      assert(0 <= event.t && event.t <= 1, "Expected t to be in [0,1] but got "+event.t);
      var diff = mtx.length_v2(mtx.sub_v2(event.normal, mtx.create_v2(0,1), mtx.uninit_v2()))
      assert(approx(diff, 0), "Expected the normal to be approximately <0,1>");
    };
    engine.update(0.1);
    assert(collision_occured, "Expected a collision.");
  }
}

circleCollidesWithInfBound();
basicPhysics();
basicBounce();
rline();
rlineAndBall();
