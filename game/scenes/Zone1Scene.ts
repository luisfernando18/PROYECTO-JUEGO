import Phaser from "phaser";
import gameEvents from "@/lib/gameEvents";
import Player from "@/game/entities/Player";
import Enemy from "@/game/entities/Enemy";

export default class Zone1Scene extends Phaser.Scene {
  private bgSky!: Phaser.GameObjects.TileSprite;
  private bgMid!: Phaser.GameObjects.TileSprite;
  private bgFront!: Phaser.GameObjects.TileSprite;

  private player!: Player;
  private enemies: Enemy[] = [];
  private platforms!: Phaser.Physics.Arcade.StaticGroup;
  private worldWidth!: number;
  private enemiesKilled!: number;
  private hasHitThisAttack: boolean = false;

  constructor() {
    super({ key: "Zone1Scene" });
  }

  preload() {
    this.load.image("bg-sky", "/assets/sprites/zone1/cielo.png");
    this.load.image("bg-mid", "/assets/sprites/zone1/medio.png");
    this.load.image("bg-front", "/assets/sprites/zone1/frente.png");
    this.load.image("ground", "/assets/sprites/zone1/suelo.jpg");
    this.load.image("platform", "/assets/sprites/zone1/suelo.jpg");
    this.load.audio("zona-audio", "/assets/audio/Que Las Campanas Me Doblen.mp3");

    Player.preload(this);
    Enemy.preload(this);
  }

  create() {
    const W = this.scale.width;
    const H = this.scale.height;

    this.worldWidth = W * 2;
    this.physics.world.setBounds(0, 0, this.worldWidth, H);

    // MÚSICA DE FONDO
    this.sound.add("zona-audio", { loop: true, volume: 0.5 }).play();

    this.enemiesKilled = 0;
    gameEvents.emit("enemyKilled", this.enemiesKilled);
    gameEvents.emit("zone", "Selva Ancestral");

    // Escucha cuando un enemigo muere
    gameEvents.on("enemyDied", () => this.onEnemyDied());

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

    // JUGADOR
    this.player = new Player(this);
    this.player.create(150, H - 215, this.platforms);

    // ENEMIGOS
    const enemyData = [
      { x: 600,       y: H - 215, range: 150 },
      { x: 850,   y: H - 395, range: 80 },
      { x: 1500,      y: H - 215, range: 100 },
      { x: W + 500,   y: H - 720, range: 80 },
      { x: W ,   y: H - 215, range: 80 },
      { x: W + 600,   y: H - 215, range: 200 },
      { x: W + 800,   y: H - 215, range: 200 },
      { x: W + 1300,   y: H - 215, range: 200 },
      { x: 500,   y: H - 585, range: 80 },
      { x: W + 1200,   y: H - 625, range: 80 },
      { x: W + 900,   y: H - 425, range: 80 },
      { x: this.worldWidth - 250,   y: H - 500, range: 80 },
    ];

    enemyData.forEach(({ x, y, range }) => {
      const enemy = new Enemy(this, x, y, this.platforms, this.player, range);
      enemy.create();
      this.enemies.push(enemy);
    });

    // CÁMARA
    this.cameras.main.setBounds(0, 0, this.worldWidth, H);
    this.cameras.main.startFollow(this.player.getSprite(), true, 0.1, 0.1);
  }

  private onEnemyDied() {
    this.enemiesKilled++;
    gameEvents.emit("enemyKilled", this.enemiesKilled);
  }

  update() {
    // PARALLAX
    const camX = this.cameras.main.scrollX;
    this.bgSky.tilePositionX = camX * 0.1;
    this.bgMid.tilePositionX = camX * 0.3;
    this.bgFront.tilePositionX = camX * 0.6;

    // ACTUALIZA EL JUGADOR
    this.player.update();

    // ACTUALIZA ENEMIGOS Y DETECTA GOLPES DEL JUGADOR
    const hitbox = this.player.getAttackHitbox();

    this.enemies.forEach((enemy) => {
      if (enemy.getIsDead()) return;

      enemy.update();

      // Si el jugador está atacando, verifica si el hitbox toca al enemigo
      if (hitbox && !this.hasHitThisAttack) {
        const enemySprite = enemy.getSprite();
        const dx = Math.abs(hitbox.x - enemySprite.x);
        const dy = Math.abs(hitbox.y - enemySprite.y);

        if (dx < hitbox.width / 2 + 20 && dy < hitbox.height / 2 + 20) {
          enemy.takeHit();
          this.hasHitThisAttack = true;
        }
      }

      if (!hitbox) {
        this.hasHitThisAttack = false; // se resetea cuando termina el ataque
      }
    });
  }
}