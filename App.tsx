import React, { useState, Suspense } from 'react';
import { AppMode, Gesture, HandData, AudioData, SceneConfig } from './types';
import Experience from './components/Experience';
import UIOverlay from './components/UIOverlay';
import HandController from './components/HandController';
import AudioHandler from './components/AudioHandler';
import { PARTICLE_COUNT, COLOR_PALETTE, GALLERY_IMAGES } from './constants';

const DEFAULT_AUDIO = "https://upload.wikimedia.org/wikipedia/commons/e/e8/Kevin_MacLeod_-_Jingle_Bells.ogg";

const App: React.FC = () => {
  const [mode, setMode] = useState<AppMode>(AppMode.TREE);
  const [isPlaying, setIsPlaying] = useState(false);
  const [galleryImages, setGalleryImages] = useState<string[]>(GALLERY_IMAGES);
  
  // Audio State
  const [audioUrl, setAudioUrl] = useState<string>(DEFAULT_AUDIO);
  const [audioName, setAudioName] = useState<string>("Kevin MacLeod - Jingle Bells");

  // Scene Configuration State
  const [config, setConfig] = useState<SceneConfig>({
    particleCount: PARTICLE_COUNT,
    boxCount: 250,
    bellCount: 250,
    particleColor1: COLOR_PALETTE.primary,
    particleColor2: COLOR_PALETTE.secondary,
    boxColor1: '#ff0000',
    boxColor2: '#00ff00',
    bellColor: '#FFD700'
  });

  // Lifted state for audio and hands to share between Canvas and UI
  const [handData, setHandData] = useState<HandData>({
    x: 0.5,
    y: 0.5,
    gesture: Gesture.IDLE,
    isPresent: false
  });

  const [audioData, setAudioData] = useState<AudioData>({
    averageFrequency: 0,
    frequencyData: new Uint8Array(0)
  });

  // Mouse fallback if hand is not present or just for non-camera users
  const handleMouseMove = (e: React.MouseEvent) => {
    if (handData.isPresent) return; // Priority to camera
    
    const x = e.clientX / window.innerWidth;
    const y = e.clientY / window.innerHeight;
    
    setHandData(prev => ({
      ...prev,
      x,
      y,
      gesture: e.buttons > 0 ? Gesture.PINCH : Gesture.HOVER,
      isPresent: true // Simulate presence
    }));
  };

  const handleMouseLeave = () => {
    if (handData.isPresent) return;
    setHandData(prev => ({ ...prev, isPresent: false, gesture: Gesture.IDLE }));
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
        const newImages = Array.from(e.target.files).map(file => URL.createObjectURL(file));
        // Append new images to the existing ones
        setGalleryImages(prev => [...prev, ...newImages]);
    }
  };

  const handleRemoveImage = (indexToRemove: number) => {
    setGalleryImages(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  const handleAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
        const file = e.target.files[0];
        const newUrl = URL.createObjectURL(file);
        setAudioUrl(newUrl);
        setAudioName(file.name);
        // Auto play when new song is uploaded
        setIsPlaying(true);
    }
  };

  return (
    <div 
        className="w-full h-screen bg-black text-white overflow-hidden relative"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onMouseDown={() => !handData.isPresent && setHandData(prev => ({ ...prev, gesture: Gesture.PINCH }))}
        onMouseUp={() => !handData.isPresent && setHandData(prev => ({ ...prev, gesture: Gesture.HOVER }))}
    >
      
      <UIOverlay 
        mode={mode} 
        setMode={setMode} 
        gesture={handData.gesture}
        isPlaying={isPlaying}
        setIsPlaying={setIsPlaying}
        handData={handData}
        config={config}
        setConfig={setConfig}
        onImageUpload={handleImageUpload}
        galleryImages={galleryImages}
        onRemoveImage={handleRemoveImage}
        audioName={audioName}
        onAudioUpload={handleAudioUpload}
      />

      <AudioHandler 
        isPlaying={isPlaying} 
        audioUrl={audioUrl}
        onAudioUpdate={setAudioData} 
      />
      
      <HandController 
        onHandUpdate={setHandData} 
        showCamera={true} 
      />

      <Suspense fallback={
        <div className="absolute inset-0 flex items-center justify-center text-cyan-500 font-mono animate-pulse">
            INITIALIZING HOLOGRAM...
        </div>
      }>
        <Experience 
            mode={mode} 
            audioData={audioData} 
            handData={handData}
            config={config}
            images={galleryImages}
        />
      </Suspense>
    </div>
  );
};

export default App;