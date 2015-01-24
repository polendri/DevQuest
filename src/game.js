window.addEventListener('load',function() {
  var Q = Quintus({
    development: true,
    //audioPath: "assets/audio/",
    imagePath: "assets/images/",
    dataPath: "assets/data/"
  })
  .include("Sprites, Scenes, Input, TMX, Anim, 2D, Touch, UI, Audio")
  .setup("quintusContainer")
  .controls()
  .touch()
  .enableSound();

  Q.gravityX = 0;
  Q.gravityY = 0;

  Q.scene("start",function(stage) {
    Q.stageTMX('stage1.tmx', stage);

    // A basic sprite shape a asset as the image
    var player = stage.insert(new Q.Sprite({
      x: 10*32,
      y: 998*32,
      asset: 'sprites/coder.png'
    }));
    player.add("2d, platformerControls");

    stage.add('viewport').follow(player);
  });

  Q.loadTMX(
    'stage1.tmx, tiles.png, ' +
    'sprites/coder.png',
    function() {
      // Start the show
      Q.stageScene("start");

      // Turn on default keyboard controls
      Q.input.keyboardControls();
  });
});

