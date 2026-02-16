export const vibrate = (pattern = 10) => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(pattern);
    }
};

export const haptic = {
    success: () => vibrate([10, 30, 10]),
    error: () => vibrate([50, 50, 50]),
    tap: () => vibrate(10),
    selection: () => vibrate(5),
};
