# SheinTool - Ultimate Web Tools Suite 🚀

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/frontend-React_%2B_Vite-61DAFB)
![Node](https://img.shields.io/badge/backend-Node.js_%2B_Express-339933)
![Tailwind](https://img.shields.io/badge/styling-Tailwind_CSS-38B2AC)

**SheinTool** is a premium, high-performance web application offering a suite of file manipulation tools. Built with a mobile-first approach, it features smooth animations, haptic feedback, and a modern UI.

## ✨ Features

### 🖼️ Image Tools
- **Convert Images**: Support for PNG, JPG, WEBP, AVIF, GIF, TIFF, BMP, and ICO.
- **High Quality**: Uses `sharp` for lossless conversion where possible.

### 🎥 Video & Audio
- **Video Converter**: Convert between MP4, MKV, AVI, MOV, etc. using FFmpeg.
- **Audio Converter**: Extract audio or convert formats (MP3, WAV, AAC).
- **Real-time Progress**: Visual feedback during rendering.

### 📄 Document Tools
- **Markdown to PDF**: Render styling and syntax highlighting to PDF.
- **PDF to Markdown**: Extract text content from PDFs.

### 🛠️ Utilities
- **QR Code Generator**: Create downloadable QR codes for text/links.
- **Zip Manager**: Create ZIP archives from multiple files or inspect existing ones.

## 🚀 Tech Stack

### Frontend (`/client`)
- **Framework**: React 19 + Vite
- **Styling**: Tailwind CSS v4 + PostCSS
- **Animations**: Framer Motion
- **Icons**: Font Awesome 6
- **UX**: Haptic feedback (Vibration API)

### Backend (`/server`)
- **Server**: Node.js + Express
- **Processing**:
  - `fluent-ffmpeg` & `ffmpeg-static` (Video/Audio)
  - `sharp` (Images)
  - `puppeteer` (PDF generation)
  - `qrcode` (QR generation)
  - `adm-zip` (Compression)

## 🛠️ Installation & Setup

### Prerequisites
- Node.js (v16+ recommended)
- Git

### 1. Clone the Repository
```bash
git clone https://github.com/kunaldevelopers/sheintool-web-tools.git
cd sheintool-web-tools
```

### 2. Install Backend Dependencies
```bash
cd server
npm install
```

### 3. Install Frontend Dependencies
```bash
cd ../client
npm install
```

## 🏃‍♂️ Usage

You need to run both the backend and frontend servers.

### Start Backend
```bash
# In terminal 1 (server directory)
npm run dev
# Server runs on http://localhost:5000
```

### Start Frontend
```bash
# In terminal 2 (client directory)
npm run dev
# Frontend runs on http://localhost:5173
```

## 📂 Project Structure

```
sheintool-web-tools/
├── client/                 # React Frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components (ToolUI, Layout)
│   │   ├── pages/          # Individual tool pages (ImageConverter, etc.)
│   │   └── utils/          # Helpers (haptics.js)
│   └── ...
├── server/                 # Express Backend
│   ├── controllers/        # Logic for each tool
│   ├── routes/             # API endpoints
│   ├── uploads/            # Temp storage for processing
│   └── ...
└── README.md
```

## 🤝 Contributing
Contributions are welcome! Please fork the repository and submit a pull request.

## 📄 License
This project is licensed under the MIT License.
