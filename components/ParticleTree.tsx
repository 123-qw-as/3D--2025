import React, { useMemo, useRef, useLayoutEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { AppMode, AudioData, Gesture, HandData } from '../types';
import { TREE_HEIGHT, TREE_RADIUS_BASE, PARTICLE_SIZE } from '../constants';

interface Props {
  mode: AppMode;
  audioData: AudioData;
  handData?: HandData;
  count: number;
  color1: string;
  color2: string;
}

const ParticleTree: React.FC<Props> = ({ mode, audioData, handData, count, color1, color2 }) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const lightRef = useRef<THREE.PointLight>(null);
  
  // Create dummy object for calculations
  const dummy = useMemo(() => new THREE.Object3D(), []);
  
  // Calculate target positions for both states
  // We include 'count' in dependency array to regenerate when slider changes
  const positions = useMemo(() => {
    const tree = new Float32Array(count * 3);
    const random = new Float32Array(count * 3);
    const explosion = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const baseColor = new THREE.Color(color1);
    const secColor = new THREE.Color(color2);

    for (let i = 0; i < count; i++) {
      // TREE FORM: Solid Volumetric Cone
      const h = (Math.random() * TREE_HEIGHT) - (TREE_HEIGHT / 2);
      const ratio = (h + (TREE_HEIGHT / 2)) / TREE_HEIGHT;
      const maxR = (1 - ratio) * TREE_RADIUS_BASE;
      const r = maxR * Math.sqrt(Math.random());
      const angle = Math.random() * Math.PI * 2;
      
      tree[i * 3] = Math.cos(angle) * r; // x
      tree[i * 3 + 1] = h;               // y
      tree[i * 3 + 2] = Math.sin(angle) * r; // z

      // RANDOM FORM: Cube Cloud
      random[i * 3] = (Math.random() - 0.5) * 25;
      random[i * 3 + 1] = (Math.random() - 0.5) * 20;
      random[i * 3 + 2] = (Math.random() - 0.5) * 20;

      // EXPLOSION VECTORS (Normalized direction)
      const ex = (Math.random() - 0.5) * 2;
      const ey = (Math.random() - 0.5) * 2;
      const ez = (Math.random() - 0.5) * 2;
      const len = Math.sqrt(ex*ex + ey*ey + ez*ez);
      explosion[i * 3] = ex / len;
      explosion[i * 3 + 1] = ey / len;
      explosion[i * 3 + 2] = ez / len;

      // Color Mixing
      const mixedColor = baseColor.clone().lerp(secColor, Math.random() > 0.8 ? 1 : 0);
      colors[i * 3] = mixedColor.r;
      colors[i * 3 + 1] = mixedColor.g;
      colors[i * 3 + 2] = mixedColor.b;
    }

    return { tree, random, explosion, colors };
  }, [count, color1, color2]);

  // Store current positions to interpolate manually
  // Reset when count changes
  const currentPositions = useRef(new Float32Array(positions.tree));
  
  // If count changes, we need to resize the currentPositions buffer
  useLayoutEffect(() => {
    currentPositions.current = new Float32Array(positions.tree);
  }, [count, positions]);

  useLayoutEffect(() => {
    if (meshRef.current) {
        for(let i=0; i<count; i++) {
             meshRef.current.setColorAt(i, new THREE.Color(positions.colors[i * 3], positions.colors[i * 3 + 1], positions.colors[i * 3 + 2]));
        }
        meshRef.current.instanceColor!.needsUpdate = true;
    }
  }, [positions, count]);

  useFrame((state, delta) => {
    if (!meshRef.current) return;

    const t = state.clock.getElapsedTime();
    const beat = audioData.averageFrequency / 255;
    
    // --- PARTICLE ANIMATION & SHATTER ---

    // Pulse Light
    if (lightRef.current) {
        lightRef.current.intensity = 2 + beat * 10;
        lightRef.current.color.setHSL((t * 0.1) % 1, 0.8, 0.5);
    }

    // UPDATE: Shatter on OPEN or PINCH
    const isShattering = handData?.gesture === Gesture.OPEN || handData?.gesture === Gesture.PINCH;
    const diffusionCoef = 10; 

    for (let i = 0; i < count; i++) {
      const ix = i * 3;
      const iy = i * 3 + 1;
      const iz = i * 3 + 2;

      // Base Target
      let targetX = mode === AppMode.TREE ? positions.tree[ix] : positions.random[ix];
      let targetY = mode === AppMode.TREE ? positions.tree[iy] : positions.random[iy];
      let targetZ = mode === AppMode.TREE ? positions.tree[iz] : positions.random[iz];

      // SHATTER LOGIC (Open to Shatter)
      if (isShattering) {
          // Final Position = Original + ExplosionVector * Diffusion
          const explosionScale = 1.0 + (beat * 0.5); 
          
          targetX += positions.explosion[ix] * diffusionCoef * explosionScale;
          targetY += positions.explosion[iy] * diffusionCoef * explosionScale;
          targetZ += positions.explosion[iz] * diffusionCoef * explosionScale;
      }

      // Lerp
      // Increase speed if shattering for explosive feel
      const speed = isShattering ? 4 * delta : 2 * delta;
      
      currentPositions.current[ix] += (targetX - currentPositions.current[ix]) * speed;
      currentPositions.current[iy] += (targetY - currentPositions.current[iy]) * speed;
      currentPositions.current[iz] += (targetZ - currentPositions.current[iz]) * speed;

      dummy.position.set(
        currentPositions.current[ix],
        currentPositions.current[iy],
        currentPositions.current[iz]
      );

      // Float animation in FLOAT mode
      if (mode === AppMode.FLOAT && !isShattering) {
        dummy.position.y += Math.sin(t + i) * 0.02;
        dummy.position.x += Math.cos(t * 0.5 + i) * 0.02;
      }

      // Scale
      const particleScale = PARTICLE_SIZE * (1 + (mode === AppMode.TREE && i % 10 === 0 ? beat * 3 : 0));
      dummy.scale.set(particleScale, particleScale, particleScale);

      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <group>
        {/* The Star at the top */}
        <pointLight ref={lightRef} position={[0, TREE_HEIGHT/2 + 1, 0]} distance={20} decay={2} />
        <mesh position={[0, TREE_HEIGHT/2 + 0.5, 0]}>
            <octahedronGeometry args={[0.5, 0]} />
            <meshBasicMaterial color={color1} toneMapped={false} />
        </mesh>

        <instancedMesh key={count} ref={meshRef} args={[undefined, undefined, count]}>
        <sphereGeometry args={[1, 8, 8]} />
        <meshStandardMaterial 
            toneMapped={false}
            emissive={color1}
            emissiveIntensity={2}
            color={color1}
            transparent
            opacity={0.8}
        />
        </instancedMesh>
    </group>
  );
};

export default ParticleTree;