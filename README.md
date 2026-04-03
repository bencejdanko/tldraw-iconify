# tldraw PWA: Offline-Capable Drawing with Iconify

An offline-capable, private version of [tldraw](https://tldraw.com) that includes seamless **Iconify icon lookup** and a full **Progressive Web App (PWA)** experience. This version is completely decoupled from any cloud storage or authentication—your data stays on your device.

## ✨ Key Features

- 🎨 **Full tldraw functionality** - Complete drawing, diagramming, and whiteboard capabilities.
- 📶 **Offline-First** - Works perfectly without an internet connection using Service Workers.
- 📱 **PWA Support** - Install it on your desktop or mobile device for a native-like experience.
- 🔍 **Iconify integration** - Search and insert from 200,000+ icons with real-time search.
- 📋 **Clean Snapshot Export** - Copy pruned JSON snapshots of your drawings to the clipboard.
- 💎 **Premium Interface** - Clean, modern UI with glassmorphism and smooth transitions.

## 🛠️ Tech Stack

- [**tldraw**](https://tldraw.com) - Infinite canvas drawing and diagramming.
- [**Iconify**](https://iconify.design) - Massive collection of open source icons.
- [**Vite PWA**](https://vite-pwa-org.netlify.app/) - Powering the offline and installable experience.
- [**React**](https://react.dev/) - Modern UI library with TypeScript support.
- [**Lucide React**](https://lucide.dev/) - Beautifully simple icons for the UI.

## Getting Started

### Quick Start

1. **Clone and install dependencies:**
   ```bash
   git clone <your-repo-url> tldraw-pwa
   cd tldraw-pwa
   pnpm install
   ```

2. **Start development server:**
   ```bash
   pnpm dev
   ```

3. **Build for production (PWA):**
   ```bash
   pnpm build
   ```

## 🎮 How to Use

### Drawing & File Management
- Use all standard tldraw features.
- To save your work, use the built-in tldraw menu (**File > Save**) to download a `.tldr` file.
- To load previous work, use (**File > Open**) to select your saved file.

### Icon Lookup
1. **Toggle icon panel**: Click the shapes button (🔷) in the custom toolbar to show/hide the icon lookup panel.
2. **Search icons**: Type in the search box to find icons from 100+ collections.
3. **Customize color**: Use the color picker to change icon colors.
4. **Copy SVG**: Click any icon to copy its SVG code (64px) to your clipboard for use in other tools.

### PWA Installation
- **Desktop**: Click the install icon in your browser's address bar.
- **Mobile**: Use "Add to Home Screen" from your browser's sharing menu.
- Once installed, the app works entirely offline.

## 🏗️ Project Structure

```
src/
└── react-app/          # Main React application
    ├── App.tsx          # Main app with tldraw & PWA logic
    ├── components/      # React components (IconLookup, etc.)
    ├── services/        # API services (Iconify search)
    └── types/           # TypeScript type definitions
```

## 📄 License

This project builds upon tldraw and incorporates Iconify. Please respect the licenses of all included libraries and icon collections.

