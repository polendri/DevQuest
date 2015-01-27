function initScenes(Q, player) {
  Q.scene("mainMenu", function(stage) {
    stage.insert(new Q.UI.Button(
    {
      asset: "play_button.png",
      x: Q.width / 2 - 55,
      y: 500
    },
    function() {
      Q.stageScene('game', 0);
      Q.stageScene('hud', 1, { health: 10 }); // XXX
    }));
    
    stage.insert(new Q.HoverSprite({
      asset: "title.png",
      cx: 0,
      cy: 0,
      x: Q.width / 2 - 210,
      y: 16,
    }));
  });
  
  Q.scene('endGame',function(stage) {
    var box = stage.insert(new Q.UI.Container({
      x: Q.width/2, y: Q.height/2, fill: "rgba(0,0,0,0.25)"
    }));
    
    var button = box.insert(new Q.UI.Button({ x: 0, y: 0, fill: "#CCCCCC", label: "Agree" }))         
    var label = box.insert(new Q.UI.Text({x:10, y: -10 - button.p.h, label: stage.options.label }));
    button.on("click",function() {
      Q.clearStages();
      Q.stageScene('mainMenu');
    });
    box.fit(20);
  });
    
  Q.scene("game",function(stage) {
    Q.stageTMX('stage1.tmx', stage);
  });

  Q.scene("hud", function(stage) {
    var width = stage.options.health * 32;
    var height = 32;
    stage.on('prerender', function(ctx) {
      ctx.drawImage(Q.asset('ui/health_bar.png'), 0, 0, width, height, 10, 10, width, height);
    });
  });
}
