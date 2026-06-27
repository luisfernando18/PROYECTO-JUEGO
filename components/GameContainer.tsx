"use client";

import { useEffect, useRef } from "react";

export default function GameContainer() {
  const gameRef = useRef<HTMLDivElement>(null);
  const gameInitialized = useRef(false); // Bandera para evitar doble canvas en Strict Mode

  useEffect(() => {
    if (typeof window === "undefined" || gameInitialized.current) return;

    let game: import("phaser").Game; 

    const initPhaser = async () => {
      gameInitialized.current = true; // Marcamos como iniciado
      
      const Phaser = (await import("phaser")).default;
      const Zone1Scene = (await import("@/game/scenes/Zone1Scene")).default;

      const config: Phaser.Types.Core.GameConfig = {
        type: Phaser.AUTO,
        backgroundColor: "#1a0a00",
        // Mejoramos la responsividad con el Scale Manager de Phaser
        scale: {
          mode: Phaser.Scale.RESIZE,
          parent: gameRef.current!,
          width: "100%",
          height: "100%",
        },
        physics: {
          default: "arcade",
          arcade: {
            gravity: { x: 0, y: 600 },
            debug: false, // Cámbialo a true temporalmente si necesitas ver las cajas de colisión
          },
        },
        scene: [Zone1Scene],
      };

      game = new Phaser.Game(config);
    };

    initPhaser();

    // Limpieza al desmontar el componente
    return () => {
      if (game) {
        game.destroy(true);
        gameInitialized.current = false;
      }
    };
  }, []);

  return (
    <div
      ref={gameRef}
      style={{ width: "100vw", height: "100vh", overflow: "hidden" }}
    />
  );
}