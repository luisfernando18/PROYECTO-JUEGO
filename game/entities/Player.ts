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
  private isDead!: boolean;
  private isFrozen: boolean = false;

  // Estado anterior de botones del mando
  private padJumpPressed: boolean = false;
  private padAttackPressed: boolean = false;
  private padHealPressed: boolean = false;
  private padPausePressed: boolean = false;

  private soundRun!: Phaser.Sound.BaseSound;
  private soundJump!: Phaser.Sound.BaseSound;
  private soundAttack!: Phaser.Sound.BaseSound;
  private soundDeath!: Phaser.Sound.BaseSound;

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

    scene.load.audio("player-run", "/assets/audio/Player/Player-correr.mp3");
    scene.load.audio("player-jump", "/assets/audio/Player/Player-salto.mp3");
    scene.load.audio("player-attack", "/assets/audio/Player/Player-ataque.mp3");
    scene.load.audio("player-death", "/assets/audio/Player/Player-muerte1.mp3");
  }

  create(x: number, y: number, platforms: Phaser.Physics.Arcade.StaticGroup) {
    this.hp = 100;
    this.maxHp = 100;
    this.curas = 5;
    this.isAttacking = false;
    this.isDead = false;
    this.isFrozen = false;
    this.padJumpPressed = false;
    this.padAttackPressed = false;
    this.padHealPressed = false;
    this.padPausePressed = false;

    gameEvents.emit("hp", this.hp);
    gameEvents.emit("curas", this.curas);

    this.sprite = this.scene.physics.add.sprite(x, y, "player");
    this.sprite.setScale(2.2);
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    body.setSize(40, 50);
    body.setOffset(12, -2);
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
    
    // TECLADO
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
      if (pointer.leftButtonDown() && !this.isAttacking && !this.isDead && !this.isFrozen) {
        this.isAttacking = true;
        this.soundAttack.play();
        this.sprite.play("attack");
        this.sprite.once("animationcomplete", () => {
          this.isAttacking = false;
        });
      }
    });

    this.soundRun = this.scene.sound.add("player-run", { loop: true, volume: 0.4 });
    this.soundJump = this.scene.sound.add("player-jump", { volume: 1 });
    this.soundAttack = this.scene.sound.add("player-attack", { volume: 0.6 });
    this.soundDeath = this.scene.sound.add("player-death", { volume: 0.7 });
  }

  update() {
    if (this.isDead || this.isFrozen) return;

    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    const onGround = body.blocked.down;

    // GAMEPAD
    const pad = this.scene.input.gamepad?.getPad(0);

    //DEBUG TEMPORAL
    if (pad) {
      pad.buttons.forEach((btn, index) => {
        if (btn.pressed) {
          console.log(`Botón presionado: ${index}`);
        }
      });
    }

    const padJumpDown = pad?.isButtonDown(14) ?? false;
    const padAttackDown = pad?.isButtonDown(15) ?? false;
    const padHealDown = pad?.isButtonDown(12) ?? false;
    const padPauseDown = pad?.isButtonDown(3) ?? false;
    const padLeft = pad ? pad.leftStick.x < -0.3 : false;
    const padRight = pad ? pad.leftStick.x > 0.3 : false;

    // "justDown" manual para botones del mando
    const padJump = padJumpDown && !this.padJumpPressed;
    const padAttack = padAttackDown && !this.padAttackPressed;
    const padHeal = padHealDown && !this.padHealPressed;
    const padPause = padPauseDown && !this.padPausePressed;

    // Actualiza estado anterior
    this.padJumpPressed = padJumpDown;
    this.padAttackPressed = padAttackDown;
    this.padHealPressed = padHealDown;
    this.padPausePressed = padPauseDown;

    // PAUSA CON MANDO
    if (padPause) {
      gameEvents.emit("gamepadPause");
    }

    const goLeft = this.cursors.left.isDown || this.wasd.left.isDown || padLeft;
    const goRight = this.cursors.right.isDown || this.wasd.right.isDown || padRight;
    const jump =
      Phaser.Input.Keyboard.JustDown(this.cursors.up) ||
      Phaser.Input.Keyboard.JustDown(this.wasd.up) ||
      Phaser.Input.Keyboard.JustDown(this.spaceKey) ||
      padJump;

    // CURAR — teclado o mando
    if (Phaser.Input.Keyboard.JustDown(this.healKey) || padHeal) {
      if (this.curas > 0 && this.hp < this.maxHp) {
        this.curas--;
        this.hp = this.maxHp;
        gameEvents.emit("hp", this.hp);
        gameEvents.emit("curas", this.curas);
      }
    }

    // ATACAR — teclado o mando
    if ((Phaser.Input.Keyboard.JustDown(this.attackKey) || padAttack) && !this.isAttacking) {
      this.isAttacking = true;
      this.soundAttack.play();
      this.sprite.play("attack");
      this.sprite.once("animationcomplete", () => {
        this.isAttacking = false;
      });
    }

    if (this.isAttacking) {
      if (goLeft) body.setVelocityX(-200);
      else if (goRight) body.setVelocityX(200);
      else body.setVelocityX(0);
      if ((this.soundRun as any).isPlaying) this.soundRun.stop();
      return;
    }

    if (!onGround) {
      if ((this.soundRun as any).isPlaying) this.soundRun.stop();

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
      this.soundJump.play();
      if ((this.soundRun as any).isPlaying) this.soundRun.stop();
      this.sprite.play("jump", true);
      return;
    }

    if (goLeft) {
      body.setVelocityX(-450);
      this.sprite.setFlipX(true);
      this.sprite.play("run", true);
      if (!(this.soundRun as any).isPlaying) this.soundRun.play();
    } else if (goRight) {
      body.setVelocityX(450);
      this.sprite.setFlipX(false);
      this.sprite.play("run", true);
      if (!(this.soundRun as any).isPlaying) this.soundRun.play();
    } else {
      body.setVelocityX(0);
      this.sprite.play("idle", true);
      if ((this.soundRun as any).isPlaying) this.soundRun.stop();
    }
  }

  takeDamage(amount: number) {
    if (this.isDead || this.isFrozen) return false;

    this.hp -= amount;
    if (this.hp < 0) this.hp = 0;
    gameEvents.emit("hp", this.hp);

    if (this.hp <= 0) {
      this.isDead = true;
      try {
        if ((this.soundRun as any).isPlaying) this.soundRun.stop();
        if ((this.soundAttack as any).isPlaying) this.soundAttack.stop();
      } catch (e) { }
      this.soundDeath.play();
      this.scene.time.delayedCall(800, () => {
        gameEvents.emit("playerDead");
      });
    }

    return this.hp <= 0;
  }

  freeze() {
    this.isFrozen = true;
    try {
      if ((this.soundRun as any).isPlaying) this.soundRun.stop();
      if ((this.soundAttack as any).isPlaying) this.soundAttack.stop();
    } catch (e) { }

    //VERIFICA QUE EL SPRITE Y SU BODY EXISTAN ANTES DE USARLOS
    if (!this.sprite || !this.sprite.body) return;

    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(0, 0);
    this.sprite.play("idle", true);
  }

  getSprite() {
    return this.sprite;
  }

  getIsAttacking() {
    return this.isAttacking;
  }

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