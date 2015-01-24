function createPlayer(Q) {
  var player = new Q.Sprite({
    x: 10*32,
    y: 998*32,
    asset: 'sprites/coder.png'
  });
  player.add("2d, platformerControls, lol");
  return player;
}
