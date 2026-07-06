"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import styles from "./MainMenu.module.css";
import { clearSession } from "@/lib/storage";

export default function MainMenu() {
  const router = useRouter();
  const [showInstructions, setShowInstructions] = useState(false);
  const [showNameForm, setShowNameForm] = useState(false);
  const [playerName, setPlayerName] = useState("");
  const [nameError, setNameError] = useState("");
  const [focusedButton, setFocusedButton] = useState(0);
  const totalButtons = 3;

  // Ref para sincronizar el estado del nombre en tiempo real para el Gamepad
  const playerNameRef = useRef(playerName);
  useEffect(() => {
    playerNameRef.current = playerName;
  }, [playerName]);

  const videoRef = useRef<HTMLVideoElement>(null);
  const musicRef = useRef<HTMLAudioElement>(null);
  const padPrevRef = useRef({ up: false, down: false, confirm: false, back: false });

  // --- LÓGICA DE GAMEPAD ---
  useEffect(() => {
    let animationFrameId: number;

    const pollGamepad = () => {
      const pad = navigator.getGamepads()[0];
      if (pad) {
        const isUp = pad.buttons[4]?.pressed;
        const isDown = pad.buttons[6]?.pressed;
        const isConfirm = pad.buttons[14]?.pressed; // X
        const isBack = pad.buttons[13]?.pressed;    // Círculo

        // 1. Navegación en el Menú Principal
        if (!showNameForm && !showInstructions) {
          if (isUp && !padPrevRef.current.up) setFocusedButton((p) => (p - 1 + totalButtons) % totalButtons);
          if (isDown && !padPrevRef.current.down) setFocusedButton((p) => (p + 1) % totalButtons);
          if (isConfirm && !padPrevRef.current.confirm) {
            handleUnmute();
            if (focusedButton === 0) { setShowNameForm(true); setNameError(""); }
            if (focusedButton === 1) { setShowInstructions(true); }
            if (focusedButton === 2) { window.open("https://github.com/luisfernando18/PROYECTO-JUEGO", "_blank"); }
          }
        }
        // 2. Navegación en Modal de Nombre
        else if (showNameForm) {
          if (isConfirm && !padPrevRef.current.confirm) handleStartGame();
          if (isBack && !padPrevRef.current.back) { setShowNameForm(false); setNameError(""); }
        }
        // 3. Navegación en Instrucciones
        else if (showInstructions) {
          if ((isConfirm && !padPrevRef.current.confirm) || (isBack && !padPrevRef.current.back)) {
            setShowInstructions(false);
          }
        }
        padPrevRef.current = { up: !!isUp, down: !!isDown, confirm: !!isConfirm, back: !!isBack };
      }
      animationFrameId = requestAnimationFrame(pollGamepad);
    };

    animationFrameId = requestAnimationFrame(pollGamepad);
    return () => cancelAnimationFrame(animationFrameId);
  }, [showNameForm, showInstructions, focusedButton]);

  const handleUnmute = () => {
    if (videoRef.current) { videoRef.current.muted = false; videoRef.current.volume = 1; }
    if (musicRef.current) {
      musicRef.current.volume = 0.25;
      musicRef.current.play().catch(() => { });
    }
  };

  const handleStartGame = () => {
    const trimmed = playerNameRef.current.trim();
    if (!trimmed || trimmed.length < 2 || trimmed.length > 20 || !/^[a-zA-ZáéíóúÁÉÍÓÚñÑ0-9 ]+$/.test(trimmed)) {
      setNameError("Nombre inválido (2-20 caracteres).");
      return;
    }
    localStorage.setItem("playerName", trimmed);
    if (musicRef.current) { musicRef.current.pause(); musicRef.current.currentTime = 0; }
    clearSession();
    router.push("/game");
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (showInstructions) { setShowInstructions(false); return; }
        if (showNameForm) { setShowNameForm(false); setNameError(""); return; }
      }
      if (showNameForm || showInstructions) return;
      if (e.key === "ArrowUp" || e.key === "w" || e.key === "W") { e.preventDefault(); setFocusedButton((prev) => (prev - 1 + totalButtons) % totalButtons); }
      if (e.key === "ArrowDown" || e.key === "s" || e.key === "S") { e.preventDefault(); setFocusedButton((prev) => (prev + 1) % totalButtons); }
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

  return (
    <div className={styles.wrapper}>
      <video className={styles.videoBg} autoPlay loop muted playsInline ref={videoRef}>
        <source src="/assets/video/VideoFondoMenu.mp4" type="video/mp4" />
      </video>

      <audio ref={musicRef} loop>
        <source src="/assets/audio/The Last Faith - Beauty Dwelt Here Once - Original Soundtrack _ OST.mp3" type="audio/mpeg" />
      </audio>

      <div className={styles.overlay} onClick={handleUnmute} />

      <div className={styles.menuContent}>
        <h1 className={styles.title}>The Last Breath</h1>
        <p className={styles.subtitle}>Shadow of The Condor</p>

        <div className={styles.buttons}>
          <button className={`${styles.btn} ${focusedButton === 0 ? styles.btnFocused : ""}`} onClick={() => { handleUnmute(); setShowNameForm(true); setNameError(""); }} onMouseEnter={() => setFocusedButton(0)}>Iniciar Demo</button>
          <button className={`${styles.btn} ${focusedButton === 1 ? styles.btnFocused : ""}`} onClick={() => { handleUnmute(); setShowInstructions(true); }} onMouseEnter={() => setFocusedButton(1)}>Instrucciones</button>
          <a className={`${styles.btn} ${focusedButton === 2 ? styles.btnFocused : ""}`} href="https://github.com/luisfernando18/PROYECTO-JUEGO" target="_blank" rel="noopener noreferrer" onMouseEnter={() => setFocusedButton(2)}>GitHub</a>
        </div>
      </div>

      {showNameForm && (
        <div className={styles.modalBackdrop}>
          <div className={styles.modal}>
            <h2 className={styles.modalTitle}>Ingresa tu Nombre</h2>
            <input className={styles.input} type="text" placeholder="Ej. Ricardo Lugo" value={playerName} maxLength={20} onChange={(e) => { setPlayerName(e.target.value); setNameError(""); }} onKeyDown={(e) => e.key === "Enter" && handleStartGame()} autoFocus />
            {nameError && <p className={styles.error}>{nameError}</p>}
            <div className={styles.modalButtons}>
              <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={handleStartGame}>Comenzar</button>
              <button className={styles.btn} onClick={() => { setShowNameForm(false); setNameError(""); }}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {showInstructions && (
        <div className={styles.modalBackdrop}>
          <div className={styles.modal}>
            <h2 className={styles.modalTitle}>INSTRUCCIONES</h2>
            <ul className={styles.instructionsList}>
              <li><span className={styles.key}>Barra Espaciadora / X</span> Saltar</li>
              <li><span className={styles.key}>A / ←</span> Moverse a la izquierda</li>
              <li><span className={styles.key}>D / →</span> Moverse a la derecha</li>
              <li><span className={styles.key}>Clic Izquierdo / F / ▢</span> Atacar</li>
              <li><span className={styles.key}>Q / △</span> Usar cura</li>
              <li><span className={styles.key}>ESC / ►</span> Pausar / Reanudar</li>
            </ul>
            <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={() => setShowInstructions(false)}>Entendido</button>
          </div>
        </div>
      )}

      <div className={styles.credits}>©️ 2026 ULEAM <br /><br />Proyecto Universitario <br /><br /> Carrera de <br />Tecnologias de la información <br /><br />ULEAM</div>
    </div>
  );
}