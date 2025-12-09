import React, { useEffect, useRef, useState } from 'react';
import Webcam from 'react-webcam';
import { Gesture, HandData } from '../types';
import { Camera, ChevronUp, ChevronDown, Activity } from 'lucide-react';

// We need to declare global types for the CDN loaded scripts
declare global {
  interface Window {
    Hands: any;
    Camera: any;
  }
}

interface Props {
  onHandUpdate: (data: HandData) => void;
  showCamera: boolean;
}

const HandController: React.FC<Props> = ({ onHandUpdate, showCamera }) => {
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cameraError, setCameraError] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Use a ref for hysteresis state to persist across animation frames without re-triggering effects
  const isPinchingRef = useRef(false);

  useEffect(() => {
    let camera: any = null;
    let hands: any = null;

    const onResults = (results: any) => {
      // Draw landmarks on canvas for visual feedback
      if (canvasRef.current && webcamRef.current && webcamRef.current.video) {
        const videoWidth = webcamRef.current.video.videoWidth;
        const videoHeight = webcamRef.current.video.videoHeight;
        
        canvasRef.current.width = videoWidth;
        canvasRef.current.height = videoHeight;
        
        const canvasCtx = canvasRef.current.getContext('2d');
        if (canvasCtx) {
          canvasCtx.save();
          canvasCtx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
          
          if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
            const landmarks = results.multiHandLandmarks[0];
            
            // Draw connectors and landmarks
            const drawingUtils = (window as any); // Access drawing utils from global scope if available
            if(drawingUtils.drawConnectors && drawingUtils.drawLandmarks) {
               drawingUtils.drawConnectors(canvasCtx, landmarks, (window as any).HAND_CONNECTIONS, {color: '#00FF00', lineWidth: 2});
               drawingUtils.drawLandmarks(canvasCtx, landmarks, {color: '#FF0000', lineWidth: 1});
            }

            // --- GESTURE LOGIC START ---
            
            // 0: Wrist
            // 4: Thumb Tip, 8: Index Tip
            const wrist = landmarks[0];
            const thumbTip = landmarks[4];
            const indexTip = landmarks[8];

            // 1. CALCULATE METRICS
            
            // Average distance from wrist to all 5 fingertips (for Open/Fist detection)
            const tips = [4, 8, 12, 16, 20];
            let totalTipDist = 0;
            for (const tipIdx of tips) {
                const tip = landmarks[tipIdx];
                totalTipDist += Math.hypot(tip.x - wrist.x, tip.y - wrist.y);
            }
            const avgTipDist = totalTipDist / 5;

            // Pinch distance (Thumb to Index)
            const pinchDist = Math.hypot(thumbTip.x - indexTip.x, thumbTip.y - indexTip.y);

            // 2. UPDATE STATE WITH HYSTERESIS
            
            // PINCH STATE
            let isPinching = isPinchingRef.current;
            if (isPinching) {
                if (pinchDist > 0.15) isPinching = false;
            } else {
                if (pinchDist < 0.08) isPinching = true;
            }
            isPinchingRef.current = isPinching;

            // OTHER STATES
            const isOpen = avgTipDist > 0.28;
            const isFist = avgTipDist < 0.16; // Threshold for closed hand

            // 3. DETERMINE FINAL GESTURE
            let currentGesture = Gesture.HOVER;

            if (isFist) {
                // Priority 1: Fist (Closed) -> Force HOVER (Original Tree)
                // This overrides PINCH even if thumb/index are close in the fist
                currentGesture = Gesture.HOVER;
            } else if (isPinching) {
                // Priority 2: Pinch -> PINCH (Explode)
                currentGesture = Gesture.PINCH;
            } else if (isOpen) {
                // Priority 3: Open -> OPEN (Explode)
                currentGesture = Gesture.OPEN;
            } else {
                // Default
                currentGesture = Gesture.HOVER;
            }

            // --- GESTURE LOGIC END ---

            // Invert X because webcam is mirrored
            const normalizedX = 1 - indexTip.x;
            const normalizedY = indexTip.y;

            onHandUpdate({
              x: normalizedX,
              y: normalizedY,
              gesture: currentGesture,
              isPresent: true
            });

          } else {
            // Reset pinch state if hand is lost
            isPinchingRef.current = false;
            onHandUpdate({ x: 0.5, y: 0.5, gesture: Gesture.IDLE, isPresent: false });
          }
          canvasCtx.restore();
        }
      }
    };

    const loadMediaPipe = async () => {
      try {
        if(!(window as any).Hands) {
            console.warn("MediaPipe Hands script not loaded yet.");
            return;
        }

        // Updated to a newer, stable version to prevent CDN 404 errors for assets
        const handsVersion = '0.4.1675469240';
        
        hands = new (window as any).Hands({locateFile: (file: string) => {
          return `https://cdn.jsdelivr.net/npm/@mediapipe/hands@${handsVersion}/${file}`;
        }});

        hands.setOptions({
          maxNumHands: 1,
          modelComplexity: 1,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5
        });

        hands.onResults(onResults);

        if (webcamRef.current && webcamRef.current.video) {
          camera = new (window as any).Camera(webcamRef.current.video, {
            onFrame: async () => {
              if (webcamRef.current && webcamRef.current.video) {
                try {
                    await hands.send({image: webcamRef.current.video});
                } catch(e) {
                    console.error("Error sending frame to MediaPipe", e);
                }
              }
            },
            width: 320,
            height: 240
          });
          camera.start();
        }
      } catch (err) {
        console.error("Failed to initialize MediaPipe", err);
        setCameraError(true);
      }
    };

    // Small delay to ensure scripts are parsed
    const timer = setTimeout(loadMediaPipe, 1500);

    return () => {
        clearTimeout(timer);
        if (camera) camera.stop();
        if (hands) hands.close();
    };
  }, [onHandUpdate]);

  if (!showCamera) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2">
       
        {/* Collapsible Video Container */}
        <div className={`
            relative overflow-hidden bg-black/90 border border-cyan-500/30 rounded-lg transition-all duration-300 origin-bottom-right shadow-[0_0_20px_rgba(0,243,255,0.1)]
            ${isExpanded ? 'w-48 h-36 opacity-100 mb-0' : 'w-0 h-0 opacity-0 mb-0 pointer-events-none'}
        `}>
            {cameraError ? (
                 <div className="flex items-center justify-center w-full h-full text-xs text-red-400 font-mono">
                    SIGNAL LOST
                </div>
            ) : (
                <>
                    <Webcam
                        ref={webcamRef}
                        audio={false}
                        mirrored={true}
                        className="absolute top-0 left-0 w-full h-full object-cover opacity-60"
                        width={320}
                        height={240}
                    />
                    <canvas
                        ref={canvasRef}
                        className="absolute top-0 left-0 w-full h-full object-cover"
                    />
                     <div className="absolute bottom-1 right-2 text-[8px] text-cyan-500/80 font-mono tracking-widest">
                        VISION_FEED_01
                    </div>
                </>
            )}
        </div>

        {/* Toggle Button */}
        <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className={`
                flex items-center gap-2 px-3 py-2 rounded-full border backdrop-blur-md transition-all duration-300
                ${isExpanded 
                    ? 'bg-cyan-900/40 border-cyan-500 text-cyan-400' 
                    : 'bg-black/60 border-gray-700 text-gray-400 hover:text-cyan-400 hover:border-cyan-500/50'}
            `}
        >
            <div className={`w-2 h-2 rounded-full ${cameraError ? 'bg-red-500' : 'bg-green-500 animate-pulse'}`}></div>
            <Camera size={14} />
            <span className="text-[10px] font-mono tracking-wider font-bold">
                {isExpanded ? 'HIDE FEED' : 'VISION SYSTEM'}
            </span>
            {isExpanded ? <ChevronDown size={12} /> : <ChevronUp size={12} />}
        </button>
    </div>
  );
};

export default HandController;