uniform sampler2D uFrom;
uniform sampler2D uTo;
uniform sampler2D uMask;
uniform float uProgress;
uniform float uMasked;
uniform float uHasMask;
varying vec2 vUv;

void main() {
  float progress = smoothstep(0.0, 1.0, uProgress);
  float threshold = mix(1.0 - vUv.y, texture2D(uMask, vUv).r, uHasMask);
  float reveal = smoothstep(threshold - 0.09, threshold + 0.09, mix(-0.1, 1.1, progress));
  float blend = mix(progress, reveal, uMasked);
  gl_FragColor = mix(texture2D(uFrom, vUv), texture2D(uTo, vUv), blend);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
