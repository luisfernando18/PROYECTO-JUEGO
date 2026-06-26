import Phaser from "phaser";

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

  private platforms!: Phaser.Physics.Arcade.StaticGroup;
  private worldWidth!: number;

  constructor() {
    super({ key: "Zone1Scene" });
  }

  preload() {
    // Capas de fondo reales — colócalas en public/assets/sprites/zone1/
    this.load.image("bg-sky", "/assets/sprites/zone1/cielo.png");
    this.load.image("bg-mid", "/assets/sprites/zone1/medio.png");
    this.load.image("bg-front", "/assets/sprites/zone1/frente.png");
    this.load.image("ground", "/assets/sprites/zone1/suelo.jpg");
  }

  create() {
    const W = this.scale.width;
    const H = this.scale.height;

    // 2 pantallas de ancho
    this.worldWidth = W * 2;

    // LÍMITES DEL MUNDO — el jugador no puede salir de estos bounds
    this.physics.world.setBounds(0, 0, this.worldWidth, H);

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

    // Suelo principal — cubre todo el ancho del mundo
    const ground = this.add.tileSprite(
      this.worldWidth / 2, H - 20,
      this.worldWidth, 275,
      "ground"
    ).setOrigin(0.5, 0.5)
     .setTileScale(0.09,0.12);
    
    this.physics.add.existing(ground, true);
    this.platforms.add(ground);

    // Pared invisible izquierda
    const wallLeft = this.add.rectangle(0, H / 2, 10, H, 0x000000, 0);
    this.physics.add.existing(wallLeft, true);
    this.platforms.add(wallLeft);

    // Pared invisible derecha
    const wallRight = this.add.rectangle(this.worldWidth, H / 2, 10, H, 0x000000, 0);
    this.physics.add.existing(wallRight, true);
    this.platforms.add(wallRight);

    // Plataformas flotantes distribuidas en 2 pantallas
    const platData = [
      { x: 300,              y: H - 150 },
      { x: 600,              y: H - 250 },
      { x: 900,              y: H - 180 },
      { x: W + 150,          y: H - 300 },
      { x: W + 450,          y: H - 200 },
      { x: W + 750,          y: H - 280 },
      { x: this.worldWidth - 250, y: H - 180 },
    ];

    platData.forEach(({ x, y }) => {
      const plat = this.add.rectangle(x, y, 160, 20, 0x6b4c2a);
      this.physics.add.existing(plat, true);
      this.platforms.add(plat);
    });

    // JUGADOR (placeholder hasta tener el sprite)
    const playerRect = this.add.rectangle(0, 0, 70, 120, 0xc8a85a);
    this.physics.add.existing(playerRect);
    this.player = playerRect as unknown as Phaser.Physics.Arcade.Sprite;

    const body = this.player.body as Phaser.Physics.Arcade.Body;
    body.setCollideWorldBounds(true); // el jugador choca con los límites del mundo
    this.player.setPosition(150, H - 215); //posicion de reaparicion del jugador

    // Colisión jugador con plataformas y paredes
    this.physics.add.collider(this.player, this.platforms);

    // CÁMARA — sigue al jugador dentro de los límites del mundo
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

    // MOVIMIENTO
    if (goLeft) {
      body.setVelocityX(-220);
    } else if (goRight) {
      body.setVelocityX(220);
    } else {
      body.setVelocityX(0);
    }

    // SALTO
    if (jump && onGround) {
      body.setVelocityY(-520);
    }

    // PARALLAX
    const camX = this.cameras.main.scrollX;
    this.bgSky.tilePositionX = camX * 0.1;
    this.bgMid.tilePositionX = camX * 0.3;
      this.bgFront.tilePositionX = camX * 0.6;
  }
}