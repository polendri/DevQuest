function initSprites(Q) {
	Q.Sprite.extend("Actor",{
    init: function(props, defaultProps) {

      this._super(props, defaultProps);
	  this.add("2d, team");
	  
	  this.on("bump.left,bump.right,bump.bottom",function(collision) {
		if(collision.obj.has('team')) { 
		  if (collision.obj.team != this.p.team) {
			collision.obj.destroy();
		  }
		}
	  });
  }});
}

function createPlayer(Q) {
  var player = new Q.Actor({
    x: 10*32,
    y: 998*32,
    asset: 'sprites/coder.png',
	team: 'players',
  });
  player.add("platformerControls");
  return player;
}

function createBug(Q, xPos, yPos) {
  var player = new Q.Actor({
    x: xPos*32,
    y: yPos*32,
    asset: 'sprites/coder.png',
	team: 'baddies',
  });  
  return player;
}