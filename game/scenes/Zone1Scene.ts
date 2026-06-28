import Phaser from "phaser";
import gameEvents from "@/lib/gameEvents";

export default class Zone1Scene extends Phaser.Scene {
  private bgSky!: Phaser.GameObjects.TileSprite;
  private bgMid!: Phaser.GameObjects.TileSprite;
  private bgFront!: Phaser.GameObjects.TileSprite;

  private player!: Phaser.Physics.Arcade.Sprite;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: {
    up: Phaser.Input.Keyboard.Key;
    down: Phaser.Input.Keyboard.Key;
    left: Phaser.Input.Keyboard.Key;
    right: Phaser.Input.Keyboard.Key;
  };
  private spaceKey!: Phaser.Input.Keyboard.Key;
  private healKey!: Phaser.Input.Keyboard.Key;

  private platforms!: Phaser.Physics.Arcade.StaticGroup;
  private worldWidth!: number;

  private hp!: number;
  private maxHp!: number;
  private enemiesKilled!: number;
  private curas!: number;

  constructor() {
    super({ key: "Zone1Scene" });
  }

  preload() {
    this.load.image("bg-sky", "/assets/sprites/zone1/cielo.png");
    this.load.image("bg-mid", "/assets/sprites/zone1/medio.png");
    this.load.image("bg-front", "/assets/sprites/zone1/frente.png");
    this.load.image("ground", "/assets/sprites/zone1/suelo.jpg");
    this.load.image("platform", "/assets/sprites/zone1/suelo.jpg");

    this.load.spritesheet("player", "/assets/sprites/player/correr1.png", {
      frameWidth: 64,
      frameHeight: 64,
    });

    this.load.spritesheet("player", "/assets/sprites/player/saltar.png", {
      frameWidth: 64,
      frameHeight: 64,
    });
  }

  create() {
    const W = this.scale.width;
    const H = this.scale.height;

    this.worldWidth = W * 2;
    this.physics.world.setBounds(0, 0, this.worldWidth, H);

    // Variables de estado
    this.hp = 100;
    this.maxHp = 100;
    this.enemiesKilled = 0;
    this.curas = 5; // empieza con 5 curas

    // Emite valores iniciales al HUD
    gameEvents.emit("hp", this.hp);
    gameEvents.emit("enemyKilled", this.enemiesKilled);
    gameEvents.emit("curas", this.curas);
    gameEvents.emit("zone", "Selva Ancestral");

    // CAPAS DE PARALLAX
    this.bgSky = this.add
      .tileSprite(0, 0, this.worldWidth, H, "bg-sky")
      .setOrigin(0, 0)
      .setScrollFactor(0);

    this.bgMid = this.add
      .tileSprite(0, 135, this.worldWidth, H, "bg-mid")
      .setOrigin(0, 0)
      .setScrollFactor(0);

    this.bgFront = this.add
      .tileSprite(0, -745, this.worldWidth, H + 1000, "bg-front")
      .setOrigin(0, 0)
      .setScrollFactor(0);

    // PLATAFORMAS
    this.platforms = this.physics.add.staticGroup();

    const ground = this.add.tileSprite(
      this.worldWidth / 2, H - 20,
      this.worldWidth, 275,
      "ground"
    ).setOrigin(0.5, 0.5)
      .setTileScale(0.09, 0.12);
    this.physics.add.existing(ground, true);
    this.platforms.add(ground);

    const wallLeft = this.add.rectangle(0, H / 2, 10, H, 0x000000, 0);
    this.physics.add.existing(wallLeft, true);
    this.platforms.add(wallLeft);

    const wallRight = this.add.rectangle(this.worldWidth, H / 2, 10, H, 0x000000, 0);
    this.physics.add.existing(wallRight, true);
    this.platforms.add(wallRight);

    const platData = [
      { x: 500, y: H - 500 },
      { x: 850, y: H - 320 },
      { x: W + 200, y: H - 325 },
      { x: W + 500, y: H - 520 },
      { x: W + 900, y: H - 325 },
      { x: W + 1200, y: H - 525 },
      { x: this.worldWidth - 250, y: H - 325 },
    ];

    platData.forEach(({ x, y }) => {
      const plat = this.add.tileSprite(x, y, 180, 50, "platform")
        .setOrigin(0.5, 0.5)
        .setTileScale(0.09, 0.05);
      this.physics.add.existing(plat, true);
      this.platforms.add(plat);
    });

    // JUGADOR
    this.player = this.physics.add.sprite(150, H - 215, "player");
    this.player.setScale(2.2);
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    body.setSize(40, 50);
    body.setOffset(12, 6);
    body.setCollideWorldBounds(true);

    // ANIMACIONES
    this.anims.create({
      key: "run",
      frames: this.anims.generateFrameNumbers("player", { start: 0, end: 7 }),
      frameRate: 10,
      repeat: -1,
    });

    this.anims.create({
      key: "idle",
      frames: this.anims.generateFrameNumbers("player", { start: 0, end: 0 }),
      frameRate: 1,
      repeat: -1,
    });

    this.player.play("idle");

    this.physics.add.collider(this.player, this.platforms);

    // CÁMARA
    this.cameras.main.setBounds(0, 0, this.worldWidth, H);
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);

    // CONTROLES
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.wasd = {
      up: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE),
      down: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      left: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      right: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    };
    this.spaceKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.healKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.Q);
  }

  update() {
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    const onGround = body.blocked.down;

    const goLeft = this.cursors.left.isDown || this.wasd.left.isDown;
    const goRight = this.cursors.right.isDown || this.wasd.right.isDown;
    const jump =
      Phaser.Input.Keyboard.JustDown(this.cursors.up) ||
      Phaser.Input.Keyboard.JustDown(this.wasd.up) ||
      Phaser.Input.Keyboard.JustDown(this.spaceKey);

    // CURAR — tecla F
    if (Phaser.Input.Keyboard.JustDown(this.healKey)) {
      if (this.curas > 0 && this.hp < this.maxHp) {
        this.curas--;
        this.hp = this.maxHp;
        gameEvents.emit("hp", this.hp);
        gameEvents.emit("curas", this.curas);
      }
    }

    // MOVIMIENTO
    if (goLeft) {
      body.setVelocityX(-450);
      this.player.setFlipX(true);
      this.player.play("run", true);
    } else if (goRight) {
      body.setVelocityX(450);
      this.player.setFlipX(false);
      this.player.play("run", true);
    } else {
      body.setVelocityX(0);
      this.player.play("idle", true);
    }

    // SALTO
    if (jump && onGround) {
      body.setVelocityY(-600);
    }

    // PARALLAX
    const camX = this.cameras.main.scrollX;
    this.bgSky.tilePositionX = camX * 0.1;
    this.bgMid.tilePositionX = camX * 0.3;
    this.bgFront.tilePositionX = camX * 0.6;
  }
}