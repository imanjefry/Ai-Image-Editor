import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { Canvas } from './components/Canvas';
import { Modal } from './components/Modal';
import { useImageHistory } from './hooks/useImageHistory';
import { editImageWithAI, removeBackgroundAI, upscaleImageAI, colorizeImageAI } from './services/geminiService';
import type { Tool, Filter, ImageDimensions, Crop, PresetFilter, TextOverlay, OverlayImage } from './types';
import { PRESET_FILTERS } from './types';

const App: React.FC = () => {
  const { state: imageSrc, setState: setImageSrc, undo, redo, canUndo, canRedo } = useImageHistory();
  const [activeTool, setActiveTool] = useState<Tool | null>(null);
  const [filters, setFilters] = useState<Filter>({ brightness: 100, contrast: 100, saturation: 100, rotation: 0, scaleX: 1, scaleY: 1, preset: 'none' });
  const [crop, setCrop] = useState<Crop | null>(null);
  const [textOverlay, setTextOverlay] = useState<TextOverlay | null>(null);
  const [overlays, setOverlays] = useState<OverlayImage[]>([]);
  const [activeOverlayId, setActiveOverlayId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageDimensions, setImageDimensions] = useState<ImageDimensions | null>(null);
  const [selectedColor, setSelectedColor] = useState<string>('#FFFFFF');
  const [frameWidth, setFrameWidth] = useState<number>(4);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const overlayFileInputRef = useRef<HTMLInputElement>(null);

  const resetFiltersAndTools = useCallback(() => {
    setFilters({ brightness: 100, contrast: 100, saturation: 100, rotation: 0, scaleX: 1, scaleY: 1, preset: 'none' });
    setActiveTool(null);
    setCrop(null);
    setTextOverlay(null);
    setOverlays([]);
    setActiveOverlayId(null);
  }, []);
  
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        const img = new Image();
        img.onload = () => {
          setImageDimensions({ width: img.width, height: img.height });
          setImageSrc(result);
          resetFiltersAndTools();
        };
        img.src = result;
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerUpload = () => {
    fileInputRef.current?.click();
  };

  const handleOverlayUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && imageDimensions) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        const overlayImg = new Image();
        overlayImg.onload = () => {
            const overlayAspectRatio = overlayImg.width / overlayImg.height;
            const overlayPixelWidth = imageDimensions.width * 0.5;
            const overlayPixelHeight = overlayPixelWidth / overlayAspectRatio;
            const widthPercent = (overlayPixelWidth / imageDimensions.width) * 100;
            const heightPercent = (overlayPixelHeight / imageDimensions.height) * 100;

            const newOverlay: OverlayImage = {
                id: Date.now().toString(),
                src: result,
                options: {
                    opacity: 0.7,
                    blendMode: 'overlay',
                    x: (100 - widthPercent) / 2,
                    y: (100 - heightPercent) / 2,
                    width: widthPercent,
                    height: heightPercent,
                }
            };
            setOverlays(currentOverlays => [...currentOverlays, newOverlay]);
            setActiveOverlayId(newOverlay.id);
        };
        overlayImg.src = result;
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerOverlayUpload = () => {
    overlayFileInputRef.current?.click();
  };
  
  const applyAndSaveFilters = useCallback(() => {
      if (!imageSrc) return;

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const img = new Image();
      img.onload = () => {
          canvas.width = img.width;
          canvas.height = img.height;

          const baseFilters = `brightness(${filters.brightness}%) contrast(${filters.contrast}%) saturate(${filters.saturation}%)`;
          const presetFilter = PRESET_FILTERS[filters.preset] === 'none' ? '' : PRESET_FILTERS[filters.preset];
          ctx.filter = `${baseFilters} ${presetFilter}`.trim();

          ctx.translate(canvas.width / 2, canvas.height / 2);
          ctx.rotate((filters.rotation * Math.PI) / 180);
          ctx.scale(filters.scaleX, filters.scaleY);
          ctx.drawImage(img, -img.width / 2, -img.height / 2);

          const dataUrl = canvas.toDataURL('image/png');
          setImageSrc(dataUrl);
          resetFiltersAndTools();
      };
      img.src = imageSrc;
  }, [imageSrc, filters, setImageSrc, resetFiltersAndTools]);


  const handleDownload = useCallback(() => {
    if (!imageSrc) return;
  
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx || !imageDimensions) return;
  
    const img = new Image();
    img.onload = () => {
      canvas.width = imageDimensions.width;
      canvas.height = imageDimensions.height;
  
      const baseFilters = `brightness(${filters.brightness}%) contrast(${filters.contrast}%) saturate(${filters.saturation}%)`;
      const presetFilter = PRESET_FILTERS[filters.preset] === 'none' ? '' : PRESET_FILTERS[filters.preset];
      ctx.filter = `${baseFilters} ${presetFilter}`.trim();
  
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((filters.rotation * Math.PI) / 180);
      ctx.scale(filters.scaleX, filters.scaleY);
      ctx.drawImage(img, -img.width / 2, -img.height / 2);
  
      const link = document.createElement('a');
      link.download = 'edited-image.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
    };
    img.src = imageSrc;
  }, [imageSrc, filters, imageDimensions]);

  const handleAiEdit = async (prompt: string) => {
    if (!imageSrc) return;
    setIsModalOpen(false);
    setIsLoading(true);
    setError(null);
    try {
      const mimeType = imageSrc.substring(imageSrc.indexOf(':') + 1, imageSrc.indexOf(';'));
      const base64Data = imageSrc.split(',')[1];
      const newImageBase64 = await editImageWithAI(base64Data, mimeType, prompt);
      const newImageSrc = `data:image/png;base64,${newImageBase64}`;
      const img = new Image();
      img.onload = () => {
          setImageDimensions({ width: img.width, height: img.height });
          setImageSrc(newImageSrc);
      };
      img.src = newImageSrc;
      resetFiltersAndTools();
    } catch (e) {
      setError((e as Error).message || 'Failed to edit image with AI. Please try again.');
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveBackground = async () => {
    if (!imageSrc) return;
    setIsLoading(true);
    setError(null);
    try {
      const mimeType = imageSrc.substring(imageSrc.indexOf(':') + 1, imageSrc.indexOf(';'));
      const base64Data = imageSrc.split(',')[1];
      const newImageBase64 = await removeBackgroundAI(base64Data, mimeType);
      const newImageSrc = `data:image/png;base64,${newImageBase64}`;
      const img = new Image();
      img.onload = () => {
          setImageDimensions({ width: img.width, height: img.height });
          setImageSrc(newImageSrc);
      };
      img.src = newImageSrc;
      resetFiltersAndTools();
    } catch (e) {
      setError((e as Error).message || 'Failed to remove background. Please try again.');
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpscaleImage = async () => {
    if (!imageSrc) return;
    setIsLoading(true);
    setError(null);
    try {
      const mimeType = imageSrc.substring(imageSrc.indexOf(':') + 1, imageSrc.indexOf(';'));
      const base64Data = imageSrc.split(',')[1];
      const newImageBase64 = await upscaleImageAI(base64Data, mimeType);
      const newImageSrc = `data:image/png;base64,${newImageBase64}`;
      const img = new Image();
      img.onload = () => {
          setImageDimensions({ width: img.width, height: img.height });
          setImageSrc(newImageSrc);
      };
      img.src = newImageSrc;
      resetFiltersAndTools();
    } catch (e) {
      setError((e as Error).message || 'Failed to upscale image. Please try again.');
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleColorizeImage = async () => {
    if (!imageSrc) return;
    setIsLoading(true);
    setError(null);
    try {
      const mimeType = imageSrc.substring(imageSrc.indexOf(':') + 1, imageSrc.indexOf(';'));
      const base64Data = imageSrc.split(',')[1];
      const newImageBase64 = await colorizeImageAI(base64Data, mimeType);
      const newImageSrc = `data:image/png;base64,${newImageBase64}`;
      const img = new Image();
      img.onload = () => {
          setImageDimensions({ width: img.width, height: img.height });
          setImageSrc(newImageSrc);
      };
      img.src = newImageSrc;
      resetFiltersAndTools();
    } catch (e) {
      setError((e as Error).message || 'Failed to colorize image. Please try again.');
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };
  
    const handleCrop = useCallback(() => {
    if (!imageSrc || !crop || !imageDimensions) return;

    const img = new Image();
    img.onload = () => {
        const canvas = document.createElement('canvas');
        const scaleX = img.width / 100;
        const scaleY = img.height / 100;

        const cropX = crop.x * scaleX;
        const cropY = crop.y * scaleY;
        const cropWidth = crop.width * scaleX;
        const cropHeight = crop.height * scaleY;

        canvas.width = cropWidth;
        canvas.height = cropHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.drawImage(
            img,
            cropX,
            cropY,
            cropWidth,
            cropHeight,
            0,
            0,
            cropWidth,
            cropHeight
        );

        const newImageSrc = canvas.toDataURL('image/png');
        const newImg = new Image();
        newImg.onload = () => {
            setImageDimensions({ width: newImg.width, height: newImg.height });
            setImageSrc(newImageSrc);
            resetFiltersAndTools();
        };
        newImg.src = newImageSrc;
    };
    img.src = imageSrc;
  }, [imageSrc, crop, imageDimensions, setImageSrc, resetFiltersAndTools]);

  const applyText = useCallback(() => {
    if (!imageSrc || !textOverlay || !imageDimensions) return;
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
        canvas.width = imageDimensions.width;
        canvas.height = imageDimensions.height;
        ctx.drawImage(img, 0, 0);

        const fontSize = (textOverlay.size / 100) * canvas.width;
        ctx.font = `${fontSize}px ${textOverlay.font}`;
        ctx.fillStyle = textOverlay.color;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const x = (textOverlay.x / 100) * canvas.width;
        const y = (textOverlay.y / 100) * canvas.height;
        
        ctx.fillText(textOverlay.text, x, y);

        const dataUrl = canvas.toDataURL('image/png');
        setImageSrc(dataUrl);
        
        resetFiltersAndTools();
    };
    img.src = imageSrc;
  }, [imageSrc, textOverlay, imageDimensions, setImageSrc, resetFiltersAndTools]);

  const updateOverlayOptions = (id: string, newOptions: Partial<OverlayImage['options']>) => {
    setOverlays(currentOverlays => currentOverlays.map(ov => {
        if (ov.id === id) {
            return { ...ov, options: { ...ov.options, ...newOptions } };
        }
        return ov;
    }));
  };

  const deleteOverlay = (id: string) => {
      setOverlays(currentOverlays => currentOverlays.filter(ov => ov.id !== id));
      if (activeOverlayId === id) {
          setActiveOverlayId(null);
      }
  };

  const applyOverlays = useCallback(() => {
    if (!imageSrc || overlays.length === 0 || !imageDimensions) return;

    const canvas = document.createElement('canvas');
    canvas.width = imageDimensions.width;
    canvas.height = imageDimensions.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const baseImg = new Image();
    baseImg.src = imageSrc;
    baseImg.crossOrigin = 'anonymous';

    baseImg.onload = () => {
        ctx.drawImage(baseImg, 0, 0, imageDimensions.width, imageDimensions.height);

        const drawOverlay = (index: number) => {
            if (index >= overlays.length) {
                const dataUrl = canvas.toDataURL('image/png');
                setImageSrc(dataUrl);
                resetFiltersAndTools();
                return;
            }

            const overlay = overlays[index];
            const overlayImg = new Image();
            overlayImg.src = overlay.src;
            overlayImg.crossOrigin = 'anonymous';
            overlayImg.onload = () => {
                ctx.globalAlpha = overlay.options.opacity;
                ctx.globalCompositeOperation = overlay.options.blendMode as any;

                const overlayX = (overlay.options.x / 100) * canvas.width;
                const overlayY = (overlay.options.y / 100) * canvas.height;
                const overlayWidth = (overlay.options.width / 100) * canvas.width;
                const overlayHeight = (overlay.options.height / 100) * canvas.height;
                
                ctx.drawImage(overlayImg, overlayX, overlayY, overlayWidth, overlayHeight);
                drawOverlay(index + 1);
            };
            overlayImg.onerror = () => {
                console.error("Failed to load overlay image for applying.");
                drawOverlay(index + 1);
            }
        };
        drawOverlay(0);
    };
  }, [imageSrc, overlays, imageDimensions, setImageSrc, resetFiltersAndTools]);
  
  const handleApplyFrame = useCallback(() => {
    if (!imageSrc || !imageDimensions) return;

    const img = new Image();
    img.onload = () => {
      const borderWidthPx = (frameWidth / 100) * Math.min(img.width, img.height);
      const newWidth = img.width + borderWidthPx * 2;
      const newHeight = img.height + borderWidthPx * 2;
      
      const canvas = document.createElement('canvas');
      canvas.width = newWidth;
      canvas.height = newHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.fillStyle = selectedColor;
      ctx.fillRect(0, 0, newWidth, newHeight);

      ctx.drawImage(img, borderWidthPx, borderWidthPx);

      const newImageSrc = canvas.toDataURL('image/png');
      const newImg = new Image();
      newImg.onload = () => {
          setImageDimensions({ width: newImg.width, height: newImg.height });
          setImageSrc(newImageSrc);
          resetFiltersAndTools();
      };
      newImg.src = newImageSrc;
    };
    img.src = imageSrc;
  }, [imageSrc, imageDimensions, frameWidth, selectedColor, setImageSrc, resetFiltersAndTools]);

  const handleColorPicked = (color: string) => {
    setSelectedColor(color);
    setActiveTool('frame');
  };

  useEffect(() => {
    if (activeTool !== 'adjust' && activeTool !== 'rotate' && activeTool !== 'flip' && activeTool !== 'crop' && activeTool !== 'filters' && activeTool !== 'text' && activeTool !== 'layer' && activeTool !== 'frame') {
       const isDefault = filters.brightness === 100 && filters.contrast === 100 && filters.saturation === 100 && filters.rotation === 0 && filters.scaleX === 1 && filters.scaleY === 1 && filters.preset === 'none';
       if(!isDefault) {
          applyAndSaveFilters();
       }
    }
  }, [activeTool, applyAndSaveFilters, filters]);

  useEffect(() => {
    if (activeTool === 'text' && !textOverlay) {
      setTextOverlay({
        text: 'Hello World',
        font: 'Arial',
        size: 5,
        color: '#FFFFFF',
        x: 50,
        y: 50,
      });
    }
  }, [activeTool, textOverlay]);

  useEffect(() => {
    if (activeTool !== 'layer') {
        setActiveOverlayId(null);
    }
  }, [activeTool]);

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-gray-100 font-sans">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          activeTool={activeTool}
          setActiveTool={setActiveTool}
          onUpload={triggerUpload}
          onDownload={handleDownload}
          filters={filters}
          setFilters={setFilters}
          canUndo={canUndo}
          canRedo={canRedo}
          undo={undo}
          redo={redo}
          hasImage={!!imageSrc}
          openAiModal={() => setIsModalOpen(true)}
          applyFilters={applyAndSaveFilters}
          applyCrop={handleCrop}
          crop={crop}
          handleRemoveBackground={handleRemoveBackground}
          handleUpscaleImage={handleUpscaleImage}
          handleColorizeImage={handleColorizeImage}
          textOverlay={textOverlay}
          setTextOverlay={setTextOverlay}
          applyText={applyText}
          overlays={overlays}
          activeOverlayId={activeOverlayId}
          setActiveOverlayId={setActiveOverlayId}
          updateOverlayOptions={updateOverlayOptions}
          deleteOverlay={deleteOverlay}
          onUploadOverlay={triggerOverlayUpload}
          applyOverlays={applyOverlays}
          selectedColor={selectedColor}
          frameWidth={frameWidth}
          setFrameWidth={setFrameWidth}
          applyFrame={handleApplyFrame}
        />
        <main className="flex-1 flex flex-col items-center justify-center p-8 bg-gray-800 relative">
          <Canvas 
            imageSrc={imageSrc} 
            filters={filters} 
            onUpload={triggerUpload} 
            isLoading={isLoading}
            activeTool={activeTool}
            crop={crop}
            setCrop={setCrop}
            textOverlay={textOverlay}
            setTextOverlay={setTextOverlay}
            overlays={overlays}
            activeOverlayId={activeOverlayId}
            setActiveOverlayId={setActiveOverlayId}
            updateOverlayOptions={updateOverlayOptions}
            onColorPicked={handleColorPicked}
          />
          {error && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-red-500 text-white py-2 px-4 rounded-md shadow-lg">
              {error}
            </div>
          )}
        </main>
      </div>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImageUpload}
        accept="image/*"
        className="hidden"
      />
      <input
        type="file"
        ref={overlayFileInputRef}
        onChange={handleOverlayUpload}
        accept="image/*"
        className="hidden"
      />
      {isModalOpen && (
        <Modal
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleAiEdit}
        />
      )}
    </div>
  );
};

import { API_KEY } from './config';
console.log(API_KEY);

export default App;