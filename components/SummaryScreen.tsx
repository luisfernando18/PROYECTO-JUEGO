"use client";

import { useEffect, useState } from "react";
import { loadSession } from "@/lib/storage";
import styles from "./SummaryScreen.module.css";

interface Props {
    onRestart: () => void;
}

export default function SummaryScreen({ onRestart }: Props) {
    const [session, setSession] = useState({
        playerName: "Desconocido",
        enemiesKilled: 0,
        bossesDefeated: 0,
        timeElapsed: 0,
        won: false,
    });

    useEffect(() => {
        const data = loadSession();
        if (data) setSession(data);

        //SE REPRODUCE UN SONIDO DEPENDIENDO SI MUERE O GANA EL JUGADOR
        const audioFile = data?.won
            ? "/assets/audio/Victoria.mp3"
            : "/assets/audio/Muerte.mp3";

        const audio = new Audio(audioFile);
        audio.volume = 0.7;
        audio.play().catch(() => {}); //POR SI SE BLOQUEA EL NAVEGADOR

        return () => {
            audio.pause();
            audio.currentTime = 0;
        };
    }, []);

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60).toString().padStart(2, "0");
        const s = (seconds % 60).toString().padStart(2, "0");
        return `${m}:${s}`;
    };

    return (
        <div className={styles.backdrop}>
            <div className={styles.container}>

                <h1 className={styles.title}>
                    {session.won ? " HAS DERROTADO AL DIABLO " : " HAS MUERTO "}
                </h1>

                <p className={styles.playerName}>Nombre del jugador: {session.playerName}</p>

                <div className={styles.stats}>
                    <div className={styles.statRow}>
                        <span className={styles.statLabel}>Enemigos derrotados</span>
                        <span className={styles.statValue}>{session.enemiesKilled}</span>
                    </div>
                    <div className={styles.statRow}>
                        <span className={styles.statLabel}>Bosses derrotados</span>
                        <span className={styles.statValue}>{session.bossesDefeated} / 1</span>
                    </div>
                    <div className={styles.statRow}>
                        <span className={styles.statLabel}>Tiempo transcurrido</span>
                        <span className={styles.statValue}>{formatTime(session.timeElapsed)}</span>
                    </div>
                </div>

                <button className={styles.btn} onClick={onRestart}>
                    Volver al menú
                </button>

            </div>
        </div>
    );
}