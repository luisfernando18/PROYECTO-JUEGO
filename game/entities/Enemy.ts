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
  protected detectionRange: number = 320;
  protected attackRange: number = 120; // rango para activar el ataque
  protected damage: number = 10;

  protected direction: 1 | -1 = 1;
  protected isDead: boolean = false;
  protected isChasing: boolean = false;
  protected isKnockedBack: boolean = false;
  protected isAttacking: boolean = false;
  protected lastAttackTime: number = 0;
  protected attackCooldown: number = 1500;

  protected soundWalk!: Phaser.Sound.BaseSound;
  protected soundAttack!: Phaser.Sound.BaseSound;
  protected soundDeath!: Phaser.Sound.BaseSound;

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
    scene.load.spritesheet("enemy-attack", "/assets/sprites/enemy/ataque oso.png", {
      frameWidth: 64,
      frameHeight: 64,
    });

    //SONIDOS
    scene.load.audio("enemy-walk", "/assets/audio/Enemy/Enemy-caminando.mp3");
    scene.load.audio("enemy-attack", "/assets/audio/Enemy/Enemy-atacar1.mp3");
    scene.load.audio("enemy-death", "/assets/audio/Enemy/Enemy-muerte1.mp3");
  }

  create() {
    this.sprite = this.scene.physics.add.sprite(this.spawnX, this.spawnY, "enemy-run");
    this.sprite.setScale(2);

    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    body.setSize(36, 50);
    body.setOffset(14, -2);
    body.setCollideWorldBounds(true);

    if (!this.scene.anims.exists("enemy-run")) {
      this.scene.anims.create({
        key: "enemy-run",
        frames: this.scene.anims.generateFrameNumbers("enemy-run", { start: 0, end: 6 }),
        frameRate: 9,
        repeat: -1,
      });
    }

    if (!this.scene.anims.exists("enemy-attack")) {
      this.scene.anims.create({
        key: "enemy-attack",
        frames: this.scene.anims.generateFrameNumbers("enemy-attack", { start: 0, end: 2 }),
        frameRate: 9,
        repeat: 0, // se reproduce una sola vez
      });
    }

    this.sprite.play("enemy-run");

    this.scene.physics.add.collider(this.sprite, this.platforms);

    // Ya no hay overlap de daño por contacto

    this.soundWalk = this.scene.sound.add("enemy-walk", { loop: true, volume: 0.3 });
    this.soundAttack = this.scene.sound.add("enemy-attack", { volume: 0.5 });
    this.soundDeath = this.scene.sound.add("enemy-death", { volume: 0.5 });
  }

  update() {
    if (this.isDead) return;
    if (this.isKnockedBack) return;
    if (this.isAttacking) return; // no se mueve mientras ataca

    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    const playerSprite = this.player.getSprite();
    const distanceToPlayer = Phaser.Math.Distance.Between(
      this.sprite.x, this.sprite.y,
      playerSprite.x, playerSprite.y
    );

    this.isChasing = distanceToPlayer <= this.detectionRange;

    // Si el jugador está dentro del rango de ataque, ataca
    if (this.isChasing && distanceToPlayer <= this.attackRange) {
      const now = this.scene.time.now;
      if (now - this.lastAttackTime >= this.attackCooldown) {
        this.performAttack();
        return;
      }
      // Si está en rango pero en cooldown, se queda quieto esperando
      body.setVelocityX(0);
      return;
    }

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

    if (body.velocity.x !== 0) {
      if (!this.soundWalk.isPlaying) this.soundWalk.play();
    } else {
      if (this.soundWalk.isPlaying) this.soundWalk.stop();
    }
  }

  protected performAttack() {
    this.isAttacking = true;
    this.soundAttack.play();
    this.lastAttackTime = this.scene.time.now;

    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    body.setVelocityX(0);

    // Mira hacia el jugador antes de atacar
    const playerX = this.player.getSprite().x;
    this.sprite.setFlipX(this.sprite.x > playerX);

    this.sprite.play("enemy-attack");
    this.sprite.once("animationcomplete", () => {
      if (this.isDead) return;

      // Verifica que el jugador siga en rango antes de hacer daño
      const distanceToPlayer = Phaser.Math.Distance.Between(
        this.sprite.x, this.sprite.y,
        this.player.getSprite().x, this.player.getSprite().y
      );

      if (distanceToPlayer <= this.attackRange) {
        this.player.takeDamage(this.damage);
      }

      this.isAttacking = false;
      this.sprite.play("enemy-run", true);
    });
  }

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

    this.scene.tweens.add({
      targets: this.sprite,
      scaleX: 2.35,
      scaleY: 1.9,
      duration: 40,
      yoyo: true,
      repeat: 5,
      ease: "Sine.easeInOut",
      onComplete: () => {
        this.sprite.setScale(2);
      }
    });

    const playerX = this.player.getSprite().x;
    const knockbackDirection = this.sprite.x > playerX ? 1 : -1;
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;

    this.isKnockedBack = true;
    this.isAttacking = false; // cancela el ataque si estaba atacando
    body.setVelocityX(550 * knockbackDirection);

    this.scene.time.delayedCall(250, () => {
      if (!this.isDead) body.setVelocityX(0);
    });

    this.scene.time.delayedCall(1000, () => {
      if (!this.isDead) this.isKnockedBack = false;
    });

    if (this.hp <= 0) {
      this.die();
    }
  }

  protected die() {
    this.isDead = true;
    this.soundWalk.stop();
    this.soundDeath.play();

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

  getSprite() {
    return this.sprite;
  }

  getIsDead() {
    return this.isDead;
  }
}