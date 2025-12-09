import React, { useLayoutEffect, useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { TREE_HEIGHT, TREE_RADIUS_BASE } from '../constants';
import { AppMode, AudioData, Gesture, HandData } from '../types';

interface Props {
  mode: AppMode;
  audioData: AudioData;
  handData: HandData;
  boxCount: number;
  bellCount: number;
  boxColor1: string;
  boxColor2: string;
  bellColor: string;
}

const Ornaments: React.FC<Props> = ({ mode, audioData, handData, boxCount, bellCount, boxColor1, boxColor2, bellColor }) => {
  const boxMeshRef = useRef<THREE.InstancedMesh>(null);
  const sphereMeshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  // Pre-calculate positions and vectors for Boxes
  const boxes = useMemo(() => {
    return Array.from({ length: boxCount }).map(() => {
        // Tree Position
        const h = (Math.random() * TREE_HEIGHT) - (TREE_HEIGHT / 2);
        const ratio = (h + (TREE_HEIGHT / 2)) / TREE_HEIGHT;
        const radiusAtHeight = (1 - ratio) * TREE_RADIUS_BASE;
        const r = radiusAtHeight * (0.6 + Math.random() * 0.6); // Slightly more scatter
        const angle = Math.random() * Math.PI * 2;
        
        const treePos = new THREE.Vector3(Math.cos(angle) * r, h, Math.sin(angle) * r);
        
        // Random (Float) Position
        const randomPos = new THREE.Vector3(
            (Math.random() - 0.5) * 25,
            (Math.random() - 0.5) * 20,
            (Math.random() - 0.5) * 20
        );

        // Explosion Vector
        const explosionDir = new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize();

        // 50/50 split for box colors, actual color applied in layout effect
        const type = Math.random() > 0.5 ? 1 : 2;
        const scale = 0.2 + Math.random() * 0.3;
        
        return { 
            treePos, 
            randomPos, 
            explosionDir, 
            currentPos: treePos.clone(), 
            type, 
            baseScale: scale,
            rotation: new THREE.Euler(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI)
        };
    });
  }, [boxCount]);

  // Pre-calculate positions and vectors for Spheres (Bells)
  const spheres = useMemo(() => {
    return Array.from({ length: bellCount }).map(() => {
        // Tree Position
        const h = (Math.random() * TREE_HEIGHT) - (TREE_HEIGHT / 2);
        const ratio = (h + (TREE_HEIGHT / 2)) / TREE_HEIGHT;
        const radiusAtHeight = (1 - ratio) * TREE_RADIUS_BASE;
        const r = radiusAtHeight * (0.6 + Math.random() * 0.6);
        const angle = Math.random() * Math.PI * 2;

        const treePos = new THREE.Vector3(Math.cos(angle) * r, h, Math.sin(angle) * r);

        // Random Position
        const randomPos = new THREE.Vector3(
            (Math.random() - 0.5) * 25,
            (Math.random() - 0.5) * 20,
            (Math.random() - 0.5) * 20
        );

        // Explosion Vector
        const explosionDir = new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize();

        const scale = 0.2 + Math.random() * 0.2;

        return { 
            treePos, 
            randomPos, 
            explosionDir, 
            currentPos: treePos.clone(), 
            baseScale: scale,
            rotation: new THREE.Euler(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI)
        };
    });
  }, [bellCount]);

  // Initialize Colors
  useLayoutEffect(() => {
    if (boxMeshRef.current) {
        boxes.forEach((data, i) => {
            const c = data.type === 1 ? boxColor1 : boxColor2;
            boxMeshRef.current!.setColorAt(i, new THREE.Color(c));
        });
        boxMeshRef.current.instanceColor!.needsUpdate = true;
    }
  }, [boxes, boxColor1, boxColor2]);

  useLayoutEffect(() => {
    if (sphereMeshRef.current) {
        spheres.forEach((data, i) => {
            sphereMeshRef.current!.setColorAt(i, new THREE.Color(bellColor));
        });
        sphereMeshRef.current.instanceColor!.needsUpdate = true;
    }
  }, [spheres, bellColor]);

  useFrame((state, delta) => {
    const beat = audioData.averageFrequency / 255;
    // UPDATE: Shatter on OPEN or PINCH
    const isShattering = handData.gesture === Gesture.OPEN || handData.gesture === Gesture.PINCH;
    const diffusionCoef = 10;
    const speed = isShattering ? 4 * delta : 2 * delta;
    const time = state.clock.getElapsedTime();

    // Update Boxes
    if (boxMeshRef.current) {
        boxes.forEach((data, i) => {
            let targetX, targetY, targetZ;

            if (mode === AppMode.TREE) {
                targetX = data.treePos.x;
                targetY = data.treePos.y;
                targetZ = data.treePos.z;
            } else {
                targetX = data.randomPos.x;
                targetY = data.randomPos.y;
                targetZ = data.randomPos.z;
            }

            if (isShattering) {
                const explosionScale = 1.0 + (beat * 0.5);
                targetX += data.explosionDir.x * diffusionCoef * explosionScale;
                targetY += data.explosionDir.y * diffusionCoef * explosionScale;
                targetZ += data.explosionDir.z * diffusionCoef * explosionScale;
            }

            // Lerp Position
            data.currentPos.x += (targetX - data.currentPos.x) * speed;
            data.currentPos.y += (targetY - data.currentPos.y) * speed;
            data.currentPos.z += (targetZ - data.currentPos.z) * speed;

            dummy.position.copy(data.currentPos);
            
            // Apply slight rotation for liveliness
            dummy.rotation.set(
                data.rotation.x + time * 0.2, 
                data.rotation.y + time * 0.2, 
                data.rotation.z
            );

            // Scale with Beat
            const s = data.baseScale * (1 + beat * 0.5);
            dummy.scale.set(s, s, s);

            dummy.updateMatrix();
            boxMeshRef.current!.setMatrixAt(i, dummy.matrix);
        });
        boxMeshRef.current.instanceMatrix.needsUpdate = true;
    }

    // Update Spheres
    if (sphereMeshRef.current) {
        spheres.forEach((data, i) => {
             let targetX, targetY, targetZ;

            if (mode === AppMode.TREE) {
                targetX = data.treePos.x;
                targetY = data.treePos.y;
                targetZ = data.treePos.z;
            } else {
                targetX = data.randomPos.x;
                targetY = data.randomPos.y;
                targetZ = data.randomPos.z;
            }

            if (isShattering) {
                const explosionScale = 1.0 + (beat * 0.5);
                targetX += data.explosionDir.x * diffusionCoef * explosionScale;
                targetY += data.explosionDir.y * diffusionCoef * explosionScale;
                targetZ += data.explosionDir.z * diffusionCoef * explosionScale;
            }

            // Lerp Position
            data.currentPos.x += (targetX - data.currentPos.x) * speed;
            data.currentPos.y += (targetY - data.currentPos.y) * speed;
            data.currentPos.z += (targetZ - data.currentPos.z) * speed;

            dummy.position.copy(data.currentPos);
             // Apply slight rotation
             dummy.rotation.set(
                data.rotation.x, 
                data.rotation.y + time * 0.5, 
                data.rotation.z
            );
            
            // Scale with Beat
            const s = data.baseScale * (1 + beat * 0.5);
            dummy.scale.set(s, s, s);

            dummy.updateMatrix();
            sphereMeshRef.current!.setMatrixAt(i, dummy.matrix);
        });
        sphereMeshRef.current.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <group>
        {/* Gift Boxes */}
        <instancedMesh key={`boxes-${boxCount}`} ref={boxMeshRef} args={[undefined, undefined, boxCount]}>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial 
                metalness={0.6} 
                roughness={0.2} 
                envMapIntensity={1.5}
            />
        </instancedMesh>

        {/* Bells (Spheres) */}
        <instancedMesh key={`spheres-${bellCount}`} ref={sphereMeshRef} args={[undefined, undefined, bellCount]}>
            <sphereGeometry args={[0.6, 16, 16]} />
            <meshStandardMaterial 
                color={bellColor}
                metalness={1.0} 
                roughness={0.1} 
                envMapIntensity={2}
            />
        </instancedMesh>
    </group>
  );
};

export default Ornaments;