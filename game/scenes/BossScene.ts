import Phaser from "phaser";
import gameEvents from "@/lib/gameEvents";
import Player from "@/game/entities/Player";
import Boss from "@/game/entities/Boss";

export default class BossScene extends Phaser.Scene {
  private bg!: Phaser.GameObjects.Image;
  private bgMusic!: Phaser.Sound.BaseSound;

  private player!: Player;
  private boss!: Boss;
  private platforms!: Phaser.Physics.Arcade.StaticGroup;
  private worldWidth!: number;
  private hasHitThisAttack: boolean = false;

  constructor() {
    super({ key: "BossScene" });
  }

  preload() {
    this.load.image("bg-boss", "/assets/sprites/BossScene/fondo_boss.png");
    this.load.image("ground-boss", "/assets/sprites/BossScene/suelo_boss.png");
    this.load.audio("boss-music", "/assets/audio/MusicaBoss.mp3");

    Player.preload(this);
    Boss.preload(this);
  }

  create() {
    const W = this.scale.width;
    const H = this.scale.height;

    this.worldWidth = W;
    this.physics.world.setBounds(0, 0, this.worldWidth, H);

    // MÚSICA DE FONDO
    this.bgMusic = this.sound.add("boss-music", { loop: true, volume: 0.6 });
    this.bgMusic.play();

    gameEvents.emit("sceneChanged", "BossScene");
    gameEvents.emit("zone", "Catedral de San Francisco");

    const onPlayerDead = () => {
      try {
        if (this.bgMusic && this.bgMusic.isPlaying) {
          this.bgMusic.stop();
        }
      } catch (e) {}
    };

    gameEvents.on("playerDead", onPlayerDead);

    this.events.on("shutdown", () => {
      gameEvents.off("playerDead", onPlayerDead);
    });

    // FONDO
    this.bg = this.add
      .image(W / 2, H / 2, "bg-boss")
      .setDisplaySize(W, H)
      .setScrollFactor(0);

    // PLATAFORMAS
    this.platforms = this.physics.add.staticGroup();

    const ground = this.add.tileSprite(
      W / 2, H - 20,
      W, 275,
      "ground-boss"
    ).setOrigin(0.5, 0.5)
     .setTileScale(0.8, 0.6);
    this.physics.add.existing(ground, true);
    this.platforms.add(ground);

    const wallLeft = this.add.rectangle(0, H / 2, 10, H, 0x000000, 0);
    this.physics.add.existing(wallLeft, true);
    this.platforms.add(wallLeft);

    const wallRight = this.add.rectangle(W, H / 2, 10, H, 0x000000, 0);
    this.physics.add.existing(wallRight, true);
    this.platforms.add(wallRight);

    const platData = [
      { x: W * 0.25,  y: H - 350 }, // izquierda baja
      { x: W * 0.75,  y: H - 350 }, // derecha baja
    ];

    platData.forEach(({ x, y }) => {
      const plat = this.add.tileSprite(x, y, 180, 50, "ground-boss")
        .setOrigin(0.5, 0.5)
        .setTileScale(0.45, 0.40);
      this.physics.add.existing(plat, true);
      this.platforms.add(plat);
    });

    // JUGADOR
    this.player = new Player(this);
    this.player.create(150, H - 215, this.platforms);

    // BOSS — aparece en el centro del escenario
    this.boss = new Boss(this, this.player, this.worldWidth);
    this.boss.create(W / 2, H / 2 - 100, this.platforms);

    // CÁMARA
    this.cameras.main.setBounds(0, 0, this.worldWidth, H);
    this.cameras.main.startFollow(this.player.getSprite(), true, 0.1, 0.1);
  }

  update() {
    this.player.update();
    this.boss.update();

    // Detecta golpes del jugador al boss
    const hitbox = this.player.getAttackHitbox();

    if (!hitbox) {
      this.hasHitThisAttack = false;
    }

    if (hitbox && !this.hasHitThisAttack && !this.boss.getIsDead()) {
      const bossSprite = this.boss.getSprite();
      const dx = Math.abs(hitbox.x - bossSprite.x);
      const dy = Math.abs(hitbox.y - bossSprite.y);

      if (dx < hitbox.width / 2 + 30 && dy < hitbox.height / 2 + 30) {
        this.boss.takeHit();
        this.hasHitThisAttack = true;
      }
    }
  }
}