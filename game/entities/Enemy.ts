import Phaser from "phaser";
import gameEvents from "@/lib/gameEvents";
import Player from "@/game/entities/Player";

export default class Enemy {
  protected scene: Phaser.Scene;
  public sprite!: Phaser.Physics.Arcade.Sprite;

  protected player: Player;
  protected platforms: Phaser.Physics.Arcade.StaticGroup;

  protected spawnX: number;
  protected spawnY: number;
  protected patrolRange: number;

  protected hp: number = 5;
  protected speed: number = 80;
  protected chaseSpeed: number = 140;
  protected detectionRange: number = 220;
  protected damage: number = 10;

  protected direction: 1 | -1 = 1;
  protected isDead: boolean = false;
  protected isChasing: boolean = false;
  protected lastDamageTime: number = 0;
  protected damageCooldown: number = 800;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    platforms: Phaser.Physics.Arcade.StaticGroup,
    player: Player,
    patrolRange: number = 150
  ) {
    this.scene = scene;
    this.spawnX = x;
    this.spawnY = y;
    this.platforms = platforms;
    this.player = player;
    this.patrolRange = patrolRange;
  }

  static preload(scene: Phaser.Scene) {
    scene.load.spritesheet("enemy-run", "/assets/sprites/enemy/correr_enemigo.png", {
      frameWidth: 64,
      frameHeight: 64,
    });
  }

  create() {
    this.sprite = this.scene.physics.add.sprite(this.spawnX, this.spawnY, "enemy-run");
    this.sprite.setScale(2);

    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    body.setSize(36, 50);
    body.setOffset(14, 8);
    body.setCollideWorldBounds(true);

    if (!this.scene.anims.exists("enemy-run")) {
      this.scene.anims.create({
        key: "enemy-run",
        frames: this.scene.anims.generateFrameNumbers("enemy-run", { start: 0, end: 6 }),
        frameRate: 9,
        repeat: -1,
      });
    }

    this.sprite.play("enemy-run");

    this.scene.physics.add.collider(this.sprite, this.platforms);

    this.scene.physics.add.overlap(
      this.sprite,
      this.player.getSprite(),
      () => this.onPlayerContact(),
      undefined,
      this
    );
  }

  update() {
    if (this.isDead) return;

    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    const playerSprite = this.player.getSprite();
    const distanceToPlayer = Phaser.Math.Distance.Between(
      this.sprite.x, this.sprite.y,
      playerSprite.x, playerSprite.y
    );

    this.isChasing = distanceToPlayer <= this.detectionRange;

    if (this.isChasing) {
      const nextDirection = playerSprite.x < this.sprite.x ? -1 : 1;
      const hasGroundAhead = this.checkGroundAhead(nextDirection);

      if (hasGroundAhead) {
        this.direction = nextDirection;
        body.setVelocityX(this.chaseSpeed * this.direction);
      } else {
        body.setVelocityX(0);
      }
    } else {
      if (this.sprite.x >= this.spawnX + this.patrolRange) {
        this.direction = -1;
      } else if (this.sprite.x <= this.spawnX - this.patrolRange) {
        this.direction = 1;
      }
      body.setVelocityX(this.speed * this.direction);
    }

    this.sprite.setFlipX(this.direction === -1);

    if (!this.sprite.anims.isPlaying || this.sprite.anims.currentAnim?.key !== "enemy-run") {
      this.sprite.play("enemy-run", true);
    }
  }

  // Verifica si hay plataforma debajo, un poco adelante en la dirección dada
  protected checkGroundAhead(direction: 1 | -1): boolean {
    const checkDistance = 40;
    const checkX = this.sprite.x + checkDistance * direction;
    const checkY = this.sprite.y + 60;

    const children = this.platforms.getChildren() as Phaser.GameObjects.GameObject[];

    for (const platform of children) {
      const body = (platform as any).body as Phaser.Physics.Arcade.StaticBody;
      if (!body) continue;

      if (
        checkX >= body.x &&
        checkX <= body.x + body.width &&
        checkY >= body.y - 10 &&
        checkY <= body.y + body.height + 10
      ) {
        return true;
      }
    }

    return false;
  }

  takeHit() {
    if (this.isDead) return;

    this.hp--;

    this.sprite.setTint(0xff0000);
    this.scene.time.delayedCall(150, () => {
      if (!this.isDead) this.sprite.clearTint();
    });

    if (this.hp <= 0) {
      this.die();
    }
  }

  protected die() {
    this.isDead = true;

    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(0, 0);
    body.enable = false;

    this.scene.tweens.add({
      targets: this.sprite,
      alpha: 0,
      duration: 400,
      onComplete: () => {
        this.sprite.destroy();
      },
    });

    gameEvents.emit("enemyDied");
  }

  protected onPlayerContact() {
    if (this.isDead) return;

    const now = this.scene.time.now;
    if (now - this.lastDamageTime < this.damageCooldown) return;

    this.lastDamageTime = now;
    this.player.takeDamage(this.damage);
  }

  getSprite() {
    return this.sprite;
  }

  getIsDead() {
    return this.isDead;
  }
}