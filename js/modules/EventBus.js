class EventBus {
  constructor() {
    if (EventBus.instance) {
      return EventBus.instance;
    }
    this.listeners = {};
    EventBus.instance = this;
  }

  on(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  }

  off(event, callback) {
    if (!this.listeners[event]) return;

    const index = this.listeners[event].indexOf(callback);
    if (index !== -1) {
      this.listeners[event].splice(index, 1);
    }
  }

  emit(event, data = {}) {
    if (!this.listeners[event]) return;

    this.listeners[event].forEach((callback) => {
      try {
        callback(data);
      } catch (e) {
        console.error(`Error in ${event} handler:`, e);
      }
    });
  }
}

const eventBus = new EventBus();
export { eventBus };
