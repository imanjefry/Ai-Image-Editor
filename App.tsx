import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { Canvas } from './components/Canvas';
import { Modal } from './components/Modal';
import { useImageHistory } from './hooks/useImageHistory';
import { editImageWithAI } from './services/geminiService';
import type { Tool, Filter, ImageDimensions, Crop, PresetFilter } from './types';
import { PRESET_FILTERS } from './types';

const App: React.FC = () => {
  const { state: imageSrc, setState: setImageSrc, undo, redo, canUndo, canRedo } = useImageHistory();
  const [activeTool, setActiveTool] = useState<Tool | null>(null);
  const [filters, setFilters] = useState<Filter>({ brightness: 100, contrast: 100, saturation: 100, rotation: 0, scaleX: 1, scaleY: 1, preset: 'none' });
  const [crop, setCrop] = useState<Crop | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageDimensions, setImageDimensions] = useState<ImageDimensions | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetFiltersAndTools = useCallback(() => {
    setFilters({ brightness: 100, contrast: 100, saturation: 100, rotation: 0, scaleX: 1, scaleY: 1, preset: 'none' });
    setActiveTool(null);
    setCrop(null);
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
      const newImageBase64 = await editImageWithAI(base64Data, mimeType, "remove the background, return the result as a png with a transparent background");
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
  
  useEffect(() => {
    if (activeTool !== 'adjust' && activeTool !== 'rotate' && activeTool !== 'flip' && activeTool !== 'crop' && activeTool !== 'filters') {
       const isDefault = filters.brightness === 100 && filters.contrast === 100 && filters.saturation === 100 && filters.rotation === 0 && filters.scaleX === 1 && filters.scaleY === 1 && filters.preset === 'none';
       if(!isDefault) {
          applyAndSaveFilters();
       }
    }
  }, [activeTool, applyAndSaveFilters, filters]);

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
      {isModalOpen && (
        <Modal
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleAiEdit}
        />
      )}
    </div>
  );
};

export default App;