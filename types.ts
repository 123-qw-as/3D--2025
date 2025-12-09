declare global {
  namespace JSX {
    interface IntrinsicElements {
      ambientLight: any;
      color: any;
      fog: any;
      group: any;
      instancedMesh: any;
      mesh: any;
      meshBasicMaterial: any;
      meshStandardMaterial: any;
      octahedronGeometry: any;
      planeGeometry: any;
      pointLight: any;
      ringGeometry: any;
      sphereGeometry: any;
      boxGeometry: any;
      cylinderGeometry: any;
      [elemName: string]: any;
    }
  }
}

export enum AppMode {
  TREE = 'TREE',
  FLOAT = 'FLOAT'
}

export enum Gesture {
  IDLE = 'IDLE',
  HOVER = 'HOVER',
  PINCH = 'PINCH',
  OPEN = 'OPEN'
}

export interface HandData {
  x: number; // Normalized 0-1
  y: number; // Normalized 0-1
  gesture: Gesture;
  isPresent: boolean;
}

export interface PhotoData {
  id: string;
  url: string;
  position: [number, number, number];
  rotation: [number, number, number];
}

export interface AudioData {
  averageFrequency: number; // 0-255
  frequencyData: Uint8Array;
}

export interface SceneConfig {
  particleCount: number;
  boxCount: number;
  bellCount: number;
  particleColor1: string;
  particleColor2: string;
  boxColor1: string;
  boxColor2: string;
  bellColor: string;
}