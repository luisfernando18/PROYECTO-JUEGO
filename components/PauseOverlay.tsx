"use client";

import { useState } from "react";
import styles from "./PauseOverlay.module.css";

interface Props {
    onResume: () => void;
    onMainMenu: () => void;
}

export default function PauseOverlay({ onResume, onMainMenu }: Props) {
    const [showInstructions, setShowInstructions] = useState(false);

    return (
        <div className={styles.backdrop}>
            {!showInstructions ? (
                <div className={styles.container}>
                    <h2 className={styles.title}>PAUSA</h2>
                    <div className={styles.buttons}>
                        <button className={styles.btn} onClick={onResume}>
                            ▶ Reanudar
                        </button>
                        <button className={styles.btn} onClick={() => setShowInstructions(true)}>
                             Instrucciones
                        </button>
                        <button className={`${styles.btn} ${styles.btnDanger}`} onClick={onMainMenu}>
                            ✕ Menú Principal
                        </button>
                    </div>
                </div>
            ) : (
                <div className={styles.container}>
                    <h2 className={styles.title}>INSTRUCCIONES</h2>
                    <ul className={styles.instructionsList}>
                        <li><span className={styles.key}>A / ←</span> Moverse a la izquierda</li>
                        <li><span className={styles.key}>D / →</span> Moverse a la derecha</li>
                        <li><span className={styles.key}>SPACE / X</span> Saltar</li>
                        <li><span className={styles.key}>F / Clic Izquierdo / ▢</span> Atacar</li>
                        <li><span className={styles.key}>Q / △</span> Usar cura</li>
                        <li><span className={styles.key}>ESC / ►</span> Pausar / Reanudar</li>
                        <li><span className={styles.key}>Mando</span> D-pad + botones A/B</li>
                    </ul>
                    <button className={styles.btn} onClick={() => setShowInstructions(false)}>
                        ← Volver
                    </button>
                </div>
            )}
        </div>
    );
}