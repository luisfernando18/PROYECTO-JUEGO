import Phaser from "phaser";
import gameEvents from "@/lib/gameEvents";
import Player from "@/game/entities/Player";

type BossState = "following" | "knockback" | "attacking" | "preparing_sweep" | "sweeping" | "dead";

export default class Boss {
  private scene: Phaser.Scene;
  private player: Player;
  public sprite!: Phaser.Physics.Arcade.Sprite;

  private hp: number = 400;
  private maxHp: number = 400;
  private speed: number = 350;
  private state: BossState = "following";
  private currentScale: number = 2.7;

  private lastDamageTime: number = 0;
  private damageCooldown: number = 800;

  private normalAttackTimer: number = 0;
  private normalAttackInterval: number = 2000; //TIEMPO ENTRE ATAQUES NORMALES
  private normalAttackDamage: number = 20; //DAÑO DE ATAQUE NORMAL

  private sweepTimer: number = 0;
  private sweepInterval: number = 15000; //TIEMPO ENTRE ATAQUES DE BARRIDO
  private sweepTargetX: number = 0;

  private hpBarBg!: Phaser.GameObjects.Rectangle;
  private hpBarFill!: Phaser.GameObjects.Rectangle;
  private nameText!: Phaser.GameObjects.Text;

  private soundFloat!: Phaser.Sound.BaseSound;
  private soundAttack!: Phaser.Sound.BaseSound;
  private soundSweep!: Phaser.Sound.BaseSound;
  private soundDeath!: Phaser.Sound.BaseSound;

  private worldWidth: number;

  constructor(scene: Phaser.Scene, player: Player, worldWidth: number) {
    this.scene = scene;
    this.player = player;
    this.worldWidth = worldWidth;
  }

  static preload(scene: Phaser.Scene) {
    scene.load.spritesheet("boss-float", "/assets/sprites/Boss/diablo_flotando.png", { frameWidth: 64, frameHeight: 64 });
    scene.load.spritesheet("boss-attack", "/assets/sprites/Boss/diablo_ataque.png", { frameWidth: 64, frameHeight: 64 });
    scene.load.audio("boss-float-sound", "/assets/audio/Boss/Boss-flotando.mp3");
    scene.load.audio("boss-attack-sound", "/assets/audio/Boss/Boss-ataque.mp3");
    scene.load.audio("boss-sweep-sound", "/assets/audio/Boss/Boss-barrido.mp3");
    scene.load.audio("boss-death-sound", "/assets/audio/Boss/Boss-muerte1.mp3");
  }

  create(x: number, y: number, platforms: Phaser.Physics.Arcade.StaticGroup) {
    const H = this.scene.scale.height;
    const W = this.scene.scale.width;

    this.sprite = this.scene.physics.add.sprite(x, y, "boss-float");
    this.sprite.setScale(this.currentScale);
    this.sprite.setDepth(5);

    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
    body.setCollideWorldBounds(true);
    body.setSize(40, 50);
    body.setOffset(12, 6);

    this.scene.anims.create({ key: "boss-float", frames: this.scene.anims.generateFrameNumbers("boss-float", { start: 0, end: 2 }), frameRate: 6, repeat: -1 });
    this.scene.anims.create({ key: "boss-attack", frames: this.scene.anims.generateFrameNumbers("boss-attack", { start: 0, end: 3 }), frameRate: 10, repeat: 0 });
    this.scene.anims.create({ key: "boss-sweep", frames: this.scene.anims.generateFrameNumbers("boss-attack", { start: 0, end: 3 }), frameRate: 12, repeat: -1 });

    this.sprite.play("boss-float");

    const barWidth = 400; const barHeight = 20;
    const barX = W / 2 - barWidth / 2; const barY = H - 60;

    this.nameText = this.scene.add.text(W / 2, barY - 25, "EL DIABLO - FALSA PROMESA", { fontFamily: "serif", fontSize: "16px", color: "#e8d5a3", letterSpacing: 4 }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(10);
    this.hpBarBg = this.scene.add.rectangle(barX, barY, barWidth, barHeight, 0x1a0a00).setOrigin(0, 0).setScrollFactor(0).setDepth(10);
    this.scene.add.rectangle(barX - 2, barY - 2, barWidth + 4, barHeight + 4, 0x6b5030).setOrigin(0, 0).setScrollFactor(0).setDepth(9);
    this.hpBarFill = this.scene.add.rectangle(barX, barY, barWidth, barHeight, 0xc0392b).setOrigin(0, 0).setScrollFactor(0).setDepth(11);

    this.normalAttackTimer = this.scene.time.now;
    this.sweepTimer = this.scene.time.now;

    this.soundFloat = this.scene.sound.add("boss-float-sound", { loop: true, volume: 0.4 });
    this.soundAttack = this.scene.sound.add("boss-attack-sound", { volume: 0.6 });
    this.soundSweep = this.scene.sound.add("boss-sweep-sound", { loop: true, volume: 0.6 });
    this.soundDeath = this.scene.sound.add("boss-death-sound", { volume: 0.5 });
    this.soundFloat.play();
  }

  update() {
    if (this.state === "dead") return;
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    if (!body || !body.enable) return;

    const now = this.scene.time.now;

    if (this.state === "following" && now - this.sweepTimer >= this.sweepInterval) {
      this.startSweep();
      return;
    }
    if (this.state === "following" && now - this.normalAttackTimer >= this.normalAttackInterval) {
      this.performNormalAttack();
      return;
    }
    if (this.state === "following") this.followPlayer(body);
    if (this.state === "sweeping") this.performSweep(body);
  }

  private followPlayer(body: Phaser.Physics.Arcade.Body) {
    const playerSprite = this.player.getSprite();
    const dx = playerSprite.x - this.sprite.x;
    const dy = playerSprite.y - this.sprite.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > 10) {
      body.setVelocityX((dx / dist) * this.speed);
      body.setVelocityY((dy / dist) * this.speed);
      this.sprite.setFlipX(dx > 0);
    } else {
      body.setVelocity(0, 0);
    }
    if (this.sprite.anims.currentAnim?.key !== "boss-float") this.sprite.play("boss-float", true);
  }
  //ATAQUE NORMAL
  private performNormalAttack() {
    this.state = "attacking";
    this.soundFloat.stop();
    this.soundAttack.play();
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(0, 0);

    this.sprite.play("boss-attack");
    this.sprite.once("animationcomplete", () => {
      if (this.state === "dead" || !this.sprite.active) return;
      
      const playerSprite = this.player.getSprite();
      const distance = Phaser.Math.Distance.Between(this.sprite.x, this.sprite.y, playerSprite.x, playerSprite.y);

      if (distance < 200) this.player.takeDamage(this.normalAttackDamage);

      this.sprite.play("boss-float", true);
      this.state = "following";
      this.normalAttackTimer = this.scene.time.now;
      this.soundFloat.play();
    });
  }
  //COMIENZA EL BARRIDO
  private startSweep() {
    this.state = "preparing_sweep";
    this.soundSweep.play();
    const { height: H, width: W } = this.scene.scale;
    const startLeft = Math.random() < 0.5;
    const startX = startLeft ? 80 : W - 80;
    const targetX = startLeft ? W - 80 : 80;
    const groundY = H - 180;

    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(0, 0);

    this.scene.tweens.add({
      targets: this.sprite,
      x: startX, y: groundY,
      duration: 3500,
      ease: "Power2",
      onComplete: () => {
        if (!this.sprite || !this.sprite.active) return;
        this.sprite.setFlipX(startLeft ? false : true);
        this.sprite.play("boss-sweep", true);
        this.scene.time.delayedCall(600, () => {
          if (this.state !== "dead" && this.sprite.active) {
            this.state = "sweeping";
            this.sweepTargetX = targetX;
          }
        });
      },
    });
  }
  //ATAQUE DE BARRIDO
  private performSweep(body: Phaser.Physics.Arcade.Body) {
    if (!body.enable) return;
    const dx = this.sweepTargetX - this.sprite.x;
    this.sprite.setFlipX(dx > 0);

    if (Math.abs(dx) > 20) {
      body.setVelocityX(dx > 0 ? 1100 : -1100);
      body.setVelocityY(0);
      const now = this.scene.time.now;
      if (now - this.lastDamageTime >= this.damageCooldown) {
        const playerSprite = this.player.getSprite();
        const dist = Phaser.Math.Distance.Between(this.sprite.x, this.sprite.y, playerSprite.x, playerSprite.y);
        if (dist < 80) {
          this.lastDamageTime = now;
          this.player.takeDamage(40); //DAÑO DE BARRIDO
        }
      }
    } else {
      body.setVelocity(0, 0);
      this.soundSweep.stop();
      this.soundFloat.play();
      this.sprite.play("boss-float", true);
      this.state = "following";
      this.sweepTimer = this.scene.time.now;
    }
  }

  takeHit() {
    if (this.state === "dead") return;
    this.hp -= 5;
    this.hpBarFill.setDisplaySize(400 * (this.hp / this.maxHp), 20);
    this.sprite.setTint(0xff0000);
    this.scene.time.delayedCall(150, () => { if (this.state !== "dead") this.sprite.clearTint(); });
    
    this.state = "knockback";
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    body.setVelocityX(this.sprite.x > this.player.getSprite().x ? 400 : -400);
    this.scene.time.delayedCall(200, () => { if (this.state !== "dead") body.setVelocityX(0); });
    this.scene.time.delayedCall(600, () => { if (this.state !== "dead") this.state = "following"; });

    if (this.hp <= 0) this.die();
  }

  private die() {
    this.state = "dead";
    this.soundDeath.play();
    this.soundFloat.stop(); this.soundSweep.stop(); this.soundAttack.stop();
    (this.sprite.body as Phaser.Physics.Arcade.Body).enable = false;

    this.scene.tweens.add({
      targets: this.sprite,
      alpha: 0,
      duration: 800,
      onComplete: () => {
        if (this.sprite) {
          this.sprite.destroy();
          this.hpBarBg.destroy(); this.hpBarFill.destroy(); this.nameText.destroy();
          this.scene.time.delayedCall(1000, () => { gameEvents.emit("bossDefeated", 1); gameEvents.emit("playerWon"); });
        }
      },
    });
  }

  getSprite() { return this.sprite; }
  getIsDead() { return this.state === "dead"; }
}