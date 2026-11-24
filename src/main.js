import * as THREE from 'three';
import './style.css';
import vertexShader from './shaders/transition.vert.glsl?raw';
import fragmentShader from './shaders/transition.frag.glsl?raw';
import { DURATION, keyframes, getFramePair } from './sequence.js';

const $ = (id) => document.getElementById(id);
const viewer = $('viewer');
const slider = $('timeline');
const base = import.meta.env.BASE_URL;
let time = 0;
let playing = false;
let ready = false;
let lastTick = 0;
let material, renderer;
const textures = [];
const masks = [];
const buttons = keyframes.map((frame, index) => {
  const button = document.createElement('button');
  button.className = 'keyframe';
  button.setAttribute('aria-label', `Stage ${index + 1}: ${frame.title}`);
  button.title = `${frame.title} · ${frame.time.toFixed(1)}s`;
  const image = document.createElement('img');
  image.src = base + frame.image;
  image.alt = '';
  const label = document.createElement('span');
  label.textContent = String(index + 1).padStart(2, '0');
  button.append(image, label);
  button.addEventListener('click', () => { setPlaying(false); time = frame.time; update(); });
  $('filmstrip').append(button);
  return button;
});

function setPlaying(value) {
  playing = ready && value;
  $('play').disabled = !ready || playing;
  $('pause').disabled = !playing;
  $('fullscreen-play').textContent = playing ? 'Pause' : 'Play';
}

function update() {
  const { from, to, mix } = getFramePair(time);
  if (material) {
    material.uniforms.uFrom.value = textures[from];
    material.uniforms.uTo.value = textures[to];
    material.uniforms.uProgress.value = mix;
    material.uniforms.uMask.value = masks[to] || textures[0];
    material.uniforms.uHasMask.value = masks[to] ? 1 : 0;
  }
  slider.value = time;
  slider.style.setProperty('--progress', `${time / DURATION * 100}%`);
  slider.setAttribute('aria-valuetext', `${time.toFixed(1)} of 30 seconds`);
  $('current-time').textContent = `00:${String(Math.floor(time)).padStart(2, '0')}`;
  const active = mix >= 0.5 ? to : from;
  $('stage-number').textContent = `STAGE ${String(active + 1).padStart(2, '0')} / 12`;
  $('stage-title').textContent = keyframes[active].title;
  buttons.forEach((button, i) => { button.classList.toggle('active', i === active); button.setAttribute('aria-pressed', String(i === active)); });
}

function play() { if (time >= DURATION) time = 0; setPlaying(true); update(); }
$('play').addEventListener('click', play);
$('pause').addEventListener('click', () => setPlaying(false));
$('restart').addEventListener('click', () => { time = 0; setPlaying(false); update(); });
slider.addEventListener('input', () => { setPlaying(false); time = Number(slider.value); update(); });
$('transition').addEventListener('change', (event) => { if (material) material.uniforms.uMasked.value = event.target.value === 'mask' ? 1 : 0; });
document.addEventListener('keydown', (event) => {
  if (event.code !== 'Space' || /INPUT|SELECT|BUTTON|TEXTAREA/.test(event.target.tagName)) return;
  event.preventDefault();
  if (playing) setPlaying(false); else play();
});
async function toggleFullscreen() {
  try { if (document.fullscreenElement) await document.exitFullscreen(); else await viewer.requestFullscreen(); }
  catch (error) { $('fullscreen').title = `Fullscreen unavailable: ${error.message}`; }
}
$('fullscreen').addEventListener('click', toggleFullscreen);
$('exit-fullscreen').addEventListener('click', toggleFullscreen);
$('fullscreen-play').addEventListener('click', () => { if (playing) setPlaying(false); else play(); });
if (!document.fullscreenEnabled) $('fullscreen').disabled = true;
document.addEventListener('visibilitychange', () => { if (document.hidden) setPlaying(false); });

async function init() {
  setPlaying(false);
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    $('canvas-host').append(renderer.domElement);
    renderer.domElement.addEventListener('webglcontextlost', (event) => { event.preventDefault(); setPlaying(false); ready = false; $('loading').hidden = false; $('loading').textContent = 'Graphics connection lost. Reload to resume.'; });
    const loader = new THREE.TextureLoader();
    await Promise.all(keyframes.map(async (frame, i) => {
      const texture = await loader.loadAsync(base + frame.image);
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.minFilter = THREE.LinearFilter;
      textures[i] = texture;
      if (frame.mask) masks[i] = await loader.loadAsync(base + frame.mask);
    }));
    const scene = new THREE.Scene();
    // A static orthographic camera and a full-frame image plane. No navigation,
    // camera animation, parallax, zoom or perspective change is applied.
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
    camera.position.z = 1;
    material = new THREE.ShaderMaterial({ vertexShader, fragmentShader, depthTest: false, depthWrite: false, uniforms: {
      uFrom: { value: textures[0] }, uTo: { value: textures[1] },
      uMask: { value: textures[0] }, uProgress: { value: 0 },
      uMasked: { value: 0 }, uHasMask: { value: 0 },
    } });
    scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material));
    new ResizeObserver(() => {
      const { width, height } = $('canvas-host').getBoundingClientRect();
      renderer.setSize(width, height, false);
    }).observe($('canvas-host'));
    ready = true;
    $('loading').hidden = true;
    setPlaying(false);
    update();
    renderer.setAnimationLoop((now) => {
      const delta = lastTick ? (now - lastTick) / 1000 : 0;
      lastTick = now;
      if (playing) {
        time = Math.min(DURATION, time + delta);
        if (time >= DURATION) setPlaying(false);
        update();
      }
      renderer.render(scene, camera);
    });
  } catch (error) {
    console.error('Unable to initialise timelapse:', error);
    ready = false;
    setPlaying(false);
    $('loading').textContent = 'Unable to load the viewer. Check WebGL support and image paths, then reload.';
  }
}
update();
init();
