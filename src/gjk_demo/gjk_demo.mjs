import * as gm from "../game.mjs";
import * as cln from "../collision.mjs";
import * as mtx from "../mtx.mjs";

function drawPolygon(ctx, polygon) {
  ctx.beginPath();
  var pts = polygon.get('points')
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (var i = 1; i < pts.length; i++) {
    ctx.lineTo(pts[i][0], pts[i][1]);
  }
  ctx.closePath();
}

(function() {
  var div = document.getElementById("game");
  var game = gm.initGame(div, 480, 480*2);
  var engine = new cln.CollisionEngine();

  var poly1 = new cln.CollisionBody('convex_poly', {
    points:[
      [100, 300],
      [200, 300],
      [250, 350],
      [150, 400],
      [100, 390]
    ]
  });
  engine.addBody(poly1);
  var poly1_center = poly1.center();
  var poly1_support_angle = 0;
  function poly1_support_d() {
    return mtx.create_v2(
      Math.cos(poly1_support_angle),
      Math.sin(poly1_support_angle)
    );
  }

  var poly2 = new cln.CollisionBody('convex_poly', {
    points:[
      [300, 400],
      [150, 350],
      [200, 450]
    ]
  });
  var speed = 20; // pxls/s
  var poly2_physics = new cln.BasicPhysics('none');
  engine.addBody(poly2, poly2_physics);
  var collision = null;
  poly2.onOverlap(function(e) {
    collision = e;
  });

  game.draw = function(ctx) {
    // poly1 & 2
    ctx.lineWidth = 3;
    ctx.strokeStyle = "black";
    drawPolygon(ctx, poly1);
    ctx.stroke();
    if (poly2._overlapping && poly2._overlapping.size> 0) {
      ctx.strokeStyle = "red";
    }
    drawPolygon(ctx, poly2);
    ctx.stroke();

    // support function direction
    ctx.strokeStyle = "blue";
    ctx.beginPath();
    ctx.moveTo(poly1_center[0], poly1_center[1]);
    var pt2 = mtx.mult_s_add_v2(20, poly1_support_d(), poly1_center, mtx.uninit_v2());
    ctx.lineTo(pt2[0], pt2[1]);
    ctx.stroke();

    // support function result
    var sp = poly1.gjk_support(poly1_support_d());
    ctx.beginPath();
    ctx.arc(sp[0], sp[1], 10, 0, 2*Math.PI);
    ctx.closePath();
    ctx.fillStyle = "red";
    ctx.fill();

    if(collision && collision.surface) {
      // normal against body1
      var surface_mid = mtx.average_v2(collision.surface[0], collision.surface[1], mtx.uninit_v2());
      ctx.strokeStyle = "red";
      ctx.beginPath();
      ctx.moveTo(surface_mid[0], surface_mid[1]);
      var norm_end = mtx.mult_s_add_v2(20, collision.other_normal, surface_mid, mtx.uninit_v2());
      ctx.lineTo(norm_end[0], norm_end[1]);
      ctx.stroke();

      // normal against body2
      surface_mid = mtx.average_v2(collision.other_surface[0], collision.other_surface[1], mtx.uninit_v2());
      ctx.strokeStyle = "red";
      ctx.beginPath();
      ctx.moveTo(surface_mid[0], surface_mid[1]);
      norm_end = mtx.mult_s_add_v2(20, collision.normal, surface_mid, mtx.uninit_v2());
      ctx.lineTo(norm_end[0], norm_end[1]);
      ctx.stroke();
    }
  };

  game.update = function(dt) {
    poly1_support_angle += 1.5*dt;
    if (!game.debug.error_message) {
      engine.update(dt);
    }
  };
  game.set_frame_interval(Math.trunc(1000/60));

  var fs_button = document.getElementById("open_fullscreen");
  fs_button.onclick = function() {
    gm.tryFullscreen(div);
  };

  document.addEventListener('keydown', function(e) {
    if(e.code === 'ArrowLeft') {
      poly2_physics.velocity[0] = -speed;
    } else if(e.code === 'ArrowRight') {
      poly2_physics.velocity[0] = speed;
    } else if(e.code === 'ArrowDown') {
      poly2_physics.velocity[1] = speed;
    } else if(e.code === 'ArrowUp') {
      poly2_physics.velocity[1] = -speed;
    }
  });
  document.addEventListener('keyup', function(e) {
    if(e.code === 'ArrowLeft') {
      poly2_physics.velocity[0] = 0;
    } else if(e.code === 'ArrowRight') {
      poly2_physics.velocity[0] = 0;
    } else if(e.code === 'ArrowDown') {
      poly2_physics.velocity[1] = 0;
    } else if(e.code === 'ArrowUp') {
      poly2_physics.velocity[1] = 0;
    }
  });

  game.print_debug = true;
})();
