const async = require('async');

// --- CONFIGURATION ---
// Strict limits to prevent server crash on low-RAM VPS
const MEDIA_CONCURRENCY = 2; // Video/Audio
const PUPPETEER_CONCURRENCY = 2; // WordToPDF, OCR
const MAX_QUEUE_LENGTH = 20; // Reject if more than 20 waiting

// --- QUEUES ---

// 1. Media Queue (ffmpeg)
const mediaQueue = async.queue(async (task) => {
    console.log(`[Queue] Starting Media Task: ${task.type} (${task.id})`);
    try {
        await task.process();
    } catch (err) {
        console.error(`[Queue] Media Task Failed: ${task.id}`, err);
        throw err;
    }
}, MEDIA_CONCURRENCY);

// 2. Puppeteer Queue (chrome)
const puppeteerQueue = async.queue(async (task) => {
    console.log(`[Queue] Starting Puppeteer Task: ${task.type} (${task.id})`);
    try {
        await task.process();
    } catch (err) {
        console.error(`[Queue] Puppeteer Task Failed: ${task.id}`, err);
        throw err;
    }
}, PUPPETEER_CONCURRENCY);

// --- HELPERS ---

const cleanup = (queue, queueName) => {
    // Monitor queue health?
    if (queue.length() > MAX_QUEUE_LENGTH) {
        // This check is done BEFORE adding, but safe to have monitoring
    }
};

// --- EXPORTS ---

exports.addMediaJob = (req, processFn) => {
    return new Promise((resolve, reject) => {
        if (mediaQueue.length() >= MAX_QUEUE_LENGTH) {
            console.warn(`[Queue] Media Queue Full (${mediaQueue.length()}). Rejecting request.`);
            const err = new Error('Server busy: Media queue is full. Please try again later.');
            err.status = 503;
            return reject(err);
        }

        const taskId = Date.now() + '-' + Math.random().toString(36).substr(2, 9);

        mediaQueue.push({
            id: taskId,
            type: 'Media',
            process: async () => {
                // The processFn should return the result or handle the response
                // But since we want to 'await' the response in the controller,
                // we wrap the controller logic in processFn.
                try {
                    const result = await processFn();
                    resolve(result);
                } catch (e) {
                    reject(e);
                }
            }
        }, (err) => {
            // This callback runs when task processing finishes (failure or success handled above via closure)
            // We don't rely on this for resolution because 'async.queue' worker doesn't return value easily to 'push'.
            // We use the closure Promise above.
            console.log(`[Queue] Media Task Finished: ${taskId}`);
        });
    });
};

exports.addPuppeteerJob = (req, processFn) => {
    return new Promise((resolve, reject) => {
        if (puppeteerQueue.length() >= MAX_QUEUE_LENGTH) {
            console.warn(`[Queue] Puppeteer Queue Full (${puppeteerQueue.length()}). Rejecting request.`);
            const err = new Error('Server busy: PDF Tool queue is full. Please try again later.');
            err.status = 503;
            return reject(err);
        }

        const taskId = Date.now() + '-' + Math.random().toString(36).substr(2, 9);

        puppeteerQueue.push({
            id: taskId,
            type: 'Puppeteer',
            process: async () => {
                try {
                    const result = await processFn();
                    resolve(result);
                } catch (e) {
                    reject(e);
                }
            }
        }, () => {
            console.log(`[Queue] Puppeteer Task Finished: ${taskId}`);
        });
    });
};

// Monitor
setInterval(() => {
    if (mediaQueue.running() + mediaQueue.length() > 0 || puppeteerQueue.running() + puppeteerQueue.length() > 0) {
        console.log(`[JobQueue] Media: Running=${mediaQueue.running()} Waiting=${mediaQueue.length()} | Puppeteer: Running=${puppeteerQueue.running()} Waiting=${puppeteerQueue.length()}`);
    }
}, 5000);
