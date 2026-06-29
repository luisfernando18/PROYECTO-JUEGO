import Phaser from "phaser";
import gameEvents from "@/lib/gameEvents";
import Player from "@/game/entities/Player";

export default class Zone1Scene extends Phaser.Scene {
  private bgSky!: Phaser.GameObjects.TileSprite;
  private bgMid!: Phaser.GameObjects.TileSprite;
  private bgFront!: Phaser.GameObjects.TileSprite;

  private player!: Player;
  private platforms!: Phaser.Physics.Arcade.StaticGroup;
  private worldWidth!: number;
  private enemiesKilled!: number;

  constructor() {
    super({ key: "Zone1Scene" });
  }

  preload() {
    this.load.image("bg-sky", "/assets/sprites/zone1/cielo.png");
    this.load.image("bg-mid", "/assets/sprites/zone1/medio.png");
    this.load.image("bg-front", "/assets/sprites/zone1/frente.png");
    this.load.image("ground", "/assets/sprites/zone1/suelo.jpg");
    this.load.image("platform", "/assets/sprites/zone1/suelo.jpg");
    this.load.audio("zone1-music", "/assets/audio/Que las Campanas Me Doblen.mp3")

    // Carga los assets del personaje desde Player
    Player.preload(this);
  }

  create() {
    const W = this.scale.width;
    const H = this.scale.height;

    this.worldWidth = W * 2;
    this.physics.world.setBounds(0, 0, this.worldWidth, H);

    // Variables de escena
    this.enemiesKilled = 0;
    gameEvents.emit("enemyKilled", this.enemiesKilled);
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
      { x: 500,                   y: H - 500 },
      { x: 850,                   y: H - 320 },
      { x: W + 200,               y: H - 325 },
      { x: W + 500,               y: H - 520 },
      { x: W + 900,               y: H - 325 },
      { x: W + 1200,              y: H - 525 },
      { x: this.worldWidth - 250, y: H - 325 },
    ];

    platData.forEach(({ x, y }) => {
      const plat = this.add.tileSprite(x, y, 180, 50, "platform")
        .setOrigin(0.5, 0.5)
        .setTileScale(0.09, 0.05);
      this.physics.add.existing(plat, true);
      this.platforms.add(plat);
    });

    // JUGADOR — una sola línea
    this.player = new Player(this);
    this.player.create(150, H - 215, this.platforms);

    // CÁMARA
    this.cameras.main.setBounds(0, 0, this.worldWidth, H);
    this.cameras.main.startFollow(this.player.getSprite(), true, 0.1, 0.1);

    //MUSICA DE FONDO
    this.sound.add("zone1-music", {
      loop: true,
      volume: 0.2
    }).play();
  }

  update() {
    // PARALLAX
    const camX = this.cameras.main.scrollX;
    this.bgSky.tilePositionX = camX * 0.1;
    this.bgMid.tilePositionX = camX * 0.3;
    this.bgFront.tilePositionX = camX * 0.6;

    // ACTUALIZA EL JUGADOR
    this.player.update();
  }
}