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

