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
  const totalKillsRef = useRef(0);
  const [showSummary, setShowSummary] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const currentSceneRef = useRef("Zone1Scene");
  const router = useRouter();

  const destroyPhaser = () => {
    if (gameInstanceRef.current) {
      gameInstanceRef.current.input?.keyboard?.clearCaptures();
      gameInstanceRef.current.destroy(true);
      gameInstanceRef.current = null;
      gameInitialized.current = false;
    }
  };

  // Solo pausa — no despausa
  const pauseGame = () => {
    if (showSummary || isPaused) return;
    setIsPaused(true);
    if (gameInstanceRef.current) {
      gameInstanceRef.current.scene.pause(currentSceneRef.current);
    }
  };

  // Solo reanuda — no pausa
  const resumeGame = () => {
    setIsPaused(false);
    if (gameInstanceRef.current) {
      gameInstanceRef.current.scene.resume(currentSceneRef.current);
    }
  };

  // ESC alterna pausa/reanudar desde teclado
  const togglePause = () => {
    if (showSummary) return;
    if (isPaused) {
      resumeGame();
    } else {
      pauseGame();
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") togglePause();
    };

    // Start del mando — solo pausa
    const onGamepadPause = () => pauseGame();

    window.addEventListener("keydown", handleKeyDown);
    gameEvents.on("gamepadPause", onGamepadPause);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      gameEvents.off("gamepadPause", onGamepadPause);
    };
  }, [showSummary, isPaused]);

  useEffect(() => {
    const onTime = (value: number) => { timeRef.current = value; };

    const onKills = (value: number) => {
      killsRef.current = totalKillsRef.current + value;
      gameEvents.emit("enemyKilledTotal", killsRef.current);
    };

    const onBosses = (value: number) => { bossesRef.current = value; };

    const onZoneChange = () => {
      totalKillsRef.current = killsRef.current;
    };

    const onSceneChange = (sceneName: string) => {
      currentSceneRef.current = sceneName;
      setIsPaused(false);
    };

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
    gameEvents.on("zoneCompleted", onZoneChange);
    gameEvents.on("sceneChanged", onSceneChange);
    gameEvents.on("playerDead", onPlayerDead);
    gameEvents.on("playerWon", onPlayerWon);

    return () => {
      gameEvents.off("timeElapsed", onTime);
      gameEvents.off("enemyKilled", onKills);
      gameEvents.off("bossDefeated", onBosses);
      gameEvents.off("zoneCompleted", onZoneChange);
      gameEvents.off("sceneChanged", onSceneChange);
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
      const Zone2Scene = (await import("@/game/scenes/Zone2Scene")).default;
      const BossScene = (await import("@/game/scenes/BossScene")).default;

      const config: Phaser.Types.Core.GameConfig = {
        type: Phaser.AUTO,
        backgroundColor: "#1a0a00",
        scale: {
          mode: Phaser.Scale.RESIZE,
          parent: gameRef.current!,
          width: "100%",
          height: "100%",
        },
        input: {
          gamepad: true,
        },
        physics: {
          default: "arcade",
          arcade: {
            gravity: { x: 0, y: 2000 },
            debug: false,
          },
        },
        scene: [Zone1Scene, Zone2Scene, BossScene],
      };

      gameInstanceRef.current = new Phaser.Game(config);
    };

    initPhaser();

    return () => {
      destroyPhaser();
    };
  }, []);

  return (
    <div style={{ position: "relative", width: "100vw", height: "100vh" }}>
      <div ref={gameRef} style={{ width: "100%", height: "100%", overflow: "hidden" }} />
      <HUD />
      {isPaused && !showSummary && (
        <PauseOverlay
          onResume={resumeGame}
          onMainMenu={() => { destroyPhaser(); router.push("/"); }}
        />
      )}
      {showSummary && <SummaryScreen onRestart={() => router.push("/")} />}
    </div>
  );
}