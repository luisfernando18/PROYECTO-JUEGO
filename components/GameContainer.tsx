"use client";

import { useEffect, useRef } from "react";
import HUD from "./HUD";

export default function GameContainer() {
  const gameRef = useRef<HTMLDivElement>(null);
  const gameInitialized = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined" || gameInitialized.current) return;

    let game: import("phaser").Game;

    const initPhaser = async () => {
      gameInitialized.current = true;

      const Phaser = (await import("phaser")).default;
      const Zone1Scene = (await import("@/game/scenes/Zone1Scene")).default;

      const config: Phaser.Types.Core.GameConfig = {
        type: Phaser.AUTO,
        backgroundColor: "#1a0a00",
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
            debug: false,
          },
        },
        scene: [Zone1Scene],
      };

      game = new Phaser.Game(config);
    };

    initPhaser();

    return () => {
      if (game) {
        game.destroy(true);
        gameInitialized.current = false;
      }
    };
  }, []);

  return (
    <div style={{ position: "relative", width: "100vw", height: "100vh" }}>
      <div ref={gameRef} style={{ width: "100%", height: "100%", overflow: "hidden" }} />
      <HUD />
    </div>
  );
}