window.addEventListener('load',function() {
  var Q = Quintus({
    development: true,
    imagePath: "assets/images/"
  })
  .include("Sprites, Scenes, Input, 2D, Touch, UI")
  .setup("quintusContainer")
  .controls()
  .touch();

  Q.scene("start",function(stage) {

  // A basic sprite shape a asset as the image
  var sprite1 = new Q.Sprite({ x: 400, y: 100, asset: 'floor_0.png', 
                               angle: 0, collisionMask: 1, scale: 1});
  sprite1.p.points = [
    [ -150, -120 ],
    [  150, -120 ],
    [  150,   60 ],
    [   90,  120 ],
    [  -90,  120 ],
    [ -150,   60 ]
    ];
  stage.insert(sprite1);
  // Add the 2D component for collision detection and gravity.
  sprite1.add('2d')

  sprite1.on('step',function() {
  });

  // A red platform for the other sprite to land on
  var sprite2 = new Q.Sprite({ x: 400, y: 600, w: 300, h: 200 });
  sprite2.draw= function(ctx) {
    ctx.fillStyle = '#FF0000';
    ctx.fillRect(-this.p.cx,-this.p.cy,this.p.w,this.p.h);
  };
  stage.insert(sprite2);

  // Bind the basic inputs to different behaviors of sprite1
  Q.input.on('up',stage,function(e) { 
    sprite1.p.scale -= 0.1;
  });

  Q.input.on('down',stage,function(e) { 
    sprite1.p.scale += 0.1;
  });

  Q.input.on('left',stage,function(e) {
    sprite1.p.angle -= 5;
  });

  Q.input.on('right',stage,function(e) {
    sprite1.p.angle += 5;
  });

  Q.input.on('fire',stage,function(e) {
    sprite1.p.vy = -600;
  });

  Q.input.on('action',stage,function(e) {
    sprite1.p.x = 400;
    sprite1.p.y = 100;
  });
  });

  Q.load('floor_0.png',function() {

  // Start the show
  Q.stageScene("start");

  // Turn visual debugging on to see the 
  // bounding boxes and collision shapes
  Q.debug = true;

  // Turn on default keyboard controls
  Q.input.keyboardControls();
  });
  });

