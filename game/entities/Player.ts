import Phaser from "phaser";
import gameEvents from "@/lib/gameEvents";

export default class Player {
  private scene: Phaser.Scene;
  public sprite!: Phaser.Physics.Arcade.Sprite;
  private attackHitbox!: Phaser.GameObjects.Zone;

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

  static preload(scene: Phaser.Scene) {
    scene.load.spritesheet("player", "/assets/sprites/Player/correr1.png", {
      frameWidth: 64,
      frameHeight: 64,
    });
    scene.load.spritesheet("player-jump", "/assets/sprites/Player/saltar1.png", {
      frameWidth: 64,
      frameHeight: 64,
    });
    scene.load.spritesheet("player-attack", "/assets/sprites/Player/atacar_nuevo.png", {
      frameWidth: 67.2,
      frameHeight: 64,
    });
    scene.load.spritesheet("player-idle", "/assets/sprites/Player/idle1.png", {
      frameWidth: 64,
      frameHeight: 64,
    });
  }

  create(x: number, y: number, platforms: Phaser.Physics.Arcade.StaticGroup) {
    this.hp = 100;
    this.maxHp = 100;
    this.curas = 5;
    this.isAttacking = false;

    gameEvents.emit("hp", this.hp);
    gameEvents.emit("curas", this.curas);

    this.sprite = this.scene.physics.add.sprite(x, y, "player");
    this.sprite.setScale(2.2);
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    body.setSize(40, 50);
    body.setOffset(12, 6);
    body.setCollideWorldBounds(true);

    this.scene.anims.create({
      key: "run",
      frames: this.scene.anims.generateFrameNumbers("player", { start: 0, end: 7 }),
      frameRate: 9,
      repeat: -1,
    });

    this.scene.anims.create({
      key: "idle",
      frames: this.scene.anims.generateFrameNumbers("player-idle", { start: 0, end: 1 }),
      frameRate: 3,
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

    this.scene.physics.add.collider(this.sprite, platforms);

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

  update() {
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    const onGround = body.blocked.down;

    const goLeft = this.cursors.left.isDown || this.wasd.left.isDown;
    const goRight = this.cursors.right.isDown || this.wasd.right.isDown;
    const jump =
      Phaser.Input.Keyboard.JustDown(this.cursors.up) ||
      Phaser.Input.Keyboard.JustDown(this.wasd.up) ||
      Phaser.Input.Keyboard.JustDown(this.spaceKey);

    if (Phaser.Input.Keyboard.JustDown(this.healKey)) {
      if (this.curas > 0 && this.hp < this.maxHp) {
        this.curas--;
        this.hp = this.maxHp;
        gameEvents.emit("hp", this.hp);
        gameEvents.emit("curas", this.curas);
      }
    }

    if (Phaser.Input.Keyboard.JustDown(this.attackKey) && !this.isAttacking) {
      this.isAttacking = true;
      this.sprite.play("attack");
      this.sprite.once("animationcomplete", () => {
        this.isAttacking = false;
      });
    }

    if (this.isAttacking) {
      if (goLeft) body.setVelocityX(-200);
      else if (goRight) body.setVelocityX(200);
      else body.setVelocityX(0);
      return;
    }

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

    if (jump) {
      body.setVelocityY(-1000);
      this.sprite.play("jump", true);
      return;
    }

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

  takeDamage(amount: number) {
    this.hp -= amount;
    if (this.hp < 0) this.hp = 0;
    gameEvents.emit("hp", this.hp);
    return this.hp <= 0;
  }

  getSprite() {
    return this.sprite;
  }

  getIsAttacking() {
    return this.isAttacking;
  }

  // Hitbox temporal de ataque — se usa para detectar colisión con enemigos
  getAttackHitbox(): { x: number; y: number; width: number; height: number } | null {
    if (!this.isAttacking) return null;

    const facing = this.sprite.flipX ? -1 : 1;
    const offsetX = 50 * facing;

    return {
      x: this.sprite.x + offsetX,
      y: this.sprite.y,
      width: 60,
      height: 70,
    };
  }
}