export function createListBuffer(flush, delay = 120) {
    let queue = null;
    let timer = null;

    return function schedule(nextItems) {
        queue = nextItems;

        if (timer) return;

        timer = setTimeout(() => {
            flush(queue);
            queue = null;
            timer = null;
        }, delay);
    };
}
