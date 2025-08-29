import React, { useRef, useState, useEffect } from 'react';
import type { Filter, Tool, Crop } from '../types';
import { PRESET_FILTERS } from '../types';
import { UploadIcon } from './icons';

interface CanvasProps {
  imageSrc: string | null;
  filters: Filter;
  onUpload: () => void;
  isLoading: boolean;
  activeTool: Tool | null;
  crop: Crop | null;
  setCrop: React.Dispatch<React.SetStateAction<Crop | null>>;
}

export const Canvas: React.FC<CanvasProps> = ({ imageSrc, filters, onUpload, isLoading, activeTool, crop, setCrop }) => {
  const baseFilter = `brightness(${filters.brightness}%) contrast(${filters.contrast}%) saturate(${filters.saturation}%)`;
  const presetFilter = PRESET_FILTERS[filters.preset] === 'none' ? '' : PRESET_FILTERS[filters.preset];

  const imageStyle: React.CSSProperties = {
    filter: `${baseFilter} ${presetFilter}`.trim(),
    transform: `rotate(${filters.rotation}deg) scaleX(${filters.scaleX}) scaleY(${filters.scaleY})`,
    touchAction: 'none',
  };

  const containerRef = useRef<HTMLDivElement>(null);
  const [isCropping, setIsCropping] = useState(false);
  const [startPoint, setStartPoint] = useState({ x: 0, y: 0 });

  const loadingMessages = [
    "AI is thinking...",
    "Warming up the creative circuits...",
    "Painting with pixels...",
    "Consulting the digital muse...",
    "Generating visual magic...",
  ];
  const [loadingMessage, setLoadingMessage] = useState(loadingMessages[0]);

  useEffect(() => {
    let intervalId: number | undefined;
    if (isLoading) {
      let currentIndex = 0;
      intervalId = window.setInterval(() => {
        currentIndex = (currentIndex + 1) % loadingMessages.length;
        setLoadingMessage(loadingMessages[currentIndex]);
      }, 2500);
    }
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
        setLoadingMessage(loadingMessages[0]);
      }
    };
  }, [isLoading]);

  const getCoordinates = (e: React.MouseEvent): { x: number; y: number } => {
    if (!containerRef.current) return { x: 0, y: 0 };
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    return { x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) };
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (activeTool !== 'crop') return;
    e.preventDefault();
    setIsCropping(true);
    const coords = getCoordinates(e);
    setStartPoint(coords);
    setCrop({ x: coords.x, y: coords.y, width: 0, height: 0 });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isCropping || activeTool !== 'crop') return;
    e.preventDefault();
    const currentCoords = getCoordinates(e);
    const newCrop: Crop = {
      x: Math.min(startPoint.x, currentCoords.x),
      y: Math.min(startPoint.y, currentCoords.y),
      width: Math.abs(currentCoords.x - startPoint.x),
      height: Math.abs(currentCoords.y - startPoint.y),
    };
    setCrop(newCrop);
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (!isCropping) return;
    e.preventDefault();
    setIsCropping(false);
  };

  return (
    <div className="w-full h-full flex items-center justify-center bg-gray-800 rounded-lg overflow-hidden relative">
      {isLoading && (
        <div className="absolute inset-0 bg-gray-900/80 flex flex-col items-center justify-center z-20 backdrop-blur-sm">
           <div className="w-16 h-16 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
           <p className="mt-4 text-lg text-gray-300">{loadingMessage}</p>
        </div>
      )}
      {imageSrc ? (
        <div 
            ref={containerRef}
            className="relative max-w-full max-h-full flex items-center justify-center"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp} // Stop cropping if mouse leaves container
            style={{ cursor: activeTool === 'crop' ? 'crosshair' : 'default' }}
        >
            <img
                src={imageSrc}
                alt="Editable"
                className="max-w-full max-h-full object-contain transition-all duration-200 ease-in-out pointer-events-none"
                style={imageStyle}
            />
            {activeTool === 'crop' && crop && (
              <div
                className="absolute border-2 border-dashed border-white bg-black/30"
                style={{
                  left: `${crop.x}%`,
                  top: `${crop.y}%`,
                  width: `${crop.width}%`,
                  height: `${crop.height}%`,
                }}
              ></div>
            )}
        </div>
      ) : (
        <div className="text-center text-gray-500">
          <div className="flex flex-col items-center justify-center w-full h-full border-2 border-dashed border-gray-600 rounded-lg p-12 cursor-pointer hover:bg-gray-700/50 transition-colors" onClick={onUpload}>
            <UploadIcon className="w-16 h-16 mb-4" />
            <h2 className="text-2xl font-bold mb-2 text-gray-400">Upload an Image</h2>
            <p className="max-w-xs">Click here or drag and drop a file to start editing with the power of AI.</p>
          </div>
        </div>
      )}
    </div>
  );
};