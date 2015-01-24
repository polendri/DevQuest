function initSprites(Q) {
	Q.DEFAULT_CELL_WIDTH = 32;
	Q.DEFAULT_CELL_HEIGHT = 32;
	
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
}

function createPlayer(Q, xPos, yPos) {
  var actor = new Q.Actor({
    x: xPos * Q.DEFAULT_CELL_WIDTH,
    y: yPos * Q.DEFAULT_CELL_HEIGHT,
    asset: 'sprites/coder.png',
	team: 'players',
  });
  actor.add("stepControls");
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
  
  actor.add("homing");
  return actor;
}