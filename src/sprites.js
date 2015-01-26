function initSprites(Q) {
  Q.DEFAULT_CELL_WIDTH = 32;
  Q.DEFAULT_CELL_HEIGHT = 32;

  Q.Sprite.extend("Powerup", {
    init: function(p) {
      p.onPowerup = function(actor) { };
      
      this._super(p, {});
      
      this.add("2d");
      
      this.on("hit.sprite", this, "collision");
    },

    collision: function(col) {
      var target = col.obj;
      
      if (target.has('buffable')) {
        this.p.onPowerup(target);
        this.destroy();
      }
    },
  });
  
  Q.Sprite.extend("WinCondition", {
    init: function(p) {
      p.y += p.h;
      this._super(p);
      this.on("hit.sprite", this, "collision");
    },

    collision: function(col) {
      var target = col.obj;
      
      if (target.has('team') && target.p.team === 'players') {
        Q.stageScene("endGame", 1, { label: "Sheeit, playa. You've been makin' all kinds of gainz." });
      }
    },
  });
  
  // An otherwise static sprite that hovers up and down steadily.
  Q.Sprite.extend("HoverSprite", {
    init: function(p) {
      this._super(p, {
        // The amount to hover up and down from the original y-location.
        amplitude: 3,
        // The time it takes to hover up, down and back to level again.
        period: 2,
        // The y-coordinate around which the hovering happens.
        centerY: p.y,
        // The elapsed time since hovering started (supplied to the
        // function that determines the height).
        elapsed: 0
      });
    },

    step: function(dt) {
      this.p.elapsed += dt;
      this.p.y = this.p.centerY + this.p.amplitude * Math.sin(2*Math.PI * (this.p.elapsed/this.p.period));
    }
  });

  Q.Sprite.extend("StressBall", {
    init: function(p) {
      this._super(p, {
        power: 3,
        asset: "sprites/stress_ball.png"
      });

      this.add("2d");
      this.on("hit.sprite", this, "collision");
    },

    collision: function(col) {
      var target = col.obj;
      if (target === this.p.src) {
        return;
      }
      if (target.has('mortal')) {
        target.takeDamage(this.p.power);
      }

      this.destroy();
    },

    //draw: function(ctx) {
      //ctx.fillStyle = "#111";
      //ctx.fillRect(-this.p.cx,-this.p.cy,this.p.w,this.p.h);
    //},

    step: function(dt) {
      if(!Q.overlap(this,this.stage)) {
        this.destroy();
      }
    }
  });

  Q.Sprite.extend("Actor",{
    init: function(props, defaultProps) {
      // base class initialization
      this._super(props, defaultProps);

      // components
      this.add("2d, team");
    }});

  Q.Actor.extend("Player",{
    init: function(props, defaultProps) {
      // property initialization
      defaultProps = defaultProps || {};
      defaultProps.asset = 'sprites/coder.png';
      defaultProps.team = 'players';
      defaultProps.bulletSpeed = 100;
      defaultProps.rangeWeaponType = Q.StressBall;
      
      // base class initialization
      this._super(props, defaultProps);
      
      // components
      this.add("peasantControls, rangeAttacker, camera, mortal, buffable");
      
      // events
      Q.input.on("fire", this, "fireRange");

      this.on("bump.left,bump.right,bump.bottom,bump.top",function(collision) {
        if (this.p.team != 'players' && collision.obj.has('team')) { 
          if (collision.obj.p.team != this.p.team) {
            this.takeDamage(2); // XXX
          }
        }
      });

      this.p.rangeAttack.weaponType = Q.StressBall;
      this.p.health = 10;
    },

    fireRange: function() {
      this['rangeAttacker'].attack(null, 1, 0);
    },

    destroy: function() {
      Q.stageScene("endGame",1, { label: "You're basically the worst." });
      this._super();
    },

    shouldTarget: function(target) {
      return target.has('team') && target.p.team == 'baddies';
    }

  });
    
  Q.Sprite.extend("Spawner", {
    init: function(props, defaultProps) {
      defaultProps = defaultProps || {};
      defaultProps.w = 0; // XXX hack; this is to disable collisions, I tried using collisionMask
      defaultProps.h = 0; // but it didn't seem to work.
      defaultProps.spawnCounter = 0;
      defaultProps.spawnTimeRemaining = 0;
      
      // props for the editor
      // props.spawnInterval = 0.25;
      // props.maximumSpawns = 10;
      // props.spawnRadius = 0;
      // props.probability = 1;
      // props.sight = 1000;
      
      this._super(props, defaultProps);
      this.add("2d");
      
      if (this.p.spawnTypes == null) {
        this.p.spawnTypes = [ 'Bug' ];
      } else if (typeof this.p.spawnTypes === 'string') {
        this.p.spawnTypes = this.p.spawnTypes.split(',');
      } 
    },
    
    step: function(dt) {
      // randomized chance that this thing shouldn't even exist
      if (!this.p.checkShouldExist) {
        this.p.checkShouldExist = true;
        
        if (this.p.probability < Math.random()) {
          this.destroy();
          return;
        }
      }
      
      // check if we've exceeded our limit
      if (this.p.maximumSpawns <= this.p.spawnCounter) {
        this.destroy();
        return;
      }

      this.p.spawnTimeRemaining -= dt;
            
      if (this.p.spawnTimeRemaining <= 0) {
        if (this.p.sight > 0 && null == findClosest(this, function(target) {
          return target.has('team') && target.p.team === 'players'; 
        })) {
          return;
        }        
        
        var chosenSpawnType = this.p.spawnTypes[Math.floor(Math.random() * this.p.spawnTypes.length)];
        var factoryFunction = Q.SpawnMapping[chosenSpawnType];
        
        var spawnAngle = Math.random() * Math.PI * 2;
        var xLocation = this.p.x + this.p.spawnRadius * Math.random() * Math.cos(spawnAngle);
        var yLocation = this.p.y + this.p.spawnRadius * Math.random() * Math.sin(spawnAngle);
        
        var spawned = factoryFunction(Q, xLocation / Q.DEFAULT_CELL_WIDTH, yLocation / Q.DEFAULT_CELL_HEIGHT);
        
        this.stage.insert(spawned);
        
        this.p.spawnCounter++;
        this.p.spawnTimeRemaining = this.p.spawnInterval;
      }
    }
  });
    
  Q.Spawner.extend("BugSpawner", {
    init: function(props, defaultProps) {
      defaultProps = defaultProps || {};
      defaultProps.spawnInterval = 2.0;
      defaultProps.maximumSpawns = 3;
      defaultProps.spawnRadius = 100;
      defaultProps.probability = 0.25;
      defaultProps.spawnTypes = ['Bug'];
      defaultProps.sight = 200;
      this._super(props, defaultProps);
    },
  });

  Q.Spawner.extend("SalespersonSpawner", {
    init: function(props, defaultProps) {
      defaultProps = defaultProps || {};
      defaultProps.spawnInterval = 0.1;
      defaultProps.maximumSpawns = 1;
      defaultProps.spawnRadius = 0;
      defaultProps.probability = 0.5;
      defaultProps.spawnTypes = ['Sales Person'];
      defaultProps.sight = 1000;
      this._super(props, defaultProps);
    },
  });

  Q.Spawner.extend("CustomerSpawner", {
    init: function(props, defaultProps) {
      defaultProps = defaultProps || {};
      defaultProps.spawnInterval = 0.1;
      defaultProps.maximumSpawns = 1;
      defaultProps.spawnRadius = 0;
      defaultProps.probability = 0.25;
      defaultProps.spawnTypes = ['Customer'];
      defaultProps.sight = 1000;
      this._super(props, defaultProps);
    },
  });

  Q.SpawnMapping = { };
  Q.SpawnMapping['Bug'] = createBug;
  Q.SpawnMapping['Customer'] = createCustomer;
  Q.SpawnMapping['Sales Person'] = createSalesPerson;
  Q.SpawnMapping['Coder'] = createCoder;
  Q.SpawnMapping['Tester'] = createTester;
  Q.SpawnMapping['Manager'] = createManager;
  Q.SpawnMapping['Sushi'] = createSushi;
  Q.SpawnMapping['Potion'] = createPotion;
  Q.SpawnMapping['Coffee'] = createCoffee;
}

function createPlayer(Q, xPos, yPos) {
  var actor = new Q.Player({
    x: xPos * Q.DEFAULT_CELL_WIDTH,
    y: yPos * Q.DEFAULT_CELL_HEIGHT,
    team: 'players',
    speed: 200,
  });  
  
  return actor;
}

function createCoder(Q, xPos, yPos) {
  var actor = createPlayer(Q, xPos, yPos);
  actor.p.asset = 'sprites/coder.png';
  
  return actor;
}

function createTester(Q, xPos, yPos) {
  var actor = createPlayer(Q, xPos, yPos);
  actor.p.asset = 'sprites/tester.png';
  
  return actor;
}

function createManager(Q, xPos, yPos) {
  var actor = createPlayer(Q, xPos, yPos);
  actor.p.asset = 'sprites/manager.png';
  
  return actor;
}

function createBug(Q, xPos, yPos) {
  var actor = new Q.Actor({
    x: xPos * Q.DEFAULT_CELL_WIDTH,
    y: yPos * Q.DEFAULT_CELL_HEIGHT,
    asset: 'sprites/bug.png',
    team: 'baddies',
    speed: 100
  });  
  		
  actor.p.homingPredicate = function(t) {
    // return t.has('team') && t.p.health > 0 && t.p.team != this.p.team;
    return t.has('team') && t.p.team != 'baddies';
  };
  
  actor.add("homing, mortal, ai, meleeAttacker");


  actor.shouldTarget = actor.p.homingPredicate;
  //actor.p.rangeAttack.weaponType = Q.StressBall;
  return actor;
}

function createCustomer(Q, xPos, yPos) {
  var actor = new Q.Actor({
    x: xPos * Q.DEFAULT_CELL_WIDTH,
    y: yPos * Q.DEFAULT_CELL_HEIGHT,
    asset: 'sprites/customer.png',
    team: 'baddies',
    speed: 150,
    sight: 200,
  });  
  
  actor.p.homingPredicate = function(t) {
    // return t.has('team') && t.p.health > 0 && t.p.team != this.p.team;
    return t.has('team') && t.p.team != 'baddies';
  };
  		  
  actor.add("homing, mortal, ai");
  return actor;
}

function createSalesPerson(Q, xPos, yPos) {
  var actor = new Q.Actor({
    x: xPos * Q.DEFAULT_CELL_WIDTH,
    y: yPos * Q.DEFAULT_CELL_HEIGHT,
    asset: 'sprites/customer.png',
    team: 'baddies',
  });  
  		  
  actor.add("mortal, ai");
  return actor;
}

function createSalesPerson(Q, xPos, yPos) {
  var actor = new Q.Actor({
    x: xPos * Q.DEFAULT_CELL_WIDTH,
    y: yPos * Q.DEFAULT_CELL_HEIGHT,
    asset: 'sprites/salesperson.png',
    team: 'baddies',
  });  
  		  
  actor.add("mortal, ai");
  return actor;
}

function createSushi(Q, xPos, yPos) {
  var powerup = new Q.Powerup({
    x: xPos * Q.DEFAULT_CELL_WIDTH,
    y: yPos * Q.DEFAULT_CELL_HEIGHT,
    asset: 'sprites/sushi.png',
  });
  
  powerup.p.onPowerup = function(actor)
  {
    actor.revive(4);
  };
  		  
  return powerup;
}

function createPotion(Q, xPos, yPos) {
  var powerup = new Q.Powerup({
    x: xPos * Q.DEFAULT_CELL_WIDTH,
    y: yPos * Q.DEFAULT_CELL_HEIGHT,
    asset: 'sprites/potion.png',
  });
  
  powerup.p.onPowerup = function(actor)
  {
    var buff = {
      remaining: 6,
      onAdded: function(target) { target.p.speed *= 1.5; },
      onRemoved: function(target) { 
        target.p.speed /= 1.5; 
        
        var debuff = {
          remaining: 2,
          onAdded: function(target) { target.p.speed *= 0.75; },
          onRemoved: function(target) { target.p.speed /= 0.75; },
        };
        
        target.addBuff(debuff);
      },
    };
    
    actor.addBuff(buff);
  };
  		  
  return powerup;
}

function createCoffee(Q, xPos, yPos) {
  var powerup = new Q.Powerup({
    x: xPos * Q.DEFAULT_CELL_WIDTH,
    y: yPos * Q.DEFAULT_CELL_HEIGHT,
    asset: 'sprites/coffee.png',
  });
  
  powerup.p.onPowerup = function(actor)
  {
    var buff = {
      remaining: 5,
      onAdded: function(target) { target.p.speed *= 1.25; },
      onRemoved: function(target) { target.p.speed /= 1.25; },
    };
    
    actor.addBuff(buff);
  };
  		  
  return powerup;
}
