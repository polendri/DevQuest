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
  Q.component('buffable', {
    extend: {
      addBuff: function(buff) {        
        var p = this.p;
        p.buffs.push(buff);
        
        if (buff.onAdded) {
          buff.onAdded(this);
        }
      },

      removeBuff: function(buff) {              
        var p = this.p;
      
        var removed = false;
        for (i = 0; i < p.buffs.length; i++) {       
          if (p.buffs[i] === buff) {
            p.buffs.splice(i, 1);
            removed = true;
          }
        }
        
        if (!removed) {
          return;
        }
        
        if (buff.onRemoved) {
          buff.onRemoved(this);
        }
      },
    },
    
    added: function() {
      var p = this.entity.p;
      
      Q._defaults(p, this.defaults);
      
      this.entity.on('step', this, 'step');
      
      p.buffs = [ ];
    },

    step: function(dt) {
      var p = this.entity.p;

      for (i = 0; i < p.buffs.length; i++) { 
        p.buffs[i].remaining -= dt;
        
        if (p.buffs[i].remaining <= 0) {
          this.entity.removeBuff(p.buffs[i]);
          i--;
        }
      }
    },
  });
  
  Q.component("controls", {
    added: function() {
      var p = this.entity.p;
 
      this.entity.on("step",this,"step");
    },
 
    step: function(dt) {
      var p = this.entity.p;
      p.propelled = false;
 
      if (Q.inputs['up']) {
        p.facing = 'back';
        p.propelled = true;
      } else if(Q.inputs['down']) {
        p.facing = 'front';
        p.propelled = true;
      } else if(Q.inputs['left']) {
        p.facing = 'left';
        p.propelled = true;
      } else if(Q.inputs['right']) {
        p.facing = 'right';
        p.propelled = true;
      }
    } 
  });
  
  Q.component('camera', {

    added: function() {
      var p = this.entity.p;
      Q._defaults(p, this.defaults);
      
      Q.stage(0).add('viewport').follow(
        this.entity,
        {
          x: true,
          y: true
        },
        {
          minX: 0, 
          maxX: 42 * 64,
          minY: 0,
          maxY: 500 * 64
        });
    },
  });
  
  Q.component('team', {
    defaults: {
      team: 'none'
    },

    added: function() {
      var p = this.entity.p;
      Q._defaults(p, this.defaults);
    }
  });
	
  Q.component('homing', {
    // Choose which direction to face in order to move toward the target.
    _chooseFacing: function(target) {
      if (target === null || !target.p) {
        return;
      }
      var p = this.entity.p;

      var dx = target.p.x - p.x;
      var dy = target.p.y - p.y;
      var coordDiff = Math.abs(dx) - Math.abs(dy);

      // Pick the direction that gets us closest to the target.
      if (coordDiff > 0) {
        p.facing = dx < 0 ? 'left' : 'right';
      }
      else {
        p.facing = dy > 0 ? 'front' : 'back';
      }

      // Set a commitment if we're moving nearly diagonally, to avoid
      // stuttery movement.
      if (Math.abs(coordDiff) <= p.speed/6) {
        p.commitment = 0.25;
      }
    },

    _acquireTarget: function() {
      var p = this.entity.p;
      p.target = findClosest(this.entity, function(target) {
        return p.homingPredicate(target);
      });
      p.retargetCountdown += p.retargetFreq;
    },

    defaults: {
      // The predicate with which to filter which entities get considered for
      // homing.
      homingPredicate: function() { return true; },
      // The distance from a target at which homing will cease.
      stopDistance: 0,
      // The distance from a target at which homing should resume again.
      restartDistance: 5,
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
      // Used to know how far a target can be found
      sight: 300,
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
      p.propelled = false;

      // Try to find a target if we don't have one, if it's dead, or if it's
      // just time to refresh.
      if (p.retargetCountdown <= 0 && (!p.target || !p.homingPredicate(p.target))) {
        this._acquireTarget();
      }

      // Quit if we failed to find one.
      if (p.target === null) {
        return;
      }

      p.propelled = true;

      // Get the distance to the target.
      var dx = p.target.p.x - p.x;
      var dy = p.target.p.y - p.y;
      var targetDistance = Math.sqrt(dx*dx + dy*dy);

      // If we're inactive but the target is still within our restartDistance,
      // we can shortcircuit, otherwise we need to start up again.
      if (!p.propelled && targetDistance < p.restartDistance) {
        return;
      }
      else {
        p.propelled = true;
      }

      // Stop if we're close enough to the target.
      if (targetDistance <= p.stopDistance) {
        p.propelled = false;
        return;
      }

      // Figure out which direction gets us closest to the target, unless
      // we've committed to going in the current direction.
      if (p.commitment <= 0) {
        this._chooseFacing(p.target);
      }

      p.commitment -= dt;
    },
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
      },
    }
  });

  Q.component('ai', {});

  Q.component('meleeAttacker', {
    defaults: {
      power: 1,
      range: 60,
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
      range: 400,
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
          x: p.x + Math.sign(dx) * (p.w / 2), 
          y: p.y + Math.sign(dy) * (p.h / 2),
          vx: dx / (d / 100),
          vy: dy / (d / 100),
          src: this.entity
        }));
      p.rangeAttack.cooldown = 2;
    },
  });

  // Component for things which are self-propelled in a certain direction.
  Q.component('propelled', {
    defaults: {
      facing: 'front',
      propelled: 'false',
      speed: 200
    },

    added: function() {
      var p = this.entity.p;
      Q._defaults(p, this.defaults);
      p.meleeAttack = this.defaults;
      this.entity.on('step', this, 'step');
    },

    step: function(dt) {
      var p = this.entity.p;
      if (p.propelled) {
        if (p.facing === 'front') {
          p.y += p.speed * dt;
        } else if (p.facing === 'left') {
          p.x -= p.speed * dt;
        } else if (p.facing === 'right') {
          p.x += p.speed * dt;
        } else if (p.facing === 'back') {
          p.y -= p.speed * dt;
        }
      }
    }
  });
}
