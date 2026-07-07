import Phaser from "phaser";
import gameEvents from "@/lib/gameEvents";
import Player from "@/game/entities/Player";
import Enemy from "@/game/entities/Enemy";

export default class Zone2Scene extends Phaser.Scene {
  private bgSky!: Phaser.GameObjects.TileSprite;
  private bgMid!: Phaser.GameObjects.TileSprite;
  private bgFront!: Phaser.GameObjects.TileSprite;
  private bgMusic!: Phaser.Sound.BaseSound;

  private player!: Player;
  private enemies: Enemy[] = [];
  private platforms!: Phaser.Physics.Arcade.StaticGroup;
  private worldWidth!: number;
  private enemiesKilled!: number;
  private hasHitThisAttack: boolean = false;
  private totalEnemies!: number;

  constructor() {
    super({ key: "Zone2Scene" });
  }

  preload() {
    this.load.image("bg-sky-2", "/assets/sprites/zone2/fondo_zona2.png");
    this.load.image("bg-mid-2", "/assets/sprites/zone2/medio_zona2.png");
    this.load.image("bg-front-2", "/assets/sprites/zone2/frente_zona2.png");
    this.load.image("ground-2", "/assets/sprites/zone2/suelo_zona2.png");
    this.load.audio("zone2-music", "/assets/audio/Peldaños Hacia la Santidad.mp3");

    Player.preload(this);
    Enemy.preload(this);
  }

  create() {
    const W = this.scale.width;
    const H = this.scale.height;

    this.worldWidth = W * 2;
    this.physics.world.setBounds(0, 0, this.worldWidth, H);

    this.enemiesKilled = 0;

    gameEvents.emit("sceneChanged", "Zone2Scene");
    gameEvents.emit("zone", "Cuevas Profundas");

    // MÚSICA DE FONDO
    this.bgMusic = this.sound.add("zone2-music", { loop: true, volume: 0.5 });
    this.bgMusic.play();
    
    // NO emitimos enemyKilled al inicio para no resetear el contador acumulativo

    // Guardamos referencias a los listeners para eliminar solo los de esta escena
    const onEnemyDied = () => this.onEnemyDied();
    const onPlayerDead = () => {
      try {
        if (this.bgMusic && this.bgMusic.isPlaying) {
          this.bgMusic.stop();
        }
      } catch (e) {}
    };

    gameEvents.on("enemyDied", onEnemyDied);
    gameEvents.on("playerDead", onPlayerDead);

    // Elimina SOLO los listeners de esta escena, no los del GameContainer
    this.events.on("shutdown", () => {
      gameEvents.off("enemyDied", onEnemyDied);
      gameEvents.off("playerDead", onPlayerDead);
    });

    // CAPAS DE PARALLAX
    this.bgSky = this.add
      .tileSprite(0, 0, this.worldWidth, H, "bg-sky-2")
      .setOrigin(0, 0)
      .setScrollFactor(0);

    this.bgMid = this.add
      .tileSprite(0, 0, this.worldWidth, H, "bg-mid-2")
      .setOrigin(0, 0)
      .setScrollFactor(0);

    this.bgFront = this.add
      .tileSprite(0, 0, this.worldWidth, H, "bg-front-2")
      .setOrigin(0, 0)
      .setScrollFactor(0);

    // PLATAFORMAS
    this.platforms = this.physics.add.staticGroup();

    const ground = this.add.tileSprite(
      this.worldWidth / 2, H - 20,
      this.worldWidth, 275,
      "ground-2"
    ).setOrigin(0.5, 0.5)
     .setTileScale(0.8, 0.6);
    this.physics.add.existing(ground, true);
    this.platforms.add(ground);

    const wallLeft = this.add.rectangle(0, H / 2, 10, H, 0x000000, 0);
    this.physics.add.existing(wallLeft, true);
    this.platforms.add(wallLeft);

    const wallRight = this.add.rectangle(this.worldWidth, H / 2, 10, H, 0x000000, 0);
    this.physics.add.existing(wallRight, true);
    this.platforms.add(wallRight);

    const platData = [
      { x: 400,                   y: H - 400 },
      { x: 750,                   y: H - 300 },
      { x: 1100,                  y: H - 450 },
      { x: W + 150,               y: H - 300 },
      { x: W + 500,               y: H - 480 },
      { x: W + 850,               y: H - 320 },
      { x: this.worldWidth - 300, y: H - 360 },
    ];

    platData.forEach(({ x, y }) => {
      const plat = this.add.tileSprite(x, y, 180, 50, "ground-2")
        .setOrigin(0.5, 0.5)
        .setTileScale(0.45, 0.40);
      this.physics.add.existing(plat, true);
      this.platforms.add(plat);
    });

    // JUGADOR
    this.player = new Player(this);
    this.player.create(150, H - 215, this.platforms);

    // ENEMIGOS
    const enemyData = [
      { x: 500,                   y: H - 215, range: 150 },
      { x: 750,                   y: H - 480, range: 80  },
      { x: 1100,                  y: H - 215, range: 120 },
      { x: 1400,                  y: H - 215, range: 100 },
      { x: W + 150,               y: H - 480, range: 80  },
      { x: W + 400,               y: H - 215, range: 150 },
      { x: W + 700,               y: H - 215, range: 200 },
      { x: W + 1000,              y: H - 500, range: 80  },
      { x: this.worldWidth - 300, y: H - 215, range: 100 },
    ];

    enemyData.forEach(({ x, y, range }) => {
      const enemy = new Enemy(this, x, y, this.platforms, this.player, range);
      enemy.create();
      this.enemies.push(enemy);
    });

    this.totalEnemies = this.enemies.length;

    // CÁMARA
    this.cameras.main.setBounds(0, 0, this.worldWidth, H);
    this.cameras.main.startFollow(this.player.getSprite(), true, 0.1, 0.1);
  }

  private onEnemyDied() {
    this.enemiesKilled++;
    gameEvents.emit("enemyKilled", this.enemiesKilled);

    if (this.enemiesKilled >= this.totalEnemies) {
      this.player.freeze();
      this.time.delayedCall(2000, () => {
        try {
          if (this.bgMusic && this.bgMusic.isPlaying) {
            this.bgMusic.stop();
          }
        } catch (e) {}
        gameEvents.emit("zoneCompleted");
        gameEvents.emit("sceneChanged", "BossScene");
        this.scene.start("BossScene");
      });
    }
  }

  update() {
    const camX = this.cameras.main.scrollX;
    this.bgSky.tilePositionX = camX * 0.1;
    this.bgMid.tilePositionX = camX * 0.3;
    this.bgFront.tilePositionX = camX * 0.6;

    this.player.update();

    const hitbox = this.player.getAttackHitbox();

    if (!hitbox) {
      this.hasHitThisAttack = false;
    }

    this.enemies.forEach((enemy) => {
      if (enemy.getIsDead()) return;

      enemy.update();

      if (hitbox && !this.hasHitThisAttack) {
        const enemySprite = enemy.getSprite();
        const dx = Math.abs(hitbox.x - enemySprite.x);
        const dy = Math.abs(hitbox.y - enemySprite.y);

        if (dx < hitbox.width / 2 + 20 && dy < hitbox.height / 2 + 20) {
          enemy.takeHit();
          this.hasHitThisAttack = true;
        }
      }
    });
  }
}