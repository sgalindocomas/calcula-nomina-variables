export function trackUmamiEvent(eventName, payload = {}) {
    if (window.umami) {
        window.umami.track(eventName, payload);
    }
}
