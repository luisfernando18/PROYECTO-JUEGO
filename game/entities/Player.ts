import Phaser from "phaser";
import gameEvents from "@/lib/gameEvents";

export default class Player {
  private scene: Phaser.Scene;
  public sprite!: Phaser.Physics.Arcade.Sprite;

  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: {
    up: Phaser.Input.Keyboard.Key;
    down: Phaser.Input.Keyboard.Key;
    left: Phaser.Input.Keyboard.Key;
    right: Phaser.Input.Keyboard.Key;
  };
  private spaceKey!: Phaser.Input.Keyboard.Key;
  private healKey!: Phaser.Input.Keyboard.Key;
  private attackKey!: Phaser.Input.Keyboard.Key;

  private hp!: number;
  private maxHp!: number;
  private curas!: number;
  private isAttacking!: boolean;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  // Carga los assets del personaje — se llama en preload() de la escena
  static preload(scene: Phaser.Scene) {
    scene.load.spritesheet("player", "/assets/sprites/Player/correr1.png", {
      frameWidth: 64,
      frameHeight: 64,
    });
    scene.load.spritesheet("player-jump", "/assets/sprites/Player/saltar1.png", {
      frameWidth: 64,
      frameHeight: 64,
    });
    scene.load.spritesheet("player-attack", "/assets/sprites/Player/atacar.png", {
      frameWidth: 64,
      frameHeight: 64,
    });
  }

  // Crea el personaje — se llama en create() de la escena
  create(x: number, y: number, platforms: Phaser.Physics.Arcade.StaticGroup) {
    // Variables de estado
    this.hp = 100;
    this.maxHp = 100;
    this.curas = 5;
    this.isAttacking = false;

    // Emite valores iniciales al HUD
    gameEvents.emit("hp", this.hp);
    gameEvents.emit("curas", this.curas);

    // SPRITE
    this.sprite = this.scene.physics.add.sprite(x, y, "player");
    this.sprite.setScale(2.2);
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    body.setSize(40, 50);
    body.setOffset(12, 6);
    body.setCollideWorldBounds(true);

    // ANIMACIONES
    this.scene.anims.create({
      key: "run",
      frames: this.scene.anims.generateFrameNumbers("player", { start: 0, end: 7 }),
      frameRate: 9,
      repeat: -1,
    });

    this.scene.anims.create({
      key: "idle",
      frames: this.scene.anims.generateFrameNumbers("player", { start: 0, end: 0 }),
      frameRate: 1,
      repeat: -1,
    });

    this.scene.anims.create({
      key: "jump",
      frames: this.scene.anims.generateFrameNumbers("player-jump", { start: 0, end: 7 }),
      frameRate: 10,
      repeat: 0,
    });

    this.scene.anims.create({
      key: "attack",
      frames: this.scene.anims.generateFrameNumbers("player-attack", { start: 0, end: 6 }),
      frameRate: 11,
      repeat: 0,
    });

    this.sprite.play("idle");

    // COLISIÓN CON PLATAFORMAS
    this.scene.physics.add.collider(this.sprite, platforms);

    // CONTROLES
    this.cursors = this.scene.input.keyboard!.createCursorKeys();
    this.wasd = {
      up: this.scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE),
      down: this.scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      left: this.scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      right: this.scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    };
    this.spaceKey = this.scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.healKey = this.scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.Q);
    this.attackKey = this.scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.F);

    // ATAQUE CON CLICK IZQUIERDO
    this.scene.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      if (pointer.leftButtonDown() && !this.isAttacking) {
        this.isAttacking = true;
        this.sprite.play("attack");
        this.sprite.once("animationcomplete", () => {
          this.isAttacking = false;
        });
      }
    });
  }

  // Se llama en update() de la escena
  update() {
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    const onGround = body.blocked.down;

    const goLeft = this.cursors.left.isDown || this.wasd.left.isDown;
    const goRight = this.cursors.right.isDown || this.wasd.right.isDown;
    const jump =
      Phaser.Input.Keyboard.JustDown(this.cursors.up) ||
      Phaser.Input.Keyboard.JustDown(this.wasd.up) ||
      Phaser.Input.Keyboard.JustDown(this.spaceKey);

    // CURAR — tecla Q
    if (Phaser.Input.Keyboard.JustDown(this.healKey)) {
      if (this.curas > 0 && this.hp < this.maxHp) {
        this.curas--;
        this.hp = this.maxHp;
        gameEvents.emit("hp", this.hp);
        gameEvents.emit("curas", this.curas);
      }
    }

    // ATAQUE — tecla F
    if (Phaser.Input.Keyboard.JustDown(this.attackKey) && !this.isAttacking) {
      this.isAttacking = true;
      this.sprite.play("attack");
      this.sprite.once("animationcomplete", () => {
        this.isAttacking = false;
      });
    }

    // Si está atacando no interrumpimos la animación
    if (this.isAttacking) {
      if (goLeft) body.setVelocityX(-200);
      else if (goRight) body.setVelocityX(200);
      else body.setVelocityX(0);
      return;
    }

    // ANIMACIÓN EN EL AIRE
    if (!onGround) {
      if (goLeft) {
        body.setVelocityX(-450);
        this.sprite.setFlipX(true);
      } else if (goRight) {
        body.setVelocityX(450);
        this.sprite.setFlipX(false);
      }

      if (body.velocity.y < 0) {
        if (this.sprite.anims.currentAnim?.key !== "jump") {
          this.sprite.play("jump", true);
        }
      } else {
        this.sprite.anims.stop();
        this.sprite.setTexture("player-jump", 7);
      }
      return;
    }

    // SALTO
    if (jump) {
      body.setVelocityY(-1000);
      this.sprite.play("jump", true);
      return;
    }

    // MOVIMIENTO EN EL SUELO
    if (goLeft) {
      body.setVelocityX(-450);
      this.sprite.setFlipX(true);
      this.sprite.play("run", true);
    } else if (goRight) {
      body.setVelocityX(450);
      this.sprite.setFlipX(false);
      this.sprite.play("run", true);
    } else {
      body.setVelocityX(0);
      this.sprite.play("idle", true);
    }
  }

  // Método para recibir daño — se usará cuando agreguemos enemigos
  takeDamage(amount: number) {
    this.hp -= amount;
    if (this.hp < 0) this.hp = 0;
    gameEvents.emit("hp", this.hp);
    return this.hp <= 0; // retorna true si el jugador murió
  }

  // Getter del sprite para colisiones con enemigos
  getSprite() {
    return this.sprite;
  }

  // Getter para saber si está atacando — útil para los enemigos
  getIsAttacking() {
    return this.isAttacking;
  }
}