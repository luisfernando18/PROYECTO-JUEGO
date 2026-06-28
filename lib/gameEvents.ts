// Sistema de eventos para comunicar Phaser con React
import { EventEmitter } from "events";

const gameEvents = new EventEmitter();
export default gameEvents;