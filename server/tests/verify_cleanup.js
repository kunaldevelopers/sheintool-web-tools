const fs = require('fs');
const path = require('path');
const os = require('os');
const puppeteerCleanup = require('../utils/puppeteerCleanup');

const BASE_TEMP_DIR = path.join(os.tmpdir(), 'puppeteer-jobs');

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function runVerification() {
    console.log('--- STARTING CLEANUP VERIFICATION ---');

    // 1. Test Standard Lifecycle
    console.log('\n[TEST 1] Testing Standard Lifecycle (Launch -> Close -> Cleanup)');
    try {
        const { browser, jobDir } = await puppeteerCleanup.launch({ headless: 'new' });
        console.log(`   Opened browser. Job Dir: ${jobDir}`);

        if (!fs.existsSync(jobDir)) {
            console.error('❌ FAILURE: Job directory was NOT created.');
            process.exit(1);
        } else {
            console.log('   ✅ Job directory exists.');
        }

        await puppeteerCleanup.close(browser, jobDir);

        await sleep(1000); // Wait for fs removal

        if (fs.existsSync(jobDir)) {
            console.error('❌ FAILURE: Job directory was NOT removed after close.');
            process.exit(1);
        } else {
            console.log('   ✅ Job directory removed successfully.');
        }

    } catch (e) {
        console.error('❌ ERROR in TEST 1:', e);
    }


    // 2. Test Stale Job Cleanup
    console.log('\n[TEST 2] Testing Stale Job Cleanup');
    const staleDir = path.join(BASE_TEMP_DIR, 'job-stale-test-123456');
    fs.mkdirSync(staleDir, { recursive: true });

    // Hack: Modify mtime to be 20 mins ago
    const oldTime = new Date(Date.now() - 20 * 60 * 1000);
    fs.utimesSync(staleDir, oldTime, oldTime);

    console.log(`   Created mock stale directory: ${staleDir}`);

    await puppeteerCleanup.cleanOldJobs();

    if (fs.existsSync(staleDir)) {
        console.error('❌ FAILURE: Stale directory was NOT removed.');
    } else {
        console.log('   ✅ Stale directory removed successfully.');
    }


    // 3. Test Legacy / Orphan Cleanup
    console.log('\n[TEST 3] Testing Legacy / Orphan Cleanup in OS Temp');
    const legacyDir = path.join(os.tmpdir(), 'puppeteer_dev_chrome_profile-TESTLEAK');
    fs.mkdirSync(legacyDir, { recursive: true });

    // Modify mtime to be 2 hours ago
    const reallyOldTime = new Date(Date.now() - 120 * 60 * 1000);
    fs.utimesSync(legacyDir, reallyOldTime, reallyOldTime);

    console.log(`   Created mock legacy directory: ${legacyDir}`);

    await puppeteerCleanup.cleanLegacyArtifacts();

    if (fs.existsSync(legacyDir)) {
        console.error('❌ FAILURE: Legacy directory was NOT removed.');
    } else {
        console.log('   ✅ Legacy directory removed successfully.');
    }

    console.log('\n--- VERIFICATION COMPLETE ---');
}

runVerification();
