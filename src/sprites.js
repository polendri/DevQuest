function initSprites(Q) {
  Q.DEFAULT_CELL_WIDTH = 32;
  Q.DEFAULT_CELL_HEIGHT = 32;
  
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
        w: 20,
        h: 20,
        power: 3
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

    draw: function(ctx) {
      ctx.fillStyle = "#111";
      ctx.fillRect(-this.p.cx,-this.p.cy,this.p.w,this.p.h);
    },

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

      this.on("bump.left,bump.right,bump.bottom,bump.top",function(collision) {
        if (this.p.team != 'players' && collision.obj.has('team')) { 
          if (collision.obj.p.team != this.p.team) {
            Q.stageScene("endGame",1, { label: "You're basically the worst." });
            collision.obj.destroy();
          }
        }
      });
    }});

  Q.Actor.extend("Player",{
    init: function(props, defaultProps) {
      // property initialization
      props.asset = 'sprites/coder.png';
      props.team = 'players';
      props.bulletSpeed = 100;
      props.rangeWeaponType = Q.StressBall;
      
      // base class initialization
      this._super(props, defaultProps);
      
      // components
      this.add("stepControls, rangeAttacker");
      
      // events
      Q.input.on("fire", this, "fireRange");
    },

    fireRange: function() {
      this['rangeAttacker'].fireRange(1, 0);
    }
  });
    
  Q.Sprite.extend("Spawner", {
    init: function(props, defaultProps) {
      props.w = Q.DEFAULT_CELL_WIDTH;
      props.h = Q.DEFAULT_CELL_HEIGHT;
      props.spawnCounter = 0;
      props.spawnTimeRemaining = 0;
      
      // props for the editor
      props.spawnInterval = 0.25;
      // props.maximumSpawns = 10;
      // props.spawnRadius = 0;
      
      if (props.spawnTypes == null) {
        props.spawnTypes = [ 'Bug' ];
      } else if (typeof props.spawnTypes === 'string') {
        props.spawnTypes = props.spawnTypes.split(',');
      } 
      
      this._super(props, defaultProps);
      
      this.add("2d");
    },
    
    step: function(dt) {
      if (this.p.maximumSpawns <= this.p.spawnCounter) {
        this.destroy();
        return;
      }

      this.p.spawnTimeRemaining -= dt;
      
      if (this.p.spawnTimeRemaining <= 0) {       
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
    }});
    
    Q.SpawnMapping = { };
    Q.SpawnMapping['Bug'] = createBug;
    Q.SpawnMapping['Customer'] = createCustomer;
    Q.SpawnMapping['Sales Person'] = createSalesPerson;
    Q.SpawnMapping['Coder'] = createCoder;
    Q.SpawnMapping['Tester'] = createTester;
    Q.SpawnMapping['Manager'] = createManager;
}

function createPlayer(Q, xPos, yPos) {
  var actor = new Q.Player({
    x: xPos * Q.DEFAULT_CELL_WIDTH,
    y: yPos * Q.DEFAULT_CELL_HEIGHT,
    team: 'players',
  });  
  		  
  actor.add("mortal, stepControls");
  
  // xxx FILTHY HACK: replace this by using a camera component
  Q.stage(0).add('viewport').follow(actor);
  
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
  });  
  		
  actor.p.homingPredicate = function(t) {
    // return t.has('team') && t.p.health > 0 && t.p.team != this.p.team;
    return t.has('team') && t.p.team != 'baddies';
  };
  
  actor.add("homing, mortal, ai");
  return actor;
}

function createCustomer(Q, xPos, yPos) {
  var actor = new Q.Actor({
    x: xPos * Q.DEFAULT_CELL_WIDTH,
    y: yPos * Q.DEFAULT_CELL_HEIGHT,
    asset: 'sprites/customer.png',
    team: 'baddies',
    speed: 75,
    sight: 200,
  });  
  
  actor.p.homingPredicate = function(t) {
    // return t.has('team') && t.p.health > 0 && t.p.team != this.p.team;
    return t.has('team') && t.p.team != 'baddies';
  };
  		  
  actor.add("homing, mortal, ai");
  actor.p.rangeWeaponType = Q.StressBall;
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
  actor.p.rangeWeaponType = Q.StressBall;
  return actor;
}