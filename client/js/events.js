define(function () {
    class EventEmitter {
        constructor() {
            this.listeners = [];

        }
        on(event, cb) {
            this.listeners.push({
                type: event,
                callback: cb
            });
        }
        emit(event) {
            let callbacks = this.listeners.filter((e) => e.type == event).forEach((event) => {
                event.callback.apply(this, arguments);
            });
        }
    }
    return EventEmitter;
})