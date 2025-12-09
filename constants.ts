export const PARTICLE_COUNT = 5000;
export const PARTICLE_SIZE = 0.06;
export const TREE_HEIGHT = 15;
export const TREE_RADIUS_BASE = 6;
export const CAMERA_FOV = 45;

export const COLOR_PALETTE = {
  primary: '#00f3ff', // Cyan
  secondary: '#ff00aa', // Magenta
  accent: '#ffffff',
  bg: '#050505'
};

// Helper to generate data URI - ensures no network errors for default images
const generatePlaceholder = (text: string, bg: string, color: string) => {
  const svg = `
  <svg width="400" height="400" xmlns="http://www.w3.org/2000/svg">
    <rect width="100%" height="100%" fill="${bg}" opacity="0.8"/>
    <rect width="100%" height="100%" fill="none" stroke="${color}" stroke-width="10" stroke-opacity="0.5"/>
    <circle cx="200" cy="200" r="50" fill="none" stroke="${color}" stroke-width="2" stroke-dasharray="5,5">
      <animateTransform attributeName="transform" type="rotate" from="0 200 200" to="360 200 200" dur="10s" repeatCount="indefinite"/>
    </circle>
    <text x="50%" y="50%" font-family="monospace" font-size="24" fill="${color}" font-weight="bold" dominant-baseline="middle" text-anchor="middle" style="text-shadow: 0 0 5px ${color};">${text}</text>
  </svg>`;
  return `data:image/svg+xml;base64,${btoa(svg)}`;
};

export const GALLERY_IMAGES = [
  generatePlaceholder('SYSTEM_IMG_01', '#001020', '#00f3ff'),
  generatePlaceholder('SYSTEM_IMG_02', '#200020', '#ff00aa'),
  generatePlaceholder('SYSTEM_IMG_03', '#001020', '#00f3ff'),
  generatePlaceholder('SYSTEM_IMG_04', '#200020', '#ff00aa'),
  generatePlaceholder('SYSTEM_IMG_05', '#001020', '#00f3ff'),
  generatePlaceholder('SYSTEM_IMG_06', '#200020', '#ff00aa'),
  generatePlaceholder('SYSTEM_IMG_07', '#001020', '#00f3ff'),
  generatePlaceholder('SYSTEM_IMG_08', '#200020', '#ff00aa'),
];