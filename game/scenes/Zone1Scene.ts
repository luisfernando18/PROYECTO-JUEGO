// RUTA: src/game/scenes/Zone1Scene.ts
import Phaser from "phaser";
import Player from "../entities/Player";
import { getZone1Data } from "../data/Zone1Data";

export default class Zone1Scene extends Phaser.Scene {
  private bgSky!: Phaser.GameObjects.TileSprite;
  private bgMid!: Phaser.GameObjects.TileSprite;
  private bgFront!: Phaser.GameObjects.TileSprite;

  private player!: Player;
  private platforms!: Phaser.Physics.Arcade.StaticGroup;
  private floatingPlatforms!: Phaser.Physics.Arcade.StaticGroup;
  private worldWidth!: number;

  constructor() {
    super({ key: "Zone1Scene" });
  }

  preload() {
    this.load.image("bg-sky", "/assets/sprites/zone1/cielo.png");
    this.load.image("bg-mid", "/assets/sprites/zone1/medio.png");
    this.load.image("bg-front", "/assets/sprites/zone1/frente.png");
    this.load.image("ground", "/assets/sprites/zone1/suelo.jpg");
  }

  create() {
    const W = this.scale.width;
    const H = this.scale.height;
    this.worldWidth = W * 3;

    this.physics.world.setBounds(0, 0, this.worldWidth, H + 600);

    // FONDOS
    this.bgSky = this.add.tileSprite(0, 0, W, H, "bg-sky").setOrigin(0, 0).setScrollFactor(0);
    this.bgMid = this.add.tileSprite(0, 135, W, H, "bg-mid").setOrigin(0, 0).setScrollFactor(0);
    this.bgFront = this.add.tileSprite(0, -745, W, H + 1000, "bg-front").setOrigin(0, 0).setScrollFactor(0);

    this.platforms = this.physics.add.staticGroup();
    this.floatingPlatforms = this.physics.add.staticGroup();

    // TRAEMOS LOS DATOS DESDE NUESTRO ARCHIVO DE DATOS
    const baseY = H - 120; 
    const levelData = getZone1Data(baseY);

    // DIBUJAR SUELO
    levelData.groundSegments.forEach((segment) => {
      const centerX = segment.x + segment.width / 2;
      const finalY = baseY + segment.yOffset;
      const depthHeight = 600 + Math.abs(segment.yOffset); 

      const deepDirt = this.add.rectangle(centerX, finalY + 40, segment.width, depthHeight, 0x1c140d).setOrigin(0.5, 0);
      const groundTop = this.add.tileSprite(centerX, finalY, segment.width, 60, segment.texture)
        .setOrigin(0.5, 0).setTileScale(0.09, 0.12);
      
      this.physics.add.existing(deepDirt, true);
      this.platforms.add(deepDirt);
      this.physics.add.existing(groundTop, true);
      this.platforms.add(groundTop);
    });

    // DIBUJAR PLATAFORMAS FLOTANTES
    levelData.platformsData.forEach((plat) => {
      const platform = this.add.rectangle(plat.x, plat.y, plat.width, plat.height, 0x8b5a2b);
      this.physics.add.existing(platform, true);
      this.floatingPlatforms.add(platform);
    });

    // PAREDES LIMITROFES
    const wallLeft = this.add.rectangle(0, H / 2, 10, H * 2, 0x000000, 0);
    const wallRight = this.add.rectangle(this.worldWidth, H / 2, 10, H * 2, 0x000000, 0);
    this.physics.add.existing(wallLeft, true);
    this.platforms.add(wallLeft);
    this.physics.add.existing(wallRight, true);
    this.platforms.add(wallRight);

    // INICIALIZAMOS AL JUGADOR
    this.player = new Player(this, 150, baseY - 150);
    this.physics.add.collider(this.player, this.platforms);
    this.physics.add.collider(this.player, this.floatingPlatforms); 

    // CÁMARA
    this.cameras.main.setBounds(0, -200, this.worldWidth, H + 300);
    this.cameras.main.setDeadzone(150, 100); 
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
  }

  update() {
    const H = this.scale.height;

    // Llamamos a la lógica del jugador
    this.player.updateLogic();

    if (this.player.y > H + 250) {
      this.scene.restart(); 
    }

    // Parallax
    const camX = this.cameras.main.scrollX;
    this.bgSky.tilePositionX = camX * 0.1;
    this.bgMid.tilePositionX = camX * 0.3;
    this.bgFront.tilePositionX = camX * 0.6;
  }
}