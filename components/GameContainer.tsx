"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import HUD from "./HUD";
import SummaryScreen from "./SummaryScreen";
import PauseOverlay from "./PauseOverlay";
import gameEvents from "@/lib/gameEvents";
import { saveSession, getPlayerName } from "@/lib/storage";

export default function GameContainer() {
  const gameRef = useRef<HTMLDivElement>(null);
  const gameInitialized = useRef(false);
  const gameInstanceRef = useRef<import("phaser").Game | null>(null);
  const timeRef = useRef(0);
  const killsRef = useRef(0);
  const bossesRef = useRef(0);
  const [showSummary, setShowSummary] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const router = useRouter();

  const destroyPhaser = () => {
    if (gameInstanceRef.current) {
      gameInstanceRef.current.input?.keyboard?.clearCaptures();
      gameInstanceRef.current.destroy(true);
      gameInstanceRef.current = null;
      gameInitialized.current = false;
    }
  };

  // Listener de ESC para pausar/reanudar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !showSummary) {
        setIsPaused((prev) => {
          const newPaused = !prev;
          // Pausa o reanuda Phaser
          if (gameInstanceRef.current) {
            if (newPaused) {
              gameInstanceRef.current.scene.pause("Zone1Scene");
            } else {
              gameInstanceRef.current.scene.resume("Zone1Scene");
            }
          }
          return newPaused;
        });
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showSummary]);

  useEffect(() => {
    const onTime = (value: number) => { timeRef.current = value; };
    const onKills = (value: number) => { killsRef.current = value; };
    const onBosses = (value: number) => { bossesRef.current = value; };

    const onPlayerDead = () => {
      saveSession({
        playerName: getPlayerName(),
        enemiesKilled: killsRef.current,
        bossesDefeated: bossesRef.current,
        timeElapsed: timeRef.current,
        won: false,
      });
      destroyPhaser();
      setShowSummary(true);
    };

    const onPlayerWon = () => {
      saveSession({
        playerName: getPlayerName(),
        enemiesKilled: killsRef.current,
        bossesDefeated: bossesRef.current,
        timeElapsed: timeRef.current,
        won: true,
      });
      destroyPhaser();
      setShowSummary(true);
    };

    gameEvents.on("timeElapsed", onTime);
    gameEvents.on("enemyKilled", onKills);
    gameEvents.on("bossDefeated", onBosses);
    gameEvents.on("playerDead", onPlayerDead);
    gameEvents.on("playerWon", onPlayerWon);

    return () => {
      gameEvents.off("timeElapsed", onTime);
      gameEvents.off("enemyKilled", onKills);
      gameEvents.off("bossDefeated", onBosses);
      gameEvents.off("playerDead", onPlayerDead);
      gameEvents.off("playerWon", onPlayerWon);
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || gameInitialized.current) return;

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
            gravity: { x: 0, y: 2000 },
            debug: false,
          },
        },
        scene: [Zone1Scene],
      };

      gameInstanceRef.current = new Phaser.Game(config);
    };

    initPhaser();

    return () => {
      destroyPhaser();
    };
  }, []);

  const handleResume = () => {
    setIsPaused(false);
    if (gameInstanceRef.current) {
      gameInstanceRef.current.scene.resume("Zone1Scene");
    }
  };

  const handleMainMenu = () => {
    destroyPhaser();
    router.push("/");
  };

  const handleRestart = () => {
    router.push("/");
  };

  return (
    <div style={{ position: "relative", width: "100vw", height: "100vh" }}>
      <div ref={gameRef} style={{ width: "100%", height: "100%", overflow: "hidden" }} />
      <HUD />
      {isPaused && !showSummary && (
        <PauseOverlay
          onResume={handleResume}
          onMainMenu={handleMainMenu}
        />
      )}
      {showSummary && <SummaryScreen onRestart={handleRestart} />}
    </div>
  );
}