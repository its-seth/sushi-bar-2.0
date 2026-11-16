/*
 * eventBus.js
 * A tiny "publish / subscribe" system.
 *   bus.on('coins:changed', fn)  -> "call fn whenever coins change"   (subscribe)
 *   bus.emit('coins:changed', 10) -> "coins changed, tell everyone"    (publish)
 * The part that emits does not know who is listening. That keeps coupling low.
 *
 * Source: generated with Claude (Anthropic), November 2026, then simplified with Claude.
 * Reviewed and adapted by: <your name>
 */

export class EventBus {
  constructor() {
    this.listeners = {}; // event name -> list of functions to call
  }

  on(eventName, listener) {
    if (!this.listeners[eventName]) {
      this.listeners[eventName] = [];
    }
    this.listeners[eventName].push(listener);
  }

  emit(eventName, data) {
    const list = this.listeners[eventName] || [];
    for (const listener of list) {
      listener(data);
    }
  }
}
