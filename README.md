# tldraw-mod: Enhanced tldraw with Iconify Integration

A modified version of [tldraw](https://tldraw.com) that includes seamless **Iconify icon lookup and insertion** directly within the drawing editor. This project combines the powerful drawing capabilities of tldraw with access to over 200,000 icons from the Iconify icon collection.


## ✨ Key Features

- 🎨 **Full tldraw functionality** - Complete drawing, diagramming, and whiteboard capabilities
- 🔍 **Iconify integration** - Search and insert from 200,000+ icons with real-time search
- 🎨 **Customizable icons** - Change icon colors and export as SVG with one click
- 📋 **Enhanced clipboard** - Export clean snapshots with unused assets automatically pruned
- 🔗 **Bookmark previews** - Rich link previews with configurable unfurler service
- ⚡ **Built for the edge** - Deployed on Cloudflare Workers for global performance

## 🛠️ Tech Stack

- [**tldraw**](https://tldraw.com) - Infinite canvas drawing and diagramming
- [**Iconify**](https://iconify.design) - Massive collection of open source icons
- [**React**](https://react.dev/) - Modern UI library with TypeScript support
- [**Vite**](https://vite.dev/) - Lightning-fast build tooling and development server
- [**Hono**](https://hono.dev/) - Ultralight backend framework for Workers
- [**Cloudflare Workers**](https://developers.cloudflare.com/workers/) - Edge computing platform

## 🎯 Icon Lookup Features

- **Real-time search**: Find icons as you type with debounced search
- **Color customization**: Apply any color to icons before insertion
- **Multiple collections**: Access popular icon sets like Lucide, Material Design, Heroicons, and more
- **Copy to clipboard**: Get SVG code with custom colors and sizes (64px)
- **Toggleable panel**: Show/hide the icon lookup panel as needed

## Getting Started

### Quick Start

1. **Clone and install dependencies:**
   ```bash
   git clone <your-repo-url> tldraw-mod
   cd tldraw-mod
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.template .env
   ```
   
   Update the `.env` file with your unfurler service URL (optional for basic functionality):
   ```bash
   VITE_UNFURLER_URL=https://your-unfurler-worker.your-domain.workers.dev
   ```

3. **Start development server:**
   ```bash
   npm run dev
   ```

Your enhanced tldraw editor will be available at [http://localhost:5173](http://localhost:5173).

## 🎮 How to Use

### Drawing with tldraw
- Use all standard tldraw features: drawing, shapes, text, sticky notes, etc.
- Create infinite canvas diagrams and drawings

### Icon Lookup
1. **Toggle icon panel**: Click the shapes button (🔷) in the toolbar to show/hide the icon lookup panel
2. **Search icons**: Type in the search box to find icons from collections like:
   - Lucide Icons
   - Material Design Icons  
   - Heroicons
   - Font Awesome
   - Tabler Icons
   - And 100+ more collections
3. **Customize color**: Use the color picker to change icon colors before copying
4. **Copy icons**: Click any icon to copy its SVG code to clipboard (automatically sized to 64px)
5. **Paste in design tools**: Use the copied SVG in other design applications

### Snapshot Export
- Click the clipboard button (📋) to copy a clean JSON snapshot of your drawing
- Unused assets are automatically pruned for smaller file sizes

## Environment Variables

This project uses environment variables for configuration:

- `VITE_UNFURLER_URL`: URL of your unfurler service for rich bookmark previews (optional)

For local development, create a `.env.local` file to override variables without affecting your main `.env` file.

## 🚀 Development

### Local Development
```bash
npm run dev
```
Starts the development server with hot reload at [http://localhost:5173](http://localhost:5173)

### Type Checking
```bash
npm run check
```
Runs TypeScript checks and builds for validation

### Linting
```bash
npm run lint
```
Runs ESLint to check code quality

## 📦 Production

### Build
```bash
npm run build
```
Creates optimized production build

### Preview
```bash
npm run preview
```
Locally preview the production build

### Deploy to Cloudflare Workers
```bash
npm run deploy
```
Deploys to Cloudflare Workers (requires wrangler authentication)

## 🏗️ Project Structure

```
src/
├── react-app/          # Main React application
│   ├── App.tsx          # Main app with tldraw integration
│   ├── components/      # React components
│   │   ├── IconLookup.tsx      # Iconify search interface
│   │   └── getBookmarkPreview.tsx  # Bookmark unfurling
│   ├── services/        # API services
│   │   └── iconify.ts   # Iconify API integration
│   └── types/           # TypeScript type definitions
│       └── iconify.ts   # Iconify API types
└── worker/              # Cloudflare Worker backend
    └── index.ts         # Hono server setup
```

## 🔧 Customization

### Adding Icon Collections
Edit `src/react-app/services/iconify.ts` to modify the `getPopularCollections()` method and add your preferred icon collections.

### Modifying Icon Behavior
The `IconLookup.tsx` component handles search, color customization, and SVG generation. Modify the `applySvgColor()` function to change how icons are processed.

### Bookmark Unfurling
Set up your own unfurler service and update the `VITE_UNFURLER_URL` environment variable. The unfurler should accept a `url` parameter and return JSON with `title`, `description`, `image`, and `favicon` fields.

## 📚 Additional Resources

- [tldraw Documentation](https://tldraw.dev/) - Learn about the drawing library
- [Iconify Documentation](https://iconify.design/docs/) - Explore the icon ecosystem  
- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)
- [Vite Documentation](https://vitejs.dev/guide/)
- [React Documentation](https://reactjs.org/)
- [Hono Documentation](https://hono.dev/)

## 🤝 Contributing

This is a modified version of tldraw focused on Iconify integration. Feel free to:
- Report issues with the icon lookup functionality
- Suggest improvements to the UI/UX
- Add support for additional icon collections
- Improve the SVG processing and color application

## 📄 License

This project builds upon tldraw and incorporates Iconify. Please respect the licenses of all included libraries and icon collections.
