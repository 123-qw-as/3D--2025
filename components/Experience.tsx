import React, { useState, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars, Environment } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import ParticleTree from './ParticleTree';
import PhotoGallery from './PhotoGallery';
import Ornaments from './Ornaments';
import ErrorBoundary from './ErrorBoundary';
import { AppMode, AudioData, HandData, Gesture, SceneConfig } from '../types';
import * as THREE from 'three';

interface Props {
  mode: AppMode;
  audioData: AudioData;
  handData: HandData;
  config: SceneConfig;
  images: string[];
}

const SceneContent: React.FC<Props & { setHovered: (h: boolean) => void }> = ({ mode, audioData, handData, setHovered, config, images }) => {
    const rotationGroup = useRef<THREE.Group>(null);
    
    useFrame((state, delta) => {
        if (rotationGroup.current && mode === AppMode.TREE) {
             // Auto rotate the entire tree group (Particles + Photos + Ornaments)
             rotationGroup.current.rotation.y += delta * 0.1;
        }
    });

    return (
        <group ref={rotationGroup}>
            <ParticleTree 
                mode={mode} 
                audioData={audioData} 
                handData={handData}
                count={config.particleCount}
                color1={config.particleColor1}
                color2={config.particleColor2}
            />
            <Ornaments 
                mode={mode} 
                audioData={audioData} 
                handData={handData}
                boxCount={config.boxCount}
                bellCount={config.bellCount}
                boxColor1={config.boxColor1}
                boxColor2={config.boxColor2}
                bellColor={config.bellColor}
            />
            <PhotoGallery handData={handData} setHovered={setHovered} images={images} />
        </group>
    )
}

const Experience: React.FC<Props> = ({ mode, audioData, handData, config, images }) => {
  const [hovered, setHovered] = useState(false);
  
  // Convert hand 2D [0,1] to normalized device coordinates [-1, 1] for cursor
  const cursorX = (handData.x * 2) - 1;
  const cursorY = -(handData.y * 2) + 1;

  return (
    <div className="w-full h-screen bg-black relative">
        <Canvas 
            camera={{ position: [0, 0, 20], fov: 45 }}
            gl={{ antialias: false, toneMapping: THREE.ReinhardToneMapping, toneMappingExposure: 1.5 }}
            dpr={[1, 2]}
        >
            <color attach="background" args={['#050505']} />
            <fog attach="fog" args={['#050505', 10, 50]} />
            
            <ambientLight intensity={0.5} />
            
            {/* Environment for Metallic reflections with fallback */}
            <ErrorBoundary fallback={<directionalLight position={[10, 10, 5]} intensity={2} />}>
                <Environment preset="city" />
            </ErrorBoundary>

            <group rotation={[0, -Math.PI / 4, 0]}>
                <SceneContent mode={mode} audioData={audioData} handData={handData} setHovered={setHovered} config={config} images={images} />
            </group>

            <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
            
            {/* Post Processing */}
            <EffectComposer disableNormalPass>
                <Bloom luminanceThreshold={0.2} mipmapBlur intensity={1.5} radius={0.6} />
                <Vignette eskil={false} offset={0.1} darkness={1.1} />
            </EffectComposer>

            <OrbitControls 
                enableZoom={true} 
                enablePan={false} 
                enableRotate={true}
                maxDistance={50}
                minDistance={5}
                autoRotate={false}
            />
            
            {/* 3D Cursor Helper */}
            {handData.isPresent && (
                <mesh position={[cursorX * 10, cursorY * 10, 5]}>
                    <ringGeometry args={[0.1, 0.12, 32]} />
                    <meshBasicMaterial color={handData.gesture === Gesture.PINCH ? "#ff00aa" : "#00f3ff"} />
                </mesh>
            )}

        </Canvas>
    </div>
  );
};

export default Experience;