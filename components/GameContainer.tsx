"use client";

import { useEffect, useRef } from "react";

export default function GameContainer() {
  const gameRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    let game: any;

    const initPhaser = async () => {
      const Phaser = (await import("phaser")).default;

      const Zone1Scene = (await import("@/game/scenes/Zone1Scene")).default;

      const config: Phaser.Types.Core.GameConfig = {
        type: Phaser.AUTO,
        width: window.innerWidth,
        height: window.innerHeight,
        backgroundColor: "#1a0a00",
        parent: gameRef.current!,
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
      game?.destroy(true);
    };
  }, []);

  return (
    <div
      ref={gameRef}
      style={{ width: "100vw", height: "100vh", overflow: "hidden" }}
    />
  );
}