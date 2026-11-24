export const DURATION = 30;
const stages = [
  ['Site preparation', '01_site_preparation'],
  ['Foundations', '02_foundation'],
  ['Ground floor structure', '03_ground_floor'],
  ['Second floor structure', '04_second_floor'],
  ['Main structure complete', '05_structure_complete'],
  ['Roof installation', '06_roof_installation'],
  ['Window installation', '07_windows_installation'],
  ['Insulation installation', '08_insulation'],
  ['Mesh & basecoat', '09_mesh_basecoat'],
  ['Decorative plaster', '10_finish_plaster'],
  ['Final details & cleanup', '11_final_details'],
  ['Completion', '12_completed'],
];
export const keyframes = stages.map(([title, filename], index) => ({
  title,
  // All stages reference the original BARMASH render; stage 12 IS that original.
  image: `images/storyboard-v2/${filename}.png`,
  time: index * DURATION / 11,
  // Optional grayscale mask for the transition INTO this keyframe.
  // Black reveals first; white reveals last. Example: 'images/mask-02.png'.
  mask: null,
}));

export function getFramePair(time) {
  const position = Math.min(1, Math.max(0, time / DURATION)) * (keyframes.length - 1);
  const from = Math.min(Math.floor(position), keyframes.length - 1);
  return { from, to: Math.min(from + 1, keyframes.length - 1), mix: position - from };
}
