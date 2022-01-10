'use strict';

var gm = require('../game.js');
var mbl = require('../mobile_check.js');
var cln = require('../collision.js');
var mtx = require('../mtx.js');

function calcLift(velocity, angleOfAttack, liftCoef) {
	var s2a = -Math.sin(2*angleOfAttack);
	return mtx.create_v2(
		-liftCoef*velocity[1]*s2a,
		liftCoef*velocity[0]*s2a,
	);
}

function calcDrag(velocity, angleOfAttack, dragCoef) {
	return mtx.mult_s_v2(-dragCoef*Math.abs(Math.sin(angleOfAttack)), velocity, mtx.uninit_v2());
}

function initFlyer(game, engine) {
  var flyer = {
    xOffset: 20,
    length: 100,
    radius: 5,
    game: game,
    engine: engine,
    angularDir: 0,
    angularSpeed: 1, // radians/s
    liftCoef: 0.5,
    dragCoef: 0.5,
    mass: 1,
		tailAngle: Math.PI,
		tailAngularSpeed: 1, // radians/s
		tailLength: 20,
		tailLiftCoef: 0.1,
		tailDragCoef: 0.1,
		angularInertia: 10000,
  };
  flyer.body = cln.initRoundedLine(
    [flyer.xOffset, game.height/2],
    [flyer.xOffset+flyer.length, game.height/2],
    flyer.radius);
  flyer.physics = new cln.BasicPhysics();
  flyer.physics.velocity[0] = 70;
  flyer.physics.velocity[1] = 70;
  engine.addBody(flyer.body, flyer.physics);
  flyer.screenAngle = function() {
    var p1 = this.body.get('p1');
    var p2 = this.body.get('p2');
    var dx = p2[0]-p1[0];
    var dy = p2[1]-p1[1];
    var angle = Math.atan2(dy, dx);
    return angle;
  }
  flyer.draw = function(ctx) {
    // draw flyer
    ctx.lineWidth = this.body.get('radius')*2;
    ctx.lineCap = "round";
    ctx.strokeStyle = "black";
    ctx.beginPath();
    var angle = this.screenAngle();
    var p1 = [
      this.xOffset+this.length*0.5-0.5*this.length*Math.cos(angle),
      this.game.height*0.5-0.5*this.length*Math.sin(angle)
    ];
    var p2 = [
      this.xOffset+this.length*0.5+0.5*this.length*Math.cos(angle),
      this.game.height*0.5+0.5*this.length*Math.sin(angle)
    ];
    ctx.moveTo(p1[0], p1[1]);
    ctx.lineTo(p2[0], p2[1]);
    ctx.stroke();

		var tailScreenAngle = this.tailScreenAngle();
		var p3 = [
			p1[0]+this.tailLength*Math.cos(tailScreenAngle),
			p1[1]+this.tailLength*Math.sin(tailScreenAngle)
		]
		ctx.beginPath();
    ctx.moveTo(p1[0], p1[1]);
    ctx.lineTo(p3[0], p3[1]);
		ctx.stroke();

		// draw tail force
		var p4 = mtx.average_v2(p1, p3, mtx.uninit_v2());
		ctx.lineWidth = 1;
		ctx.strokeStyle = "black";
		ctx.moveTo(p4[0], p4[1]);
		mtx.add_v2(this.tailForce(), p4, p4);
		ctx.lineTo(p4[0], p4[1]);
		ctx.stroke();

    // draw velocity
    ctx.lineWidth = 1;
    ctx.strokeStyle = "blue";
    ctx.beginPath();
    p1 =  [this.xOffset+this.length*0.5, this.game.height*0.5];
    p2 = mtx.add_v2(this.physics.velocity, p1, p2);
    ctx.moveTo(p1[0], p1[1]);
    ctx.lineTo(p2[0], p2[1]);
    ctx.stroke();

    // draw lift 
    ctx.lineWidth = 1;
    ctx.strokeStyle = "red";
    ctx.beginPath();
    p2 = mtx.add_v2(this.getLift(), p1, p2);
    ctx.moveTo(p1[0], p1[1]);
    ctx.lineTo(p2[0], p2[1]);
    ctx.stroke();

    // draw drag
    ctx.beginPath();
    p2 = mtx.add_v2(this.getDrag(), p1, p2);
    ctx.moveTo(p1[0], p1[1]);
    ctx.lineTo(p2[0], p2[1]);
    ctx.stroke();
  }
  flyer.handleKeyDown = function(e) {
    if(e.code === 'ArrowDown') {
      this.angularDir = 1;
    } else if(e.code === 'ArrowUp') {
      this.angularDir = -1;
    }
  }
  flyer.handleKeyUp = function(e) {
    if(e.code === 'ArrowDown' && this.angularDir === 1) {
      this.angularDir = 0;
    } else if(e.code === 'ArrowUp' && this.angularDir === -1) {
      this.angularDir = 0;
    }
  }
  flyer.getCenter = function() {
    var p1 = this.body.get('p1');
    var p2 = this.body.get('p2');
    return mtx.average_v2(p1, p2, mtx.uninit_v2());
  }
  flyer.angleOfAttack = function() {
    var v = this.physics.velocity;
    var velocityAngle = Math.atan2(v[1], v[0]);
    var screenAngle = this.screenAngle();
    return velocityAngle-screenAngle;
  }
  flyer.getLift = function() {
		return calcLift(
			this.physics.velocity,
			this.angleOfAttack(),
			this.liftCoef
		);
  }
  flyer.getDrag = function() {
		return calcDrag(
			this.physics.velocity,
			this.angleOfAttack(),
			this.dragCoef
		);
  }
	flyer.tailScreenAngle = function() {
		return this.screenAngle()+this.tailAngle;
	}
	flyer.tailAngleOfAttack = function() {
    var v = this.physics.velocity;
    var velocityAngle = Math.atan2(v[1], v[0]);
    var screenAngle = this.tailScreenAngle();
    return velocityAngle-screenAngle;
	}
	flyer.tailForce = function() {
		var aoa = this.tailAngleOfAttack();
		var lift = calcLift(this.physics.velocity, aoa, this.tailLiftCoef);
		var drag = calcDrag(this.physics.velocity, aoa, this.tailDragCoef);
		return mtx.add_v2(lift, drag, drag);
	}
	flyer.tailTorque = function() {
		var f = this.tailForce();
		var body = mtx.sub_v2(this.body.get('p1'), this.body.get('p2'), mtx.uninit_v2());
		var proj = mtx.mult_s_v2(
			mtx.dot_v2(f, body)/(this.length*this.length),
			body, mtx.uninit_v2());
		var norm = mtx.sub_v2(f, proj, mtx.uninit_v2());
		var torque = mtx.length_v2(norm)*this.length/2;
		var rot = mtx.create_v2(f[1], -f[0])
		if (mtx.dot_v2(rot, body) < 0)
			torque = -torque;
		return torque;
	}
  flyer.update = function(dt) {
    // handle user input to update angle
		this.tailAngle += dt*this.angularDir*this.tailAngularSpeed;
    var center = this.getCenter();
    var angle = this.screenAngle();
		var torque = this.tailTorque();
		this.angularSpeed += dt*(torque/this.angularInertia);
    angle += dt*this.angularSpeed;
    mtx.set_v2(
      center[0]-this.length*0.5*Math.cos(angle),
      center[1]-this.length*0.5*Math.sin(angle),
      this.body.get('p1') 
    );
    mtx.set_v2(
      center[0]+this.length*0.5*Math.cos(angle),
      center[1]+this.length*0.5*Math.sin(angle),
      this.body.get('p2') 
    );
    // apply all forces
    var forces = mtx.create_v2(0, 300*this.mass);
    mtx.add_v2(this.getLift(), forces, forces);
    mtx.add_v2(this.getDrag(), forces, forces);
    mtx.mult_s_v2(1/this.mass, forces, flyer.physics.acceleration);
		game.debug.aoa = this.angleOfAttack();
		game.debug.taoa = this.tailAngleOfAttack();
		game.debug.torque = this.tailTorque();
  }
  return flyer;
}

function floatMod(x, mod) {
  return x-mod*Math.floor(x/mod);
}

(function() {
  var div = document.getElementById("game");
  var game = gm.initGame(div, 480*2, 480);
  var engine = new cln.CollisionEngine();

  var flyer = initFlyer(game, engine);
  const sky = new Image();
  sky.src = '../images/sky.png';

  var view = mtx.create_v2(0,0);

  game.draw = function(ctx) {
    for (var dx of [0, game.width]) for (var dy of [0, game.height])
      ctx.drawImage(sky, dx-floatMod(view[0], game.width), dy-floatMod(view[1], game.height), game.width, game.height);
    flyer.draw(ctx);
  };

  game.update = function(dt) {
    engine.update(dt);
    flyer.update(dt);
    mtx.sub_v2(
      flyer.getCenter(),
      [flyer.xOffset+0.5*flyer.length, game.height/2],
      view);
  };

  game.set_frame_interval(1000/60 | 0); // ~60fps

  document.addEventListener('keydown', function(e) {
    flyer.handleKeyDown(e);
  });
  document.addEventListener('keyup', function(e) {
    flyer.handleKeyUp(e);
  });

  game.print_debug = true;
})();
