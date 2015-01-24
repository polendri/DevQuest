function initComponents(Q) {
  //Q.component('mortal', {
    //defaults: {
      //health: 10,
    //},

    //extend: {
      //// Take the specified damage and update accordingly.
      //takeDamage: function(dmg) {
        //this.p.health -= dmg;
      //},
    //},

  //});

  //Q.component('meleeAttacker', {
    //defaults: {
      //power: 4,
      //cooldown: 1
    //},

    //added: function() {
      //var p = this.entity.p.meleeAttack;
      //Q._defaults(p, this.defaults);
      //this.entity.on('step');
      //this.entity.on('meleeAttackLanded');
    //},

    //step: function(dt) {
      //var p = this.entity.p;
    //},

    //meleeAttackLanded: function(dt) {
      //var p = this.entity.p;
    //},
  //});

  Q.component('rangeAttacker', {
    defaults: {
      power: 5,
      range: 30,
      cooldown: 3
      //type: Q.StressBall
    },

    added: function() {
      var p = this.entity.p.rangeAttack;
      Q._defaults(p, this.defaults);
      this.entity.on('step');
      this.entity.on('rangeAttackLanded');
    },

    step: function(dt) {
      var p = this.entity.p;
    },

    rangeAttackLanded: function(dt) {
      var p = this.entity.p;
    },

    //extend: {
      fire: function() {
        console.log("lol");
        //var p = this.entity.p;
        //var dx =  Math.sin(p.angle * Math.PI / 180);
        //var dy = -Math.cos(p.angle * Math.PI / 180);
        //this.stage.insert(
          //new Q.StressBall({ 
            //x: this.entity.c.points[0][0], 
            //y: this.entity.c.points[0][1],
            //vx: dx * p.bulletSpeed,
            //vy: dy * p.bulletSpeed
          //}));
      }
    //}
  });
}
