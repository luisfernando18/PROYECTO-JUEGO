"use client";

import { useEffect, useState } from "react";
import gameEvents from "@/lib/gameEvents";
import styles from "./HUD.module.css";

export default function HUD() {
    const [hp, setHp] = useState(100);
    const [maxHp] = useState(100);
    const [kills, setKills] = useState(0);
    const [curas, setCuras] = useState(5);
    const [zoneName, setZoneName] = useState("Selva Ancestral");

    useEffect(() => {
        const onHpChange = (value: number) => setHp(value);
        const onEnemyKilled = (value: number) => setKills(value);
        const onCuras = (value: number) => setCuras(value);
        const onZoneChange = (value: string) => setZoneName(value);

        gameEvents.on("hp", onHpChange);
        gameEvents.on("enemyKilled", onEnemyKilled);
        gameEvents.on("curas", onCuras);
        gameEvents.on("zone", onZoneChange);

        return () => {
            gameEvents.off("hp", onHpChange);
            gameEvents.off("enemyKilled", onEnemyKilled);
            gameEvents.off("curas", onCuras);
            gameEvents.off("zone", onZoneChange);
        };
    }, []);

    const hpPercent = Math.max(0, (hp / maxHp) * 100);

    const barColor =
        hpPercent > 60 ? "#f44336" :
            hpPercent > 30 ? "#f44336" :
                "#f44336";

    return (
        <div className={styles.hud}>

            {/* NOMBRE DE LA ZONA */}
            <div className={styles.zoneName}>{zoneName}</div>

            {/* VIDA */}
            <div className={styles.hpSection}>
                <span className={styles.label}>❤ VIDA</span>
                <div className={styles.hpBarBg}>
                    <div
                        className={styles.hpBarFill}
                        style={{
                            width: `${hpPercent}%`,
                            backgroundColor: barColor,
                        }}
                    />
                </div>
                <span className={styles.hpText}>{hp} / {maxHp}</span>
            </div>

            {/* ENEMIGOS DERROTADOS */}
            <div className={styles.stat}>
                <span className={styles.label}>⚔ ENEMIGOS DERROTADOS</span>
                <span className={styles.value}>{kills}</span>
            </div>

            {/* CURAS */}
            <div className={styles.stat}>
                <span className={styles.label}>✦ CURAS</span>
                <span className={styles.value}>{curas} / 5</span>
            </div>

        </div>
    );
}