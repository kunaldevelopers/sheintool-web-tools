const fs = require('fs');
const path = require('path');
const os = require('os');
const puppeteer = require('puppeteer');
// const rimraf = require('rimraf'); // Using native fs.rm

// --- CONFIGURATION ---
const BASE_TEMP_DIR = path.join(os.tmpdir(), 'puppeteer-jobs');
// Resolve uploads relative to this file (server/utils/puppeteerCleanup.js -> server/uploads)
const UPLOADS_DIR = path.join(__dirname, '../uploads');

const STALE_JOB_THRESHOLD_MS = 15 * 60 * 1000; // 15 minutes (Puppeteer jobs)
const UPLOAD_CLEANUP_THRESHOLD_MS = 60 * 60 * 1000; // 1 hour (Uploads - safe for downloads)

// Ensure BASE_TEMP_DIR exists
if (!fs.existsSync(BASE_TEMP_DIR)) {
    fs.mkdirSync(BASE_TEMP_DIR, { recursive: true });
}

/**
 * Helper to recursively delete a directory safely.
 * Uses fs.rm (Node 14.14+) or fs.rmdir (older).
 */
const safeDelete = (dirPath) => {
    return new Promise((resolve) => {
        // Retry logic can be added here if needed (e.g., EBUSY on Windows)
        fs.rm(dirPath, { recursive: true, force: true, maxRetries: 3, retryDelay: 1000 }, (err) => {
            if (err) {
                console.error(`[PuppeteerCleanup] Failed to delete ${dirPath}:`, err.message);
            } else {
                // console.log(`[PuppeteerCleanup] Deleted: ${dirPath}`);
            }
            resolve();
        });
    });
};

const cleanup = {
    /**
     * Initialize cleanup system.
     * Runs startup cleanup and schedules periodic cleanup.
     */
    init: async () => {
        console.log('[PuppeteerCleanup] Initializing...');
        console.log(`[PuppeteerCleanup] Base Temp Dir: ${BASE_TEMP_DIR}`);
        console.log(`[PuppeteerCleanup] Uploads Dir: ${UPLOADS_DIR}`);

        // 1. Clean up old jobs from previous runs
        await cleanup.cleanOldJobs();

        // 2. Clean up legacy random puppeteer folders in OS temp (Aggressive cleanup request)
        await cleanup.cleanLegacyArtifacts();

        // 3. Clean up stale uploads
        await cleanup.cleanUploads();

        // 4. Schedule periodic cleanup (every 10 minutes)
        setInterval(() => {
            cleanup.cleanOldJobs();
            cleanup.cleanUploads();
            // We can also run legacy cleanup periodically, but less frequently maybe
        }, 10 * 60 * 1000);

        console.log('[PuppeteerCleanup] Auto-cleanup system active.');
    },

    /**
     * Scans BASE_TEMP_DIR and deletes any jobs older than threshold.
     */
    cleanOldJobs: async () => {
        try {
            if (!fs.existsSync(BASE_TEMP_DIR)) return;

            const files = fs.readdirSync(BASE_TEMP_DIR);
            const now = Date.now();
            let deletedCount = 0;

            for (const file of files) {
                const filePath = path.join(BASE_TEMP_DIR, file);
                try {
                    const stats = fs.statSync(filePath);
                    if (stats.isDirectory()) {
                        const age = now - stats.mtimeMs;
                        if (age > STALE_JOB_THRESHOLD_MS) {
                            console.log(`[PuppeteerCleanup] Removing stale job: ${file} (${Math.round(age / 60000)}m old)`);
                            await safeDelete(filePath);
                            deletedCount++;
                        }
                    }
                } catch (e) {
                    // Ignore errors (file might be gone or locked)
                }
            }

            if (deletedCount > 0) {
                console.log(`[PuppeteerCleanup] Cleaned ${deletedCount} stale jobs.`);
            }
        } catch (err) {
            console.error('[PuppeteerCleanup] Error in cleanOldJobs:', err);
        }
    },

    /**
     * Scans the OS temp directory for random 'puppeteer_dev_chrome_profile-*' folders
     * and deletes them if they are old.
     * This addresses "previous mess".
     */
    cleanLegacyArtifacts: async () => {
        try {
            const tempDir = os.tmpdir();
            const files = fs.readdirSync(tempDir);
            const now = Date.now();
            let deletedCount = 0;

            console.log('[PuppeteerCleanup] Scanning for legacy Puppeteer artifacts in OS temp...');

            for (const file of files) {
                // Look for Puppeteer's default profile pattern
                if (file.startsWith('puppeteer_dev_chrome_profile-') ||
                    file.startsWith('puppeteer_dev_firefox_profile-') ||
                    file.startsWith('Magick-')) { // ImageMagick leftovers sometimes too?

                    const filePath = path.join(tempDir, file);
                    try {
                        const stats = fs.statSync(filePath);
                        if (stats.isDirectory()) {
                            const age = now - stats.mtimeMs;
                            // Use a slightly larger threshold for legacy checks to be safe (e.g. 1 hour)
                            // But user said "clean up what is already there", so maybe just > 15 mins is fine.
                            // Let's stick to strict 15 mins for now if it looks like garbage.
                            if (age > STALE_JOB_THRESHOLD_MS) {
                                // console.log(`[PuppeteerCleanup] Removing legacy artifact: ${file}`);
                                await safeDelete(filePath);
                                deletedCount++;
                            }
                        }
                    } catch (e) {
                        // ignore
                    }
                }
            }
            if (deletedCount > 0) {
                console.log(`[PuppeteerCleanup] Removed ${deletedCount} legacy Puppeteer artifacts from OS temp.`);
            }
        } catch (err) {
            console.error('[PuppeteerCleanup] Error in cleanLegacyArtifacts:', err);
        }
    },

    /**
     * Scans UPLOADS_DIR and deletes files older than threshold (1 hour).
     */
    cleanUploads: async () => {
        try {
            if (!fs.existsSync(UPLOADS_DIR)) return;

            const files = fs.readdirSync(UPLOADS_DIR);
            const now = Date.now();
            let deletedCount = 0;

            for (const file of files) {
                if (file === '.gitkeep') continue; // Skip gitkeep

                const filePath = path.join(UPLOADS_DIR, file);
                try {
                    const stats = fs.statSync(filePath);
                    const age = now - stats.mtimeMs;

                    if (age > UPLOAD_CLEANUP_THRESHOLD_MS) {
                        // console.log(`[PuppeteerCleanup] Removing stale upload: ${file}`);
                        await safeDelete(filePath);
                        deletedCount++;
                    }
                } catch (e) {
                    // ignore
                }
            }

            if (deletedCount > 0) {
                console.log(`[PuppeteerCleanup] Cleaned ${deletedCount} stale upload files.`);
            }
        } catch (err) {
            console.error('[PuppeteerCleanup] Error in cleanUploads:', err);
        }
    },

    /**
     * Launch a Puppeteer browser instance with a dedicated temp directory.
     * Returns { browser, page, jobDir }.
     * Caller MUST ensure `cleanup.close(...)` is called in a finally block.
     * @param {Object} options - Puppeteer launch options
     */
    launch: async (options = {}) => {
        // Create unique job directory
        const jobId = `job-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const jobDir = path.join(BASE_TEMP_DIR, jobId);

        fs.mkdirSync(jobDir, { recursive: true });

        // Merge options with userDataDir
        const launchOptions = {
            ...options,
            userDataDir: jobDir, // FORCE use this directory
        };

        // If args exist, ensure --no-sandbox is there (good practice for servers)
        if (!launchOptions.args) launchOptions.args = [];
        if (!launchOptions.args.includes('--no-sandbox')) launchOptions.args.push('--no-sandbox');
        if (!launchOptions.args.includes('--disable-setuid-sandbox')) launchOptions.args.push('--disable-setuid-sandbox');

        let browser;
        try {
            browser = await puppeteer.launch(launchOptions);
        } catch (err) {
            // If launch fails, clean up immediately
            await safeDelete(jobDir);
            throw err;
        }

        return { browser, jobDir };
    },

    /**
     * Safely closes the browser and deletes the job directory.
     * MUST be called in a finally block.
     */
    close: async (browser, jobDir) => {
        if (browser) {
            try {
                // Ensure all pages are closed first (helps with lock release)
                const pages = await browser.pages();
                await Promise.all(pages.map(p => p.close().catch(() => { })));
                await browser.close();
            } catch (err) {
                console.error('[PuppeteerCleanup] Error closing browser:', err.message);
            }
        }

        if (jobDir) {
            // Small delay to allow process lock release on Windows
            await new Promise(r => setTimeout(r, 500));
            await safeDelete(jobDir);
        }
    }
};

module.exports = cleanup;
