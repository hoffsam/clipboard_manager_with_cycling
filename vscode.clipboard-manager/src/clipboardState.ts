let currentClipboardIndex = -1;

export function resetClipboardIndex() {
    currentClipboardIndex = -1;
}

export function getClipboardIndex() {
    return currentClipboardIndex;
}

export function setClipboardIndex(val: number) {
    currentClipboardIndex = val;
}

export function incrementClipboardIndex(max: number): number {
    currentClipboardIndex = (currentClipboardIndex + 1) % max;
    return currentClipboardIndex;
}

export function decrementClipboardIndex(max: number): number {
    currentClipboardIndex = (currentClipboardIndex - 1 + max) % max;
    return currentClipboardIndex;
}
