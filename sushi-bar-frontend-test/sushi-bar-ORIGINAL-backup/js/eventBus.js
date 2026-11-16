/*
 * eventBus.js
 * A tiny publish/subscribe event bus. Modules emit events ("customer:arrived",
 * "hearts:changed", ...) and other modules listen for them, so the game logic
 * never has to know which UI elements exist (low coupling).
 *
 * Source: generated with Claude (Anthropic), November 2026. Reviewed and adapted by: <your name>
 */

export class EventBus {
  constructor() {
    this.handlers = new Map(); // event name -> Set of handler functions
  }

  /** Listen for an event. Returns a function that removes the listener. */
  on(eventName, handler) {
    if (!this.handlers.has(eventName)) this.handlers.set(eventName, new Set());
    this.handlers.get(eventName).add(handler);
    return () => this.handlers.get(eventName).delete(handler);
  }

  /** Tell every listener that something happened. */
  emit(eventName, payload = {}) {
    const set = this.handlers.get(eventName);
    if (!set) return;
    for (const handler of set) handler(payload);
  }
}
