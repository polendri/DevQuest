function initSprites(Q) {
  Q.DEFAULT_CELL_WIDTH = 32;
  Q.DEFAULT_CELL_HEIGHT = 32;

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

      this._super(props, defaultProps);
      this.add("2d, team");

      this.on("bump.left,bump.right,bump.bottom,bump.top",function(collision) {
        if(this.p.team != 'players' && collision.obj.has('team')) { 
          if (collision.obj.p.team != this.p.team) {
            collision.obj.destroy();
          }
        }
      });
    }});

  Q.Sprite.extend("Player",{
    init: function(props, defaultProps) {
      props.asset = 'sprites/coder.png';
      props.team = 'players';
      props.bulletSpeed = 100;
      this._super(props, defaultProps);
      this.add("2d, team, stepControls, rangeAttacker");
      Q.input.on("fire", this, "fireRange");

      this.on("bump.left,bump.right,bump.bottom,bump.top",function(collision) {
        if(this.p.team != 'players' && collision.obj.has('team')) { 
          if (collision.obj.team != this.p.team) {
            collision.obj.destroy();
          }
        }
      });
    },
  });
    
  Q.Sprite.extend("EnemySpawner", {
    init: function(props, defaultProps) {
      props.spawnCounter = 0;
      props.spawnTimeRemaining = 0;
      props.spawnInterval = 0.25;
      props.maximumSpawns = 10;
      props.spawnTypes = [ 'Bug' ];
      
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
        var spawned = factoryFunction(Q, this.p.x / Q.DEFAULT_CELL_WIDTH, this.p.y / Q.DEFAULT_CELL_HEIGHT);
        
        this.stage.insert(spawned);
        
        this.p.spawnCounter++;
        this.p.spawnTimeRemaining = this.p.spawnInterval;
      }
    }});
    
    Q.SpawnMapping = { };
    Q.SpawnMapping['Bug'] = createBug;
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
  
  actor.add("homing, mortal");
  return actor;
}

