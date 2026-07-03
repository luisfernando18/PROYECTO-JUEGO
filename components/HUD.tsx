"use client";

import { useEffect, useState, useRef } from "react";
import gameEvents from "@/lib/gameEvents";
import styles from "./HUD.module.css";

export default function HUD() {
    const [hp, setHp] = useState(100);
    const [maxHp] = useState(100);
    const [kills, setKills] = useState(0);
    const [curas, setCuras] = useState(5);
    const [zoneName, setZoneName] = useState("Selva Ancestral");
    const [timeElapsed, setTimeElapsed] = useState(0);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        const onHpChange = (value: number) => setHp(value);
        const onEnemyKilled = (value: number) => setKills(value);
        const onCuras = (value: number) => setCuras(value);
        const onZoneChange = (value: string) => setZoneName(value);

        gameEvents.on("hp", onHpChange);
        gameEvents.on("enemyKilled", onEnemyKilled);
        gameEvents.on("curas", onCuras);
        gameEvents.on("zone", onZoneChange);

        // Inicia el timer
        timerRef.current = setInterval(() => {
            setTimeElapsed((prev) => {
                const newTime = prev + 1;
                gameEvents.emit("timeElapsed", newTime); // emite el tiempo para guardarlo
                return newTime;
            });
        }, 1000);

        return () => {
            gameEvents.off("hp", onHpChange);
            gameEvents.off("enemyKilled", onEnemyKilled);
            gameEvents.off("curas", onCuras);
            gameEvents.off("zone", onZoneChange);
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, []);

    const hpPercent = Math.max(0, (hp / maxHp) * 100);

    const barColor =
        hpPercent > 60 ? "#f44336" :
            hpPercent > 30 ? "#f44336" :
                "#f44336";

    // Formatea el tiempo como MM:SS
    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60).toString().padStart(2, "0");
        const s = (seconds % 60).toString().padStart(2, "0");
        return `${m}:${s}`;
    };

    return (
        <div className={styles.hud}>

            <div className={styles.zoneName}>{zoneName}</div>

            <div className={styles.hpSection}>
                <span className={styles.label}>❤ VIDA</span>
                <div className={styles.hpBarBg}>
                    <div
                        className={styles.hpBarFill}
                        style={{ width: `${hpPercent}%`, backgroundColor: barColor }}
                    />
                </div>
                <span className={styles.hpText}>{hp} / {maxHp}</span>
            </div>

            <div className={styles.stat}>
                <span className={styles.label}>⚔ ENEMIGOS DERROTADOS</span>
                <span className={styles.value}>{kills}</span>
            </div>

            <div className={styles.stat}>
                <span className={styles.label}>✦ CURAS</span>
                <span className={styles.value}>{curas} / 5</span>
            </div>

            {/* TIMER */}
            <div className={styles.stat}>
                <span className={styles.label}>⏱ TIEMPO</span>
                <span className={styles.value}>{formatTime(timeElapsed)}</span>
            </div>

        </div>
    );
}