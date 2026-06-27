// RUTA: src/game/entities/Player.ts
import Phaser from "phaser";

export default class Player extends Phaser.Physics.Arcade.Sprite {
  private cursors: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd: {
    up: Phaser.Input.Keyboard.Key;
    down: Phaser.Input.Keyboard.Key;
    left: Phaser.Input.Keyboard.Key;
    right: Phaser.Input.Keyboard.Key;
  };
  private spaceKey: Phaser.Input.Keyboard.Key;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    // 1. Creamos el cuadro amarillo por código para no depender de imágenes por ahora
    const graphics = scene.add.graphics();
    graphics.fillStyle(0xc8a85a, 1);
    graphics.fillRect(0, 0, 70, 120);
    graphics.generateTexture("temp-player", 70, 120);
    graphics.destroy(); // Destruimos el gráfico, solo queríamos la textura

    super(scene, x, y, "temp-player");
    scene.add.existing(this);
    scene.physics.add.existing(this);

    // 2. Físicas
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setCollideWorldBounds(false); 
    body.setMaxVelocity(350, 800);     
    body.setDragX(1500); 

    // 3. Controles
    this.cursors = scene.input.keyboard!.createCursorKeys();
    this.wasd = {
      up: scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      down: scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      left: scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      right: scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    };
    this.spaceKey = scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
  }

  // 4. Esta función la llamaremos desde la escena
  updateLogic() {
    const body = this.body as Phaser.Physics.Arcade.Body;
    const onGround = body.blocked.down || body.touching.down;
    
    const goLeft = this.cursors.left.isDown || this.wasd.left.isDown;
    const goRight = this.cursors.right.isDown || this.wasd.right.isDown;
    const jump =
      Phaser.Input.Keyboard.JustDown(this.cursors.up) ||
      Phaser.Input.Keyboard.JustDown(this.wasd.up) ||
      Phaser.Input.Keyboard.JustDown(this.spaceKey);

    if (goLeft) {
      body.setAccelerationX(-1500);
    } else if (goRight) {
      body.setAccelerationX(1500);
    } else {
      body.setAccelerationX(0); 
    }

    if (jump && onGround) {
      body.setVelocityY(-520);
    }
  }
}