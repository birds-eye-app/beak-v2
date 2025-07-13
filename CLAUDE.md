# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Architecture Overview

This is a Docusaurus-based personal site that hosts two standalone interactive birding applications alongside a blog. The site uses a hybrid architecture where the main site content follows standard Docusaurus patterns, but the interactive apps are designed as full-screen, standalone experiences.

### Key Applications

**Chirped** (`/chirped`) - eBird data analysis tool
- Processes uploaded CSV files from eBird exports
- Displays analytics through an interactive Swiper-based slide deck
- Located in `src/chirped/` with slide components in `src/chirped/components/slides/`
- Uses React Context for state management (`src/chirped/contexts/`)
- Tests located in `tests/chirped/`

**Birds Eye** (`/birds-eye`) - Interactive eBird mapping tool  
- Mapbox-powered geographic visualization of eBird sightings
- Handles CSV upload and displays data as interactive map layers
- Located in `src/birds-eye/` with core mapping logic in `BirdMap.tsx`
- Requires Mapbox API token (hardcoded for Docusaurus compatibility)

### Standalone Page Architecture

Both apps use a specific pattern for full-screen, standalone experiences:
- Page files in `src/pages/` (e.g., `chirped.tsx`, `birds-eye.tsx`)
- Theme wrapper components in `src/components/` (e.g., `ChirpedThemeWrapper.tsx`)
- Use `BrowserOnly` from Docusaurus to handle client-side rendering
- Custom CSS to hide Docusaurus navigation/footer and achieve full-screen layout
- Material-UI integration with automatic dark/light theme switching

### Environment Variables & Deployment

- Uses hardcoded API tokens in source for Docusaurus browser compatibility
- Environment variables don't work in browser build - avoid `process.env` patterns
- Mapbox token currently hardcoded in `src/birds-eye/BirdMap.tsx`
- Deployed to Render with specific Node.js configuration

## Development Commands

```bash
# Install dependencies
yarn install

# Development server
yarn start

# Production build 
yarn build

# Serve built site locally
yarn serve

# Type checking
yarn typecheck

# Run tests
# Note: No test runner configured in package.json - tests are in tests/ directory
```

## Important Patterns

### Adding New Interactive Apps
1. Create app directory in `src/` (e.g., `src/my-app/`)
2. Create theme wrapper in `src/components/MyAppThemeWrapper.tsx`
3. Create standalone page in `src/pages/my-app.tsx` using the BrowserOnly pattern
4. Update home page (`src/pages/index.tsx`) to add navigation button
5. Ensure all React components import React explicitly for JSX runtime compatibility

### React Component Requirements
- All `.tsx` files must import React explicitly: `import React from 'react'`
- This is required for Docusaurus JSX runtime compatibility
- Use `BrowserOnly` wrapper for any browser-dependent code
- Material-UI components need theme wrappers for dark mode support

### Styling & Theming
- Global styles in `src/css/custom.css` with CSS variables for theme support
- Individual app styles in respective directories (e.g., `src/chirped/styles.css`)
- Material-UI themes automatically sync with Docusaurus theme switching
- Standalone pages use fixed positioning and high z-index to override Docusaurus layout

### File Upload & Processing
- Both apps use CSV file upload patterns
- Chirped: Processes eBird export data for analytics
- Birds Eye: Processes eBird data for geographic visualization
- Upload components handle file processing and API communication

## Testing

Tests are located in `tests/` directory (not `src/`). Chirped has comprehensive test coverage including:
- Calculation logic tests
- CSV parsing tests  
- Taxonomy processing tests
- Sample data files for testing

## Deployment Notes

- Site configured for Render deployment at `https://beak-v2.onrender.com`
- Uses Node.js environment (not static) to handle SSR properly
- Environment variables must be set in Render dashboard, not in code
- `.env` file exists locally but is gitignored for security