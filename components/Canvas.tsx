import React, { useRef, useState, useEffect } from 'react';
import type { Filter, Tool, Crop, TextOverlay, OverlayImage } from '../types';
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
  textOverlay: TextOverlay | null;
  setTextOverlay: React.Dispatch<React.SetStateAction<TextOverlay | null>>;
  overlays: OverlayImage[];
  activeOverlayId: string | null;
  setActiveOverlayId: (id: string | null) => void;
  updateOverlayOptions: (id: string, newOptions: Partial<OverlayImage['options']>) => void;
}

// Helper to get coordinates from either mouse or touch events
const getClientCoords = (e: React.MouseEvent | React.TouchEvent) => {
    if ('touches' in e) {
        return { clientX: e.touches[0].clientX, clientY: e.touches[0].clientY };
    }
    return { clientX: e.clientX, clientY: e.clientY };
}

export const Canvas: React.FC<CanvasProps> = ({ 
    imageSrc, 
    filters, 
    onUpload, 
    isLoading, 
    activeTool, 
    crop, 
    setCrop,
    textOverlay,
    setTextOverlay,
    overlays,
    activeOverlayId,
    setActiveOverlayId,
    updateOverlayOptions
}) => {
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
  const [isDraggingText, setIsDraggingText] = useState(false);
  const [isDraggingOverlay, setIsDraggingOverlay] = useState(false);
  const [draggedOverlayId, setDraggedOverlayId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  const [loadingMessages] = useState(() => [
    "AI is thinking...",
    "Warming up the creative circuits...",
    "Painting with pixels...",
    "Consulting the digital muse...",
    "Generating visual magic...",
    "Reticulating splines...",
    "Analyzing image data...",
    "Applying neural filters...",
    "Negotiating with art spirits...",
    "Polishing the final result...",
    "The AI is working its magic...",
    "Just a moment, creating a masterpiece...",
    "Fetching inspiration from the cloud...",
    "Rendering your vision into reality...",
    "Cross-referencing artistic styles...",
  ].sort(() => Math.random() - 0.5)); // Shuffle for variety

  const [loadingMessage, setLoadingMessage] = useState(loadingMessages[0]);

  useEffect(() => {
    let intervalId: number | undefined;
    if (isLoading) {
      let currentIndex = 0;
      setLoadingMessage(loadingMessages[currentIndex]); // Start with the first message
      intervalId = window.setInterval(() => {
        currentIndex = (currentIndex + 1) % loadingMessages.length;
        setLoadingMessage(loadingMessages[currentIndex]);
      }, 2500);
    }
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isLoading, loadingMessages]);

   useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver(entries => {
        for (let entry of entries) {
            const { width, height } = entry.contentRect;
            setContainerSize({ width, height });
        }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent): { x: number; y: number } => {
    if (!containerRef.current) return { x: 0, y: 0 };
    const rect = containerRef.current.getBoundingClientRect();
    const { clientX, clientY } = getClientCoords(e);
    const x = ((clientX - rect.left) / rect.width) * 100;
    const y = ((clientY - rect.top) / rect.height) * 100;
    return { x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) };
  };

  const handleContainerPointerDown = (e: React.MouseEvent | React.TouchEvent) => {
    if (activeTool !== 'crop') return;
    setIsCropping(true);
    const coords = getCoordinates(e);
    setStartPoint(coords);
    setCrop({ x: coords.x, y: coords.y, width: 0, height: 0 });
  };

  const handleTextPointerDown = (e: React.MouseEvent | React.TouchEvent) => {
    if (activeTool !== 'text' || !textOverlay) return;
    e.stopPropagation();
    setIsDraggingText(true);
    
    const containerRect = containerRef.current!.getBoundingClientRect();
    const { clientX, clientY } = getClientCoords(e);
    const clickXPercent = ((clientX - containerRect.left) / containerRect.width) * 100;
    const clickYPercent = ((clientY - containerRect.top) / containerRect.height) * 100;
    
    setDragOffset({
        x: clickXPercent - textOverlay.x,
        y: clickYPercent - textOverlay.y
    });
  };

  const handleOverlayPointerDown = (e: React.MouseEvent | React.TouchEvent, id: string) => {
    if (activeTool !== 'layer') return;
    e.stopPropagation();
    setIsDraggingOverlay(true);
    setDraggedOverlayId(id);
    setActiveOverlayId(id);

    const overlay = overlays.find(o => o.id === id);
    if (!overlay) return;
    
    const containerRect = containerRef.current!.getBoundingClientRect();
    const { clientX, clientY } = getClientCoords(e);
    const clickXPercent = ((clientX - containerRect.left) / containerRect.width) * 100;
    const clickYPercent = ((clientY - containerRect.top) / containerRect.height) * 100;
    
    setDragOffset({
        x: clickXPercent - overlay.options.x,
        y: clickYPercent - overlay.options.y
    });
  };

  const handleContainerPointerMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (isCropping && activeTool === 'crop') {
        if (e.cancelable) e.preventDefault();
        const currentCoords = getCoordinates(e);
        const newCrop: Crop = {
        x: Math.min(startPoint.x, currentCoords.x),
        y: Math.min(startPoint.y, currentCoords.y),
        width: Math.abs(currentCoords.x - startPoint.x),
        height: Math.abs(currentCoords.y - startPoint.y),
        };
        setCrop(newCrop);
    } else if (isDraggingText && activeTool === 'text' && textOverlay && setTextOverlay) {
        if (e.cancelable) e.preventDefault();
        const { x, y } = getCoordinates(e);
        setTextOverlay({
            ...textOverlay,
            x: x - dragOffset.x,
            y: y - dragOffset.y,
        });
    } else if (isDraggingOverlay && activeTool === 'layer' && draggedOverlayId) {
        if (e.cancelable) e.preventDefault();
        const { x, y } = getCoordinates(e);
        updateOverlayOptions(draggedOverlayId, {
            x: x - dragOffset.x,
            y: y - dragOffset.y,
        });
    }
  };

  const handleContainerPointerUp = () => {
    setIsCropping(false);
    setIsDraggingText(false);
    setIsDraggingOverlay(false);
    setDraggedOverlayId(null);
  };

  const dynamicFontSize = containerSize.width * (textOverlay?.size || 0) / 100;

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
            className="relative max-w-full max-h-full flex items-center justify-center select-none"
            onMouseDown={handleContainerPointerDown}
            onMouseMove={handleContainerPointerMove}
            onMouseUp={handleContainerPointerUp}
            onMouseLeave={handleContainerPointerUp}
            onTouchStart={handleContainerPointerDown}
            onTouchMove={handleContainerPointerMove}
            onTouchEnd={handleContainerPointerUp}
            style={{ cursor: activeTool === 'crop' ? 'crosshair' : 'default' }}
        >
            <img
                src={imageSrc}
                alt="Editable"
                className="max-w-full max-h-full object-contain transition-all duration-200 ease-in-out pointer-events-none"
                style={imageStyle}
            />
             {activeTool === 'layer' && overlays.map(ov => (
                <img
                    key={ov.id}
                    src={ov.src}
                    alt={`Overlay ${ov.id}`}
                    onMouseDown={(e) => handleOverlayPointerDown(e, ov.id)}
                    onTouchStart={(e) => handleOverlayPointerDown(e, ov.id)}
                    className="absolute transition-all duration-100"
                    style={{
                        left: `${ov.options.x}%`,
                        top: `${ov.options.y}%`,
                        width: `${ov.options.width}%`,
                        height: `${ov.options.height}%`,
                        opacity: ov.options.opacity,
                        mixBlendMode: ov.options.blendMode as any,
                        cursor: 'move',
                        outline: activeOverlayId === ov.id ? '2px dashed #22d3ee' : 'none',
                        outlineOffset: '2px',
                    }}
                />
            ))}
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
             {activeTool === 'text' && textOverlay && (
                <div
                    onMouseDown={handleTextPointerDown}
                    onTouchStart={handleTextPointerDown}
                    className="absolute whitespace-nowrap"
                    style={{
                        left: `${textOverlay.x}%`,
                        top: `${textOverlay.y}%`,
                        transform: 'translate(-50%, -50%)',
                        fontFamily: textOverlay.font,
                        fontSize: `${dynamicFontSize}px`,
                        color: textOverlay.color,
                        cursor: 'move',
                        textShadow: '0 0 5px rgba(0,0,0,0.5)',
                    }}
                >
                    {textOverlay.text}
                </div>
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