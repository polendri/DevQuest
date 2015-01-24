function createPlayer(Q) {
  var player = new Q.Sprite({
    x: 10*32,
    y: 998*32,
    asset: 'sprites/coder.png'
  });
  player.add("2d, stepControls, rangeAttacker");
  return player;
}

function initSprites(Q) {
  Q.Sprite.extend("StressBall", {
    init: function(p) {
      this._super(p, {
        w: 2,
        h: 2,
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
      ctx.fillStyle = "#000";
      ctx.fillRect(-this.p.cx,-this.p.cy,this.p.w,this.p.h);
    },

    step: function(dt) {
      if(!Q.overlap(this,this.stage)) {
        this.destroy();
      }
    }
  });
}

