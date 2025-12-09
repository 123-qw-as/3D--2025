import React, { useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Image } from '@react-three/drei';
import * as THREE from 'three';
import { Gesture, HandData } from '../types';

interface Props {
  handData: HandData;
  setHovered: (hovered: boolean) => void;
  images: string[];
}

const PhotoGallery: React.FC<Props> = ({ handData, setHovered, images }) => {
  const { camera } = useThree();
  const groupRef = useRef<THREE.Group>(null);
  
  // Create fixed random positions for photos
  const photoConfig = useMemo(() => {
    return images.map((url, i) => {
      const angle = (i / images.length) * Math.PI * 2;
      const radius = 8;
      // Position them slightly outside the tree radius
      return {
        url,
        initialPos: new THREE.Vector3(Math.sin(angle) * radius, (Math.random() - 0.5) * 8, Math.cos(angle) * radius),
        rotation: new THREE.Euler(0, angle + Math.PI, 0)
      };
    });
  }, [images]);

  const activePhotoIndex = useRef<number>(-1);

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    
    // Raycasting logic using hand coordinates
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2((handData.x * 2) - 1, -(handData.y * 2) + 1);
    
    raycaster.setFromCamera(pointer, camera);
    
    const photos = groupRef.current.children.filter(c => c.name === "photo_container");
    const intersects = raycaster.intersectObjects(photos, true);

    if (intersects.length > 0) {
       setHovered(true);
       
       if (handData.gesture === Gesture.PINCH && activePhotoIndex.current === -1) {
           const parentGroup = intersects[0].object.parent;
           if (parentGroup) {
               const idx = parseInt(parentGroup.userData.index);
               if (!isNaN(idx)) {
                   activePhotoIndex.current = idx;
               }
           }
       }
    } else {
        setHovered(false);
    }

    if (handData.gesture !== Gesture.PINCH) {
        activePhotoIndex.current = -1;
    }

    // Animate each photo
    groupRef.current.children.forEach((child, i) => {
        if (child.name !== "photo_container") return;
        
        // Safety check if config changed faster than children unmount
        const config = photoConfig[i];
        if (!config) return;

        const isGrabbed = i === activePhotoIndex.current;
        
        let targetPos = config.initialPos.clone();
        let targetRot = config.rotation.clone();
        let targetScale = 1;

        if (isGrabbed && groupRef.current) {
            // CRITICAL: We need to calculate the Local Position that corresponds to 
            // the World Position in front of the camera, because the parent group (Tree) is rotating.
            
            // 1. Get Target World Position
            const forward = new THREE.Vector3(0, 0, -5); 
            forward.applyQuaternion(camera.quaternion);
            const worldTargetPos = camera.position.clone().add(forward);
            
            // 2. Convert World Position -> Local Position inside the rotating group
            targetPos = groupRef.current.worldToLocal(worldTargetPos.clone());
            
            // 3. Look At Logic
            // The object is inside a rotating group, so simple lookAt(camera) works 
            // but we need to update it every frame as the parent rotates.
            // A simpler trick for rotation is to assume billboard behavior or strict lookAt
            // when grabbed.
            
            // We use a dummy object to compute the local rotation needed to face the camera
            // considering the parent's world rotation.
            const dummy = new THREE.Object3D();
            // Position dummy at the child's world position (if it were at targetPos)
            const projectedWorldPos = groupRef.current.localToWorld(targetPos.clone());
            dummy.position.copy(projectedWorldPos);
            dummy.lookAt(camera.position);
            
            // Now we need to convert this World Rotation to Local Rotation
            // child.quaternion = parent.worldQuaternion.inverse() * dummy.worldQuaternion
            const parentWorldQuat = new THREE.Quaternion();
            groupRef.current.getWorldQuaternion(parentWorldQuat);
            
            const relativeQuat = parentWorldQuat.clone().invert().multiply(dummy.quaternion);
            const targetEuler = new THREE.Euler().setFromQuaternion(relativeQuat);
            
            targetRot = targetEuler;
            targetScale = 2.5; 
        } else {
            // Idle float
            targetPos.y += Math.sin(state.clock.elapsedTime + i) * 0.01;
        }

        // Smooth transition
        child.position.lerp(targetPos, delta * 5);
        
        // Handle rotation lerp (Euler is tricky for full rotations, but sufficient here)
        // Check for 2PI jumps to prevent spinning wrong way
        if (Math.abs(child.rotation.y - targetRot.y) > Math.PI) {
            if (targetRot.y > child.rotation.y) child.rotation.y += Math.PI * 2;
            else child.rotation.y -= Math.PI * 2;
        }

        child.rotation.x = THREE.MathUtils.lerp(child.rotation.x, targetRot.x, delta * 5);
        child.rotation.y = THREE.MathUtils.lerp(child.rotation.y, targetRot.y, delta * 5);
        child.rotation.z = THREE.MathUtils.lerp(child.rotation.z, targetRot.z, delta * 5);
        
        const currentScale = child.scale.x;
        const newScale = THREE.MathUtils.lerp(currentScale, targetScale, delta * 5);
        child.scale.set(newScale, newScale, newScale);
    });

  });

  return (
    <group ref={groupRef}>
      {photoConfig.map((config, i) => (
        <group 
            key={`${config.url}-${i}`} 
            name="photo_container" 
            position={config.initialPos} 
            rotation={config.rotation}
            userData={{ index: i }}
        >
            <Image 
                url={config.url} 
                transparent 
                opacity={0.9} 
                side={THREE.DoubleSide}
            />
            {/* Hollow Golden Picture Frame (Constructed of 4 sides) */}
            <group>
                {/* Top Bar */}
                <mesh position={[0, 0.55, 0]}>
                    <boxGeometry args={[1.2, 0.1, 0.05]} />
                    <meshStandardMaterial 
                        color="#FFD700" 
                        metalness={1.0}
                        roughness={0.2}
                        envMapIntensity={2.0}
                    />
                </mesh>
                {/* Bottom Bar */}
                <mesh position={[0, -0.55, 0]}>
                    <boxGeometry args={[1.2, 0.1, 0.05]} />
                    <meshStandardMaterial 
                        color="#FFD700" 
                        metalness={1.0}
                        roughness={0.2}
                        envMapIntensity={2.0}
                    />
                </mesh>
                {/* Left Bar */}
                <mesh position={[-0.55, 0, 0]}>
                    <boxGeometry args={[0.1, 1.0, 0.05]} />
                    <meshStandardMaterial 
                        color="#FFD700" 
                        metalness={1.0}
                        roughness={0.2}
                        envMapIntensity={2.0}
                    />
                </mesh>
                {/* Right Bar */}
                <mesh position={[0.55, 0, 0]}>
                    <boxGeometry args={[0.1, 1.0, 0.05]} />
                    <meshStandardMaterial 
                        color="#FFD700" 
                        metalness={1.0}
                        roughness={0.2}
                        envMapIntensity={2.0}
                    />
                </mesh>
            </group>
        </group>
      ))}
    </group>
  );
};

export default PhotoGallery;