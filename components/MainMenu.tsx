"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import styles from "./MainMenu.module.css";

export default function MainMenu() {
  const router = useRouter();
  const [showInstructions, setShowInstructions] = useState(false);
  const [showNameForm, setShowNameForm] = useState(false);
  const [playerName, setPlayerName] = useState("");
  const [nameError, setNameError] = useState("");
  const [focusedButton, setFocusedButton] = useState(0);
  const totalButtons = 3;
  const videoRef = useRef<HTMLVideoElement>(null);
  const musicRef = useRef<HTMLAudioElement>(null);

  const handleUnmute = () => {
    if (videoRef.current) {
      videoRef.current.muted = false;
      videoRef.current.volume = 1;
    }
    if (musicRef.current) {
      musicRef.current.volume = 0;
      musicRef.current.play();
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cerrar modales con Escape
      if (e.key === "Escape") {
        if (showInstructions) { setShowInstructions(false); return; }
        if (showNameForm) { setShowNameForm(false); setNameError(""); return; }
      }

      if (showNameForm || showInstructions) return;

      if (e.key === "ArrowUp" || e.key === "w" || e.key === "W") {
        e.preventDefault();
        setFocusedButton((prev) => (prev - 1 + totalButtons) % totalButtons);
      }
      if (e.key === "ArrowDown" || e.key === "s" || e.key === "S") {
        e.preventDefault();
        setFocusedButton((prev) => (prev + 1) % totalButtons);
      }
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        handleUnmute();
        if (focusedButton === 0) { setShowNameForm(true); setNameError(""); }
        if (focusedButton === 1) { setShowInstructions(true); }
        if (focusedButton === 2) { window.open("https://github.com/luisfernando18/PROYECTO-JUEGO", "_blank"); }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [focusedButton, showNameForm, showInstructions]);

  const handleStartGame = () => {
    const trimmed = playerName.trim();
    if (!trimmed) {
      setNameError("Por favor ingresa tu nombre.");
      return;
    }
    if (trimmed.length < 2) {
      setNameError("El nombre debe tener al menos 2 caracteres.");
      return;
    }
    if (trimmed.length > 20) {
      setNameError("El nombre no puede tener más de 20 caracteres.");
      return;
    }
    if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ0-9 ]+$/.test(trimmed)) {
      setNameError("Solo se permiten letras, números y espacios.");
      return;
    }
    localStorage.setItem("playerName", trimmed);
    musicRef.current?.pause();
    router.push("/game");
  };

  return (
    <div className={styles.wrapper}>

      <video className={styles.videoBg} autoPlay loop muted playsInline ref={videoRef}>
        <source src="/assets/video/VideoFondoMenu.mp4" type="video/mp4" />
      </video>

      <audio ref={musicRef} loop>
        <source src="/assets/audio/Audio.mp3" type="audio/mpeg" />
      </audio>

      <div className={styles.overlay} onClick={handleUnmute} />

      <div className={styles.menuContent}>
        <h1 className={styles.title}>NOMBRE DEL JUEGO</h1>
        <p className={styles.subtitle}>Una leyenda de los Andes</p>

        <div className={styles.buttons}>
          <button
            className={`${styles.btn} ${focusedButton === 0 ? styles.btnFocused : ""}`}
            onClick={() => { handleUnmute(); setShowNameForm(true); setNameError(""); }}
            onMouseEnter={() => setFocusedButton(0)}
          >
            Iniciar Demo
          </button>

          <button
            className={`${styles.btn} ${focusedButton === 1 ? styles.btnFocused : ""}`}
            onClick={() => { handleUnmute(); setShowInstructions(true); }}
            onMouseEnter={() => setFocusedButton(1)}
          >
            Instrucciones
          </button>

          
            <a className={`${styles.btn} ${focusedButton === 2 ? styles.btnFocused : ""}`}
            href="https://github.com/luisfernando18/PROYECTO-JUEGO"
            target="_blank"
            rel="noopener noreferrer"
            onMouseEnter={() => setFocusedButton(2)}
          >
            GitHub
          </a>
        </div>
      </div>

      {showNameForm && (
        <div className={styles.modalBackdrop}>
          <div className={styles.modal}>
            <h2 className={styles.modalTitle}>Ingresa tu Nombre</h2>
            <input
              className={styles.input}
              type="text"
              placeholder="Ej. Ricardo Lugo"
              value={playerName}
              maxLength={20}
              onChange={(e) => {
                setPlayerName(e.target.value);
                setNameError("");
              }}
              onKeyDown={(e) => e.key === "Enter" && handleStartGame()}
              autoFocus
            />
            {nameError && <p className={styles.error}>{nameError}</p>}
            <div className={styles.modalButtons}>
              <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={handleStartGame}>
                Comenzar
              </button>
              <button className={styles.btn} onClick={() => { setShowNameForm(false); setNameError(""); }}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {showInstructions && (
        <div className={styles.modalBackdrop}>
          <div className={styles.modal}>
            <h2 className={styles.modalTitle}>INSTRUCCIONES</h2>
            <ul className={styles.instructionsList}>
              <li><span className={styles.key}>X / Barra Espaciadora</span> Saltar</li>
              <li><span className={styles.key}>A / ←</span> Moverse a la izquierda</li>
              <li><span className={styles.key}>D / →</span> Moverse a la derecha</li>
              <li><span className={styles.key}>▢ / Clic Izquierdo</span> Atacar</li>
              <li><span className={styles.key}>ESC / ►</span> Pausa</li>
            </ul>
            <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={() => setShowInstructions(false)}>
              Entendido
            </button>
          </div>
        </div>
      )}
      {/* CRÉDITOS — esquina inferior derecha */}
      <div className={styles.credits}>
        © 2025 Proyecto Universitario <br></br> <br></br>ULEAM
      </div>
    </div>
  );
}