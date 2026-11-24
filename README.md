# BARMASH construction timelapse

A responsive fixed-camera Three.js image-sequence viewer built with Vite and vanilla JavaScript. Twelve construction stages play over a 30-second interactive timeline, with Play, Pause, Restart, Fullscreen, GLSL dissolve/reveal transitions and optional grayscale masks.

This is the current storyboard viewer, not the proposed future 20-second motion video. Cars and pedestrians change between still images; they are not continuously animated objects. Generated construction stages have small local differences from the original final render. The final frame is the unchanged original.

## Local development

Use Node.js 22.12+ or a supported newer release.

```sh
npm ci
npm run dev
```

`npm run build` writes `dist/`; `npm run preview` serves that build. Images are in `public/images/storyboard-v2/`. Stage titles and paths are in `src/sequence.js`. Shader sources are in `src/shaders/`.

## GitHub Pages

The included workflow builds and deploys pushes to `main`. Enable **Settings → Pages → Source → GitHub Actions**. Vite uses relative asset paths so the site works under a repository subpath. Backups, previous image versions, private generation manifests and downloaded reference videos are excluded from this repository package.

## Browser tests

```sh
npx playwright install chromium
npm test
```
