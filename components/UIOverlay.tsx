import React, { useState, useRef } from 'react';
import { Activity, Music, Hand, Maximize2, Minimize2, Settings, X, Upload, Image as ImageIcon, Trash2, Plus, Volume2 } from 'lucide-react';
import { AppMode, Gesture, HandData, SceneConfig } from '../types';

interface Props {
  mode: AppMode;
  setMode: (mode: AppMode) => void;
  gesture: Gesture;
  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;
  handData: HandData;
  config: SceneConfig;
  setConfig: React.Dispatch<React.SetStateAction<SceneConfig>>;
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  galleryImages: string[];
  onRemoveImage: (index: number) => void;
  audioName?: string;
  onAudioUpload?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const UIOverlay: React.FC<Props> = ({ 
    mode, setMode, gesture, isPlaying, setIsPlaying, handData, config, setConfig, 
    onImageUpload, galleryImages, onRemoveImage, audioName, onAudioUpload 
}) => {
  const [showSettings, setShowSettings] = useState(false);
  const [showGallery, setShowGallery] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);

  const handleConfigChange = (key: keyof SceneConfig, value: string | number) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="absolute inset-0 pointer-events-none z-10 flex flex-col justify-between p-6">
      
      {/* Top Bar */}
      <div className="flex justify-between items-start pointer-events-auto">
        <div className="flex flex-col items-start gap-4">
            <div>
                <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600 tracking-tighter uppercase">
                    Holo<span className="text-white">Tree</span>
                </h1>
                <div className="flex items-center gap-2 mt-1">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                    <span className="text-xs text-cyan-500 font-mono tracking-widest">SYSTEM ONLINE</span>
                </div>
            </div>

            {/* Top-Left Hidden Image Manager */}
            <div className="relative">
                <button 
                    onClick={() => setShowGallery(!showGallery)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-mono transition-all duration-300 ${showGallery ? 'bg-cyan-900/80 border-cyan-400 text-cyan-300 shadow-[0_0_15px_rgba(0,243,255,0.3)]' : 'bg-black/20 border-gray-700/50 text-gray-500 hover:text-cyan-400 hover:border-cyan-500/50'}`}
                >
                    <ImageIcon size={14} />
                    <span>VISUAL_DB</span>
                </button>

                {/* Gallery Pop-out Panel */}
                {showGallery && (
                    <div className="absolute top-10 left-0 w-72 bg-black/90 backdrop-blur-xl border border-cyan-500/30 rounded-lg p-4 shadow-[0_0_30px_rgba(0,0,0,0.8)] animate-in fade-in slide-in-from-top-4 z-50">
                        <div className="flex justify-between items-center mb-3 border-b border-gray-800 pb-2">
                             <h3 className="text-cyan-400 font-mono text-xs tracking-widest uppercase">Memory Banks</h3>
                             <span className="text-gray-600 text-[10px]">{galleryImages.length} ITEMS</span>
                        </div>
                        
                        <div className="grid grid-cols-4 gap-2 max-h-[300px] overflow-y-auto custom-scrollbar mb-3">
                            <input 
                                type="file" 
                                ref={fileInputRef}
                                onChange={onImageUpload}
                                className="hidden" 
                                multiple 
                                accept="image/*"
                            />
                            
                            {/* Upload Button */}
                            <button 
                                onClick={() => fileInputRef.current?.click()}
                                className="aspect-square flex flex-col items-center justify-center border border-dashed border-gray-600 rounded bg-gray-900/50 text-gray-500 hover:text-cyan-400 hover:border-cyan-500 transition-colors"
                            >
                                <Plus size={16} />
                            </button>

                            {/* Image Thumbnails */}
                            {galleryImages.map((img, idx) => (
                                <div key={idx} className="relative group aspect-square rounded overflow-hidden border border-gray-800 bg-gray-900">
                                    <img src={img} alt={`img-${idx}`} className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-opacity" />
                                    <button 
                                        onClick={() => onRemoveImage(idx)}
                                        className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-400"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))}
                        </div>
                        <div className="text-[10px] text-gray-500 text-center font-mono">
                            SUPPORTED FORMATS: JPG, PNG, WEBP
                        </div>
                    </div>
                )}
            </div>
        </div>

        <div className="flex flex-col items-end gap-2">
            <div className="bg-black/40 backdrop-blur-md border border-cyan-500/30 p-2 rounded flex items-center gap-4 text-cyan-400 font-mono text-xs">
                <div className="flex items-center gap-2">
                    <Activity size={14} />
                    <span>STATUS: {mode}</span>
                </div>
                <div className="w-px h-3 bg-cyan-800"></div>
                <div className="flex items-center gap-2">
                    <Hand size={14} className={gesture !== Gesture.HOVER && gesture !== Gesture.IDLE ? "text-pink-500" : ""} />
                    <span className={gesture !== Gesture.HOVER && gesture !== Gesture.IDLE ? "text-pink-500" : ""}>
                        GESTURE: {gesture}
                    </span>
                </div>
            </div>

            <button 
                onClick={() => setShowSettings(!showSettings)}
                className={`p-2 rounded border transition-all ${showSettings ? 'bg-cyan-900/50 border-cyan-400 text-cyan-400' : 'bg-black/40 border-gray-700 text-gray-400 hover:text-cyan-400'}`}
            >
                <Settings size={18} />
            </button>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
          <div className="absolute top-24 right-6 w-80 bg-black/90 backdrop-blur-xl border border-cyan-500/50 rounded-lg p-5 pointer-events-auto shadow-[0_0_30px_rgba(0,243,255,0.1)] transition-all animate-in fade-in slide-in-from-right-10 overflow-y-auto max-h-[70vh]">
              <div className="flex justify-between items-center mb-4">
                  <h3 className="text-cyan-400 font-mono text-sm tracking-widest uppercase">Configuration</h3>
                  <button onClick={() => setShowSettings(false)} className="text-gray-500 hover:text-white">
                      <X size={16} />
                  </button>
              </div>
              
              <div className="space-y-6">

                  {/* System Controls */}
                  <div className="space-y-3">
                      <div className="text-xs text-gray-400 uppercase font-bold border-b border-gray-800 pb-1">System Control</div>
                      <div className="flex gap-2">
                        <button 
                            onClick={() => setMode(AppMode.TREE)}
                            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded text-xs border transition-all ${mode === AppMode.TREE ? 'bg-cyan-900/50 border-cyan-500 text-cyan-400' : 'border-gray-700 text-gray-400 hover:text-white'}`}
                        >
                            <Minimize2 size={14} /> TREE
                        </button>
                        <button 
                            onClick={() => setMode(AppMode.FLOAT)}
                            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded text-xs border transition-all ${mode === AppMode.FLOAT ? 'bg-cyan-900/50 border-cyan-500 text-cyan-400' : 'border-gray-700 text-gray-400 hover:text-white'}`}
                        >
                            <Maximize2 size={14} /> FLOAT
                        </button>
                      </div>
                  </div>

                  {/* Audio Settings */}
                  <div className="space-y-3">
                      <div className="text-xs text-gray-400 uppercase font-bold border-b border-gray-800 pb-1">Audio Source</div>
                      
                      <button 
                        onClick={() => setIsPlaying(!isPlaying)}
                        className={`w-full flex items-center justify-center gap-2 py-2 rounded text-xs border transition-all mb-2 ${isPlaying ? 'bg-pink-900/50 border-pink-500 text-pink-400' : 'border-gray-700 text-gray-400 hover:text-white'}`}
                      >
                         <Music size={14} className={isPlaying ? 'animate-bounce' : ''} />
                         {isPlaying ? 'PAUSE MUSIC' : 'PLAY MUSIC'}
                      </button>

                      <div className="bg-gray-900/50 rounded p-2 border border-gray-800">
                          <div className="flex items-center gap-2 mb-2">
                              <Volume2 size={12} className="text-cyan-500"/>
                              <div className="text-[10px] text-cyan-300 truncate max-w-[200px]">
                                  {audioName || "Unknown Track"}
                              </div>
                          </div>
                          <input 
                              type="file" 
                              ref={audioInputRef}
                              onChange={onAudioUpload}
                              className="hidden" 
                              accept="audio/*"
                          />
                          <button 
                              onClick={() => audioInputRef.current?.click()}
                              className="w-full text-[10px] bg-gray-800 hover:bg-cyan-900/30 text-gray-300 hover:text-cyan-400 py-1 rounded transition-colors flex items-center justify-center gap-1"
                          >
                              <Upload size={10} /> UPLOAD MP3/OGG
                          </button>
                      </div>
                  </div>

                  {/* Particles */}
                  <div className="space-y-3">
                      <div className="text-xs text-gray-400 uppercase font-bold border-b border-gray-800 pb-1">Particles</div>
                      <div className="space-y-2">
                          <label className="flex justify-between text-xs text-gray-300">
                              <span>Count: {config.particleCount}</span>
                          </label>
                          <input 
                              type="range" min="1000" max="10000" step="500"
                              value={config.particleCount}
                              onChange={(e) => handleConfigChange('particleCount', parseInt(e.target.value))}
                              className="w-full accent-cyan-500 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                          />
                      </div>
                      <div className="flex gap-2">
                          <div className="flex-1">
                             <label className="block text-[10px] text-gray-500 mb-1">Color 1</label>
                             <input 
                                type="color" 
                                value={config.particleColor1}
                                onChange={(e) => handleConfigChange('particleColor1', e.target.value)}
                                className="w-full h-8 rounded border border-gray-700 bg-transparent cursor-pointer"
                             />
                          </div>
                          <div className="flex-1">
                             <label className="block text-[10px] text-gray-500 mb-1">Color 2</label>
                             <input 
                                type="color" 
                                value={config.particleColor2}
                                onChange={(e) => handleConfigChange('particleColor2', e.target.value)}
                                className="w-full h-8 rounded border border-gray-700 bg-transparent cursor-pointer"
                             />
                          </div>
                      </div>
                  </div>

                  {/* Boxes */}
                  <div className="space-y-3">
                      <div className="text-xs text-gray-400 uppercase font-bold border-b border-gray-800 pb-1">Ornaments: Boxes</div>
                      <div className="space-y-2">
                          <label className="flex justify-between text-xs text-gray-300">
                              <span>Count: {config.boxCount}</span>
                          </label>
                          <input 
                              type="range" min="0" max="1000" step="10"
                              value={config.boxCount}
                              onChange={(e) => handleConfigChange('boxCount', parseInt(e.target.value))}
                              className="w-full accent-pink-500 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                          />
                      </div>
                      <div className="flex gap-2">
                          <div className="flex-1">
                             <label className="block text-[10px] text-gray-500 mb-1">Type A</label>
                             <input 
                                type="color" 
                                value={config.boxColor1}
                                onChange={(e) => handleConfigChange('boxColor1', e.target.value)}
                                className="w-full h-8 rounded border border-gray-700 bg-transparent cursor-pointer"
                             />
                          </div>
                          <div className="flex-1">
                             <label className="block text-[10px] text-gray-500 mb-1">Type B</label>
                             <input 
                                type="color" 
                                value={config.boxColor2}
                                onChange={(e) => handleConfigChange('boxColor2', e.target.value)}
                                className="w-full h-8 rounded border border-gray-700 bg-transparent cursor-pointer"
                             />
                          </div>
                      </div>
                  </div>

                  {/* Bells */}
                  <div className="space-y-3">
                      <div className="text-xs text-gray-400 uppercase font-bold border-b border-gray-800 pb-1">Ornaments: Bells</div>
                      <div className="space-y-2">
                          <label className="flex justify-between text-xs text-gray-300">
                              <span>Count: {config.bellCount}</span>
                          </label>
                          <input 
                              type="range" min="0" max="1000" step="10"
                              value={config.bellCount}
                              onChange={(e) => handleConfigChange('bellCount', parseInt(e.target.value))}
                              className="w-full accent-yellow-500 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                          />
                      </div>
                      <div>
                         <label className="block text-[10px] text-gray-500 mb-1">Color</label>
                         <input 
                            type="color" 
                            value={config.bellColor}
                            onChange={(e) => handleConfigChange('bellColor', e.target.value)}
                            className="w-full h-8 rounded border border-gray-700 bg-transparent cursor-pointer"
                         />
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* Center Reticle (Custom Cursor) */}
      {handData.isPresent && (
        <div 
            className="absolute pointer-events-none transition-all duration-75 ease-out"
            style={{ 
                left: `${handData.x * 100}%`, 
                top: `${handData.y * 100}%`,
                transform: 'translate(-50%, -50%)'
            }}
        >
            <div className={`
                relative flex items-center justify-center
                ${gesture === Gesture.PINCH ? 'w-12 h-12' : gesture === Gesture.OPEN ? 'w-16 h-16' : 'w-8 h-8'}
                transition-all duration-200
            `}>
                <div className={`absolute inset-0 border-2 rounded-full opacity-70 
                    ${gesture === Gesture.PINCH ? 'border-pink-500 scale-110' : gesture === Gesture.OPEN ? 'border-yellow-400 border-dashed animate-spin-slow' : 'border-cyan-400'}
                `}></div>
                <div className={`w-1 h-1 bg-white rounded-full`}></div>
                
                {gesture === Gesture.PINCH && (
                    <div className="absolute -top-6 text-[10px] font-bold text-pink-500 tracking-widest uppercase animate-pulse">
                        LOCKED
                    </div>
                )}
                {gesture === Gesture.OPEN && (
                    <div className="absolute -top-6 text-[10px] font-bold text-yellow-400 tracking-widest uppercase">
                        SHATTER
                    </div>
                )}
            </div>
        </div>
      )}


      {/* Bottom Control Bar */}
      <div className="flex items-end justify-between pointer-events-auto w-full">
        {/* Empty div for layout structure */}
        <div></div>
      </div>
    </div>
  );
};

export default UIOverlay;