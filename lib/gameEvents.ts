
import { EventEmitter } from "events";

const gameEvents = new EventEmitter();
gameEvents.setMaxListeners(20);
export default gameEvents; 