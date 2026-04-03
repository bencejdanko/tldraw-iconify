# tldraw-iconify for Web and VSIX

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/bencejdanko/tldraw-iconify)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Bringing the full power of [tldraw](https://tldraw.com) directly into your editor. Edit .tldr files with a native-feeling experience, offline-first, and integrated with Iconify.

![tldraw VS Code Extension Demo](./image.png)

The integration can be tested at https://tldraw-iconify.pages.dev/.

## Features

### Native .tldr Support
Open, edit, and save .tldr files directly within VS Code. Changes are synced locally, making it the perfect tool for local-first documentation and brainstorming.

### Integrated Iconify Lookup
Search through 200,000+ open-source icons from 100+ collections directly within the canvas.
- **Instant Search**: Find icons from Material Design, Lucide, Font Awesome, and more.
- **Customizable**: Adjust icon colors before copying or pasting.
- **Quick Import**: Copy SVG code directly to your clipboard for use elsewhere or use them directly in your canvas.

### Offline-First & Private
- **No Cloud Required**: Your files stay on your machine.
- **Work Anywhere**: Full functionality without an internet connection.
- **Fast Performance**: Optimized for a smooth, lag-free drawing experience.

## Getting Started

### Installation

1. Open **VS Code**.
2. Go to the **Extensions** view (Ctrl+Shift+X).
3. Search for **tldraw-iconify** (or install the .vsix from the releases).

### How to Use

1. **Create or Open**: Create a new file with the .tldr extension or right-click any existing .tldr file.
2. **Editor**: Select **Open With...** -> **tldraw Editor**.
3. **Icon Lookup**: Use the custom shapes button in the toolbar to toggle the Iconify search panel.
4. **Drawing**: Enjoy the full range of tldraw tools: arrows, shapes, handwriting, and more.

## Project Structure

- `vscode-extension/`: The VS Code extension source code and build files.
- `src/`: The core React application shared between the PWA and the extension.
- `image.png`: Demo screenshot of the extension in action.

## License

This project is open-source under the [MIT License](LICENSE). Built upon the amazing [tldraw](https://tldraw.com) and [Iconify](https://iconify.design) ecosystems.

