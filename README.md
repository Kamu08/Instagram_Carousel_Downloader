# 🎨 Instagram to LinkedIn Carousel Studio

An all-in-one web application and creator studio that turns multi-slide Instagram carousels into high-resolution, LinkedIn-ready master PNGs and interactive carousel PDF documents in seconds.

Designed with a warm **Sketchbook / Paper Doodle** aesthetic, complete with custom cover generators, watermark branding, slide editing tools, and Gemini AI caption writing.

---

## ✨ Key Features

### ⚡ Ultra-Fast Instagram Extraction
- **Concurrent Parallel Streaming**: Extracts and decodes full 12-slide high-definition carousels (`1440×1920` / `1080×1350`) in ~7 seconds.
- **True Original Master Quality**: Automatically filters out platform crop transforms to preserve authentic aspect ratios and pixel dimensions.

### 📄 1-Click LinkedIn Document PDF Export
- Exports multi-page PDFs formatted specifically for LinkedIn document carousels with 1 click.
- Option to download all sequenced master PNGs as a ZIP archive.

### 🎨 Viral Pop Bubble Cover Slide Generator
- **Chubby Sticker Typography**: Create high-CTR viral cover slides with thick-outlined bubble text.
- **Full Customizer**: Real-time canvas editing for text, font sizes, color palettes, curved brush separators, and branding bar.
- **1-Click Apply**: Set directly as Slide 1 or prepend to the carousel.

### 🏷️ Slide Watermark & Branding Studio
- **Custom Signature Stamp**: Pre-populated with your name/handle (e.g. `Kamal Sharma`).
- **6 Corner & Center Placements**: Top-Right, Top-Center, Top-Left, Bottom-Right, Bottom-Center, Bottom-Left.
- **8 Visual Styles**: Doodle Yellow Pill, Midnight Dark Contrast, Pastel Pink Tag, Tech Blue Badge, Mint Green Stamp, Frosted Glass, Washi Tape Sticker, and Minimal Clean Text.
- **Granular Controls**: Individual toggle switches for First Slide (Cover), Body Slides, and Last Slide (Outro).
- **1-Click Revert / Remove**: Non-destructive clean backup engine allows removing or modifying watermarks anytime.

### 🤖 Gemini 3.6 Flash AI Caption & Hashtags Generator
- Generates high-converting LinkedIn post captions following proven creator blueprints.
- **Native Mathematical Unicode Bold**: Headers and hooks (`𝗠𝘆 𝗳𝗶𝗿𝘀𝘁 𝗥𝗔𝗚...`, `✔ 𝗟𝗟𝗠𝘀 — ...`) render in bold directly on LinkedIn feeds without asterisks.
- Includes hook, value takeaways, engagement callout, custom community links (WhatsApp / Telegram), and hashtags.

### 🎛️ Interactive Drag & Drop Studio
- **60fps Silky Smooth Reordering**: Powered by `@dnd-kit` with detached floating `<DragOverlay>` and `CSS.Translate` physics.
- **Quick Slide Editing**: Rotate 90° clockwise and Flip horizontally per slide.
- **Full-Screen Slide Inspector**: Arrow-key modal inspection with dimension and size analytics.

### 💾 Local IndexedDB History Engine
- Auto-saves processed carousels into browser IndexedDB (supporting 100s of MBs with zero storage quota limits).
- 1-click restore drawer to reload past carousels instantly.

### 🌓 Paper Light & Midnight Dark Sketchbook Modes
- Seamless transition between **Paper Light** (`#F7F4EB`) and **Midnight Dark Sketch** (`#161412`).

---

## 🛠️ Tech Stack

- **Framework**: [Next.js 16 (App Router)](https://nextjs.org/) & [React 19](https://react.dev/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) with Sketchbook Theme tokens
- **Image Processing**: [Sharp](https://sharp.pixelplumbing.com/) & [heic-decode](https://github.com/catdad/heic-decode)
- **PDF Generation**: [jsPDF](https://github.com/parallax/jsPDF)
- **Drag & Drop**: [@dnd-kit](https://dndkit.com/)
- **AI Model**: [Google Gemini 3.6 Flash API](https://ai.google.dev/)
- **Storage**: Native Browser [IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)
- **Icons**: [Lucide React](https://lucide.dev/)

---

## 🚀 Getting Started

### 1. Clone the Repository
```bash
git clone https://github.com/Kamu08/Instagram_Carousel_Downloader.git
cd Instagram_Carousel_Downloader
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Setup Environment Variables
Create a `.env.local` file in the root directory:
```env
GEMINI_API_KEY=your_gemini_api_key_here
```

### 4. Run Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📦 Production Build
```bash
npm run build
npm run start
```

---

## 🛡️ Privacy & Security
- All Instagram media streams are converted in-memory with zero permanent server-side retention.
- Carousels are persisted exclusively within the user's local browser database via IndexedDB.

---

## 📄 License
MIT License. Built for creators and developers.
