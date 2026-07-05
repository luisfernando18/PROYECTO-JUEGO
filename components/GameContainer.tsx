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
  const totalKillsRef = useRef(0); // contador acumulativo entre zonas
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

  // Listener de ESC para pausar/reanudar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !showSummary) {
        setIsPaused((prev) => {
          const newPaused = !prev;
          if (gameInstanceRef.current) {
            if (newPaused) {
              gameInstanceRef.current.scene.pause(currentSceneRef.current);
            } else {
              gameInstanceRef.current.scene.resume(currentSceneRef.current);
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

    // Enemigos — acumula entre zonas
    const onKills = (value: number) => {
      killsRef.current = totalKillsRef.current + value;
      gameEvents.emit("enemyKilledTotal", killsRef.current);
    };

    const onBosses = (value: number) => { bossesRef.current = value; };

    // Cuando cambia de zona, guarda el total actual y resetea el local
    const onZoneChange = () => {
      totalKillsRef.current = killsRef.current;
    };

    // Detecta qué escena está activa para pausar correctamente
    const onSceneChange = (sceneName: string) => {
      currentSceneRef.current = sceneName;
      setIsPaused(false); //Asegura que la pausa se cierre al cambiar de zona
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

  const handleResume = () => {
    setIsPaused(false);
    if (gameInstanceRef.current) {
      gameInstanceRef.current.scene.resume(currentSceneRef.current);
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