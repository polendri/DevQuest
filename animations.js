function initAnimations(Q) {
  Q.animations('person', {
    idle_front: { frames: [0] },
    running_front: { frames: [1,0,2,0], rate: 1/4 },
    striking_front: { frames: [3], rate: 1/4, next: 'idle_front' },
    idle_left: { frames: [4] },
    running_left: { frames: [5,4,6,4], rate: 1/4 },
    striking_left: { frames: [7], rate: 1/4, next: 'idle_left' },
    idle_right: { frames: [8] },
    running_right: { frames: [9,8,10,8], rate: 1/4 },
    striking_right: { frames: [11], rate: 1/4, next: 'idle_right' },
    idle_back: { frames: [12] },
    running_back: { frames: [13,12,14,12], rate: 1/4 },
    striking_back: { frames: [15], rate: 1/4, next: 'idle_back' },
    dead_right: { frames: [16], rate: 15, trigger: 'destroy' },
  });
}

