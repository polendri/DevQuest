// find the closest entity to the passed in entity
// that satisfies predicate
function findClosest(entity, predicate) {
  if (!predicate) {
    predicate = function(t) { return true; }
  }
  var p = entity.p;
  var stage = entity.stage;
  var closest = null;
  var closestDistance = null;

  for (var i = 0; i < stage.items.length; i++) {
    var target = stage.items[i];

    if (!predicate(target) || target === entity) {
      continue;
    }

    var x = target.p.x - p.x;
    var y = target.p.y - p.y;
    var targetDistance = Math.sqrt(x*x + y*y);
    
    if (targetDistance > p.sight) {
      continue;
    }

    if (closest === null) {
      closest = target;
      closestDistance = targetDistance;
      continue;
    }

    if (targetDistance < closestDistance) {
      closest = target;
      closestDistance = targetDistance;
    }
  }

  return closest;
}

function tryAttack(component, componentProps, dt) {
    var e = component.entity
    var p = e.p;

    if (componentProps.cooldown > 0) {
      componentProps.cooldown -= dt;
      return;
    }

    if (!e.has('team')) {
      return;
    }

    var target = findClosest(e, e.shouldTarget);

    if (target === null) {
      return;
    }

    var x = target.p.x - p.x;
    var y = target.p.y - p.y;
    var targetDistance = Math.sqrt(x*x + y*y);
    
    if (targetDistance <= componentProps.range) {
      component.attack(target, x, y);
    }
}

function initComponents(Q) {
  Q.component("peasantControls", {
 
    added: function() {
      var p = this.entity.p;
 
      if (!p.speed) { p.speed = 32; }
      
      this.entity.on("step",this,"step");
      this.entity.on("hit", this,"collision");
    },
 
    collision: function(col) {
      var p = this.entity.p;
 
      if (p.stepping) {
        p.stepping = false;
      } 
    },
 
    step: function(dt) {
      var p = this.entity.p;
 
      if (p.stepping) {
        p.x += p.velocityX * dt;
        p.y += p.velocityY * dt;
      }
        
      if(Q.inputs['left']) {
        p.velocityX = -p.speed;
      } else if(Q.inputs['right']) {
        p.velocityX = p.speed;
      } else {
        p.velocityX = 0;
      }
 
      if (Q.inputs['up']) {
        p.velocityY = -p.speed;
      } else if(Q.inputs['down']) {
        p.velocityY = p.speed;
      } else {
        p.velocityY = 0;
      }
      
      if (p.velocityX) {
        p.velocityY /= (Math.sqrt(p.velocityY * p.velocityY + p.velocityX * p.velocityX) / p.speed);
      }
      
      if (p.velocityY) {
        p.velocityX /= (Math.sqrt(p.velocityY * p.velocityY + p.velocityX * p.velocityX) / p.speed);
      }
 
      p.stepping = p.velocityX || p.velocityY;
    } 
  });
  
  Q.component('camera', {

    added: function() {
      var p = this.entity.p;
      Q._defaults(p, this.defaults);
      
      Q.stage(0).add('viewport').follow(
        this.entity,
        {
          x: false,
          y: true
        },
        {
          minX: 0, 
          maxX: 42 * 32,
          minY: 0,
          maxY: 500 * 32
        });
    },
  });
  
	Q.component('team', {
	  defaults: {
      team: 'Undefined',
	  }
  });
	
	Q.component('homing', {
    // Rotates coordinates by -pi/6 to convert them to the isometric
    // plane.
    _toIsoCoords: function(x, y) {
      return {
        x: 0.8660*x - 0.5*y,
        y: 0.5*x + 0.8660*y
      };
    },

    // Choose which direction to face in order to move toward the target.
    _chooseFacing: function(target) {
      if (target === null || !target.p) {
        return;
      }
      var p = this.entity.p;

      var targetIsoCoords = this._toIsoCoords(target.p.x, target.p.y);
      var isoCoords = this._toIsoCoords(p.x, p.y);
      var diffX = targetIsoCoords.x - isoCoords.x;
      var diffY = targetIsoCoords.y - isoCoords.y;
      var coordDiff = Math.abs(diffX) - Math.abs(diffY);

      // Pick the direction that gets us closest to the target.
      if (coordDiff > 0) {
        p.facing = diffX < 0 ? 'front' : 'back';
      }
      else {
        p.facing = diffY > 0 ? 'left' : 'right';
      }

      // Set a commitment if we're moving nearly diagonally, to avoid
      // stuttery movement.
      if (Math.abs(coordDiff) <= p.speed/6) {
        p.commitment = 0.25;
      }
    },

    // Find the closest other entity which satisfies the provided predicate.
    //_findClosest: function(homingPredicate) {
      //if (!homingPredicate) {
        //homingPredicate = function() { return true; }
      //}
      //var p = this.entity.p;
      //var stage = this.entity.stage;
      //var closest = null;
      //var closestDistance = null;

      //for (var i = 0; i < stage.items.length; i++) {
        //var target = stage.items[i];

        //if (!homingPredicate(target) || target === this.entity) {
          //continue;
        //}

        //var x = target.p.x - p.x;
        //var y = target.p.y - p.y;
        //var targetDistance = Math.sqrt(x*x + y*y);
        
        //if (targetDistance > p.sight) {
          //continue;
        //}

        //if (closest === null) {
          //closest = target;
          //closestDistance = targetDistance;
          //continue;
        //}

        //if (targetDistance < closestDistance) {
          //closest = target;
          //closestDistance = targetDistance;
        //}
      //}

      //return closest;
    //},

    _acquireTarget: function() {
      var p = this.entity.p;
      p.target = findClosest(this.entity, function(target) {
        return p.homingPredicate(target)
          && (!target.p.followerCount || target.p.followerCount < p.maxFollowers);
      });
      p.retargetCountdown += p.retargetFreq;

      if (p.target) {
        if (p.target.followerCount) {
          p.target.followerCount++;
        }
        else {
          p.target.followerCount = 1;
        }
      }
    },

    _abandonTarget: function() {
      var p = this.entity.p;
      if (p.target !== null) {
        p.target.followerCount--;
      }
    },

    defaults: {
      // The predicate with which to filter which entities get considered for
      // homing.
      homingPredicate: function() { return true; },
      // The homing movement speed.
      speed: 25,
      // The entity's facing (front, left, back or right).
      facing: 'front',
      // The distance from a target at which homing will cease.
      stopDistance: 25,
      // The distance from a target at which homing should resume again.
      restartDistance: 30,
      // A count is kept for each entity of how many other entities are
      // targeting it. This sets an upper bound on the number of followers,
      // as a way of spreading out targets.
      maxFollowers: 5,
      // The homing target.
      target: null,
      // Determines the frequency, in seconds, at which a new target is picked.
      retargetFreq: 1.0,
      // Counter used for determining when to look for a new target. Randomized
      // so as to average out the costly retargeting of many entities over time
      // rather than doing them all in the same frame.
      retargetCountdown: 0,
      // Counter that must run down before a new facing can be chosen. This is
      // to prevent stuttery behaviour when moving diagonally.
      commitment: 0,
      // Whether or not homing is active.
      homingActive: false,
      // Used to know how far a target can be found
      sight: 100,
    },

    added: function() {
      var p = this.entity.p;
      Q._defaults(p, this.defaults);
      this.entity.on('step', this, 'step');
      p.retargetCountdown = Math.random() * p.retargetFreq;
    },

    step: function(dt) {
      var p = this.entity.p;
      p.retargetCountdown -= dt;

      // Try to find a target if we don't have one, if it's dead, or if it's
      // just time to refresh.
      if (p.retargetCountdown <= 0
          && (p.target === null
            || !p.target.has('combat')
            || p.target.health <= 0
            || p.retargetCountdown <= 0)) {
        this._acquireTarget();

        p.homingActive = true;
      }

      // Quit if we failed to find one.
      if (p.target === null) {
        return;
      }

      // Get the distance to the target.
      var diffX = p.target.p.x - p.x;
      var diffY = p.target.p.y - p.y;
      var targetDistance = Math.sqrt(diffX*diffX + diffY*diffY);

      // If we're inactive but the target is still within our restartDistance,
      // we can shortcircuit, otherwise we need to start up again.
      if (!p.homingActive && targetDistance < p.restartDistance) {
        return;
      }
      else {
        p.homingActive = true;
        this.entity.trigger('homingStarted');
      }

      // Stop if we're close enough to the target.
      if (targetDistance <= p.stopDistance) {
        p.homingActive = false;
        this.entity.trigger('homingEnded');
        return;
      }

      // Figure out which direction gets us closest to the target, unless
      // we've committed to going in the current direction.
      if (p.commitment <= 0) {
        this._chooseFacing(p.target);
      }

      // Apply the movement in the required direction.
      if (p.facing === 'front') {
        p.x -= dt * p.speed;
        p.y += dt * p.speed / 2;
      }
      else if (p.facing === 'left') {
        p.x += dt * p.speed;
        p.y += dt * p.speed / 2;
      }
      else if (p.facing === 'back') {
        p.x += dt * p.speed;
        p.y -= dt * p.speed / 2;
      }
      else if (p.facing === 'right') {
        p.x -= dt * p.speed;
        p.y -= dt * p.speed / 2;
      }

      p.commitment -= dt;
    },

    // Override destroy() so that we reduce followerCount on the target if a
    // target was set.
    destroy: function() {
      var p = this.entity.p;
      if (p.target !== null && p.target.followerCount) {
        p.target.followerCount -= 1;
      }
      this._super();
    }
  });

  
  Q.component('mortal', {
    defaults: {
      health: 10,
      maxHealth: 10,
    },

    added: function() {
      var p = this.entity.p;
      Q._defaults(p, this.defaults);
    },

    extend: {
      // Take the specified damage and update accordingly.
      takeDamage: function(dmg) {
        this.p.health -= dmg;
        console.log('health remaining: ' + this.p.health);
        // XXX
        if (this.p.team === "players") {
          Q.stageScene('hud', 1, this.p);
        }

        if (this.p.health <= 0) {
          this.destroy();
        }
      },

      revive: function(health) {
        this.p.health = Math.min(this.p.health + health, this.p.maxHealth);
        Q.stageScene('hud', 1, this.p);
      }


    }
  });

  Q.component('ai', {});

  Q.component('meleeAttacker', {
    defaults: {
      power: 1,
      range: 30,
      cooldown: 1,
    },

    added: function() {
      var p = this.entity.p;
      p.meleeAttack = this.defaults;
      this.entity.on('step', this, 'step');
      //this.entity.on('meleeAttackLanded');
    },

    step: function(dt) {
      if (this.entity.has('ai') || Q.inputs["right"]) {
        tryAttack(this, this.entity.p.meleeAttack, dt);
      }
    },

    attack: function(target, dx, dy) {

      var p = this.entity.p;
      p.meleeAttack.cooldown = 1;

      if (!target.has('mortal')) {
        return;
      }

      target.takeDamage(p.meleeAttack.power);
    },
  });

  Q.component('rangeAttacker', {
    defaults: {
      power: 5,
      range: 200,
      cooldown: 2
    },

    added: function() {
      var p = this.entity.p;
      p.rangeAttack = this.defaults;

      //Q._defaults(p.rangeAttack, this.defaults);
      this.entity.on('step', this, 'step');
      //this.entity.on('rangeAttackLanded');
    },

    step: function(dt) {
      if (this.entity.has('ai')) {
        tryAttack(this, this.entity.p.rangeAttack, dt);
      }
    },

    //rangeAttackLanded: function(dt) {
      //var p = this.entity.p;
    //},

    attack: function(target, dx, dy) {
      var p = this.entity.p;
      var d = Math.sqrt(dx*dx + dy*dy);
      this.entity.stage.insert(
        new p.rangeAttack.weaponType({ 
          x: p.x + (p.w / 2), 
          y: p.y - (p.h / 2),
          vx: dx / (d / 100),
          vy: dy / (d / 100),
          src: this.entity
        }));
      p.rangeAttack.cooldown = 2;
    },
  });
}
