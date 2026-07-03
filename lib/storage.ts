const STORAGE_KEY = "game_session";

export interface GameSession {
    playerName: string;
    enemiesKilled: number;
    bossesDefeated: number;
    timeElapsed: number; // en segundos
    won: boolean;
}

// Guarda la sesión actual
export function saveSession(session: GameSession): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

// Lee la sesión guardada
export function loadSession(): GameSession | null {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        if (!data) return null;
        return JSON.parse(data) as GameSession;
    } catch {
        return null;
    }
}

// Limpia la sesión (para cuando empieza una nueva partida)
export function clearSession(): void {
    localStorage.removeItem(STORAGE_KEY);
}

// Lee solo el nombre del jugador (guardado al inicio en el menú)
export function getPlayerName(): string {
    return localStorage.getItem("playerName") || "Desconocido";
}