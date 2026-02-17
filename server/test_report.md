
# Backend Feature Test Report
Date: 17/2/2026, 2:17:00 pm

| Feature | Status | Details |
| :--- | :--- | :--- |
| Audio Conversion | PASS | Converted successfully |
| Video Conversion (MP4) | PASS | Converted successfully |
| Video Conversion (MKV) | PASS | Converted successfully |
| Video Conversion (WMV) | PASS | Converted successfully |
| Image Conversion | PASS | Converted successfully |
| PDF Split | PASS |  |
| PDF Compress | PASS |  |
| PDF Protect | PASS |  |
| PDF Unlock | PASS |  |
| PDF Rotate | PASS |  |
| PDF Watermark | PASS |  |
| PDF Page Numbers | PASS |  |
| MD to PDF | PASS |  |
| Docxc to PDF | PASS |  |
| QR Generator | PASS |  |

## Logs
```
[2:16:45 pm] [INFO] --- Starting Comprehensive Server Test ---
[2:16:45 pm] [INFO] Base URL: http://localhost:5000/api
[2:16:45 pm] [INFO] Sample [audio] found: C:\Users\Kunal\Downloads\New folder (40)\sheintool\server\tests\samples\test_sample.mp3
[2:16:45 pm] [INFO] Sample [video] found: C:\Users\Kunal\Downloads\New folder (40)\sheintool\server\tests\samples\test_sample.mp4
[2:16:45 pm] [INFO] Sample [image] found: C:\Users\Kunal\Downloads\New folder (40)\sheintool\server\tests\test_output\converted.jpg
[2:16:45 pm] [INFO] Sample [pdf] found: C:\Users\Kunal\Downloads\New folder (40)\sheintool\server\test_unlocked.pdf
[2:16:45 pm] [INFO] Sample [docx] found: C:\Users\Kunal\Downloads\New folder (40)\sheintool\server\tests\samples\test_sample.docx
[2:16:45 pm] [INFO] Sample [md] found: C:\Users\Kunal\Downloads\New folder (40)\sheintool\README.md
[2:16:45 pm] [INFO] Sample [protectedPdf] found: C:\Users\Kunal\Downloads\New folder (40)\sheintool\server\test_protected.pdf
[2:16:45 pm] [INFO] Testing Audio Conversion...
[2:16:46 pm] [SUCCESS] Audio Conversion PASS
[2:16:46 pm] [INFO] Testing Video Conversion...
[2:16:46 pm] [INFO] Testing Video -> MP4...
[2:16:46 pm] [SUCCESS] Video -> MP4 PASS
[2:16:46 pm] [INFO] Testing Video -> MKV...
[2:16:46 pm] [SUCCESS] Video -> MKV PASS
[2:16:46 pm] [INFO] Testing Video -> WMV...
[2:16:46 pm] [SUCCESS] Video -> WMV PASS
[2:16:46 pm] [INFO] Testing Image Conversion...
[2:16:47 pm] [SUCCESS] Image Conversion PASS
[2:16:47 pm] [INFO] Testing PDF Core Features...
[2:16:47 pm] [INFO] Testing PDF Split...
[2:16:48 pm] [INFO] Testing PDF Compress...
[2:16:49 pm] [INFO] Testing PDF Protect...
[2:16:49 pm] [INFO] Testing PDF Unlock...
[2:16:52 pm] [INFO] Testing PDF Edit Features...
[2:16:55 pm] [INFO] Testing MD to PDF...
[2:16:58 pm] [INFO] Testing Word to PDF...
[2:17:00 pm] [INFO] Testing QR Generator...
[2:17:00 pm] [INFO] --- All Tests Completed ---
```
