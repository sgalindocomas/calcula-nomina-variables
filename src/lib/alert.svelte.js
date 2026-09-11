export const alertState = $state({ message: '', visible: false });
export function customAlert(msg) { alertState.message = msg; alertState.visible = true; }
export function closeAlert() { alertState.visible = false; }

export const toastState = $state({ message: '', visible: false });
export function showToastMsg(msg, duration = 3000) {
    toastState.message = msg;
    toastState.visible = true;
    setTimeout(() => {
        toastState.visible = false;
    }, duration);
}