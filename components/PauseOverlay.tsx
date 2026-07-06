"use client";

import { useState, useEffect, useRef } from "react";
import styles from "./PauseOverlay.module.css";

interface Props {
    onResume: () => void;
    onMainMenu: () => void;
}

export default function PauseOverlay({ onResume, onMainMenu }: Props) {
    const [showInstructions, setShowInstructions] = useState(false);
    const [focusedButton, setFocusedButton] = useState(0);
    const totalButtons = 3;

    // Referencias para el bucle de alta velocidad
    const stateRef = useRef({ showInstructions, focusedButton });
    useEffect(() => {
        stateRef.current = { showInstructions, focusedButton };
    }, [showInstructions, focusedButton]);

    const padPrevRef = useRef({ up: false, down: false, a: false, b: false });

    // --- Lógica de navegación ---
    const handleSelect = (index: number) => {
        if (index === 0) onResume();
        if (index === 1) setShowInstructions(true);
        if (index === 2) onMainMenu();
    };

    // --- Bucle de Gamepad (60 FPS) ---
    useEffect(() => {
        let animationFrameId: number;

        const pollGamepad = () => {
            const pad = navigator.getGamepads()[0];
            if (pad) {
                const { showInstructions: isInst, focusedButton: curFocus } = stateRef.current;

                // D-Pad Arriba (12) o Joystick arriba / D-Pad Abajo (13) o Joystick abajo
                const currentUp = pad.buttons[4]?.pressed || pad.axes[1] < -0.5;
                const currentDown = pad.buttons[6]?.pressed || pad.axes[1] > 0.5;
                const currentA = pad.buttons[14]?.pressed; // Botón A/X
                const currentB = pad.buttons[13]?.pressed; // Botón B/O

                // Detectar cambios (JustPressed)
                if (currentUp && !padPrevRef.current.up) {
                    setFocusedButton((p) => (p - 1 + totalButtons) % totalButtons);
                }
                if (currentDown && !padPrevRef.current.down) {
                    setFocusedButton((p) => (p + 1) % totalButtons);
                }

                if (currentA && !padPrevRef.current.a) {
                    if (isInst) setShowInstructions(false);
                    else handleSelect(curFocus);
                }

                if (currentB && !padPrevRef.current.b) {
                    if (isInst) setShowInstructions(false);
                    else onResume();
                }

                padPrevRef.current = { up: currentUp, down: currentDown, a: currentA, b: currentB };
            }
            animationFrameId = requestAnimationFrame(pollGamepad);
        };

        animationFrameId = requestAnimationFrame(pollGamepad);
        return () => cancelAnimationFrame(animationFrameId);
    }, [onResume, onMainMenu]); // Dependencias estables

    return (
        <div className={styles.backdrop}>
            {!showInstructions ? (
                <div className={styles.container}>
                    <h2 className={styles.title}>PAUSA</h2>
                    <div className={styles.buttons}>
                        {["▶️ Reanudar", "? Instrucciones", "✕ Menú Principal"].map((text, idx) => (
                            <button
                                key={idx}
                                className={`${styles.btn} ${focusedButton === idx ? styles.btnFocused : ""} ${idx === 2 ? styles.btnDanger : ""}`}
                                onClick={() => handleSelect(idx)}
                                onMouseEnter={() => setFocusedButton(idx)}
                            >
                                {text}
                            </button>
                        ))}
                    </div>
                    <p className={styles.hint}>↑↓ Navegar · A Seleccionar · B Volver</p>
                </div>
            ) : (
                <div className={styles.container}>
                    <h2 className={styles.title}>INSTRUCCIONES</h2>
                    <ul className={styles.instructionsList}>
                        <li><span className={styles.key}>A / ←</span> Moverse a la izquierda</li>
                        <li><span className={styles.key}>D / →</span> Moverse a la derecha</li>
                        <li><span className={styles.key}>Barra Espaciadora / X</span> Saltar</li>
                        <li><span className={styles.key}>Clic Izquierdo / F / ▢</span> Atacar</li>
                        <li><span className={styles.key}>Q / △</span> Usar cura</li>
                        <li><span className={styles.key}>ESC / ►</span> Pausar / Reanudar</li>
                    </ul>
                    <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={() => setShowInstructions(false)}>
                        ← Volver
                    </button>
                </div>
            )}
        </div>
    );
}