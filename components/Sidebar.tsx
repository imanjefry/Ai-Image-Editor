import React from 'react';
import type { Tool, Filter, Crop, PresetFilter } from '../types';
import { PRESET_FILTERS } from '../types';
import { IconButton } from './IconButton';
import { Slider } from './Slider';
import {
  UploadIcon,
  DownloadIcon,
  AdjustmentsIcon,
  RotateIcon,
  FlipIcon,
  MagicIcon,
  UndoIcon,
  RedoIcon,
  CheckIcon,
  CropIcon,
  RemoveBgIcon,
  FilterIcon,
} from './icons';

interface SidebarProps {
  activeTool: Tool | null;
  setActiveTool: (tool: Tool | null) => void;
  onUpload: () => void;
  onDownload: () => void;
  filters: Filter;
  setFilters: React.Dispatch<React.SetStateAction<Filter>>;
  canUndo: boolean;
  canRedo: boolean;
  undo: () => void;
  redo: () => void;
  hasImage: boolean;
  openAiModal: () => void;
  applyFilters: () => void;
  applyCrop: () => void;
  crop: Crop | null;
  handleRemoveBackground: () => void;
}

const ToolSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="py-4">
    <h3 className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">{title}</h3>
    {children}
  </div>
);

export const Sidebar: React.FC<SidebarProps> = ({
  activeTool,
  setActiveTool,
  onUpload,
  onDownload,
  filters,
  setFilters,
  canUndo,
  canRedo,
  undo,
  redo,
  hasImage,
  openAiModal,
  applyFilters,
  applyCrop,
  crop,
  handleRemoveBackground,
}) => {
  const handleToolClick = (tool: Tool) => {
    setActiveTool(activeTool === tool ? null : tool);
  };
  
  const handleFlip = (axis: 'horizontal' | 'vertical') => {
    if (axis === 'horizontal') {
        setFilters(f => ({...f, scaleX: f.scaleX * -1}));
    } else {
        setFilters(f => ({...f, scaleY: f.scaleY * -1}));
    }
  };

  const handleRotate = (deg: number) => {
    setFilters(f => ({...f, rotation: (f.rotation + deg + 360) % 360 }));
  }

  const isFilterToolActive = activeTool === 'adjust' || activeTool === 'rotate' || activeTool === 'flip' || activeTool === 'filters';
  const isCropToolActive = activeTool === 'crop';

  return (
    <aside className="w-80 bg-gray-900/60 backdrop-blur-md border-r border-gray-700 flex flex-col z-10 shadow-2xl">
      <div className="flex-1 overflow-y-auto">
        <ToolSection title="File">
          <div className="space-y-1 px-2">
            <IconButton icon={<UploadIcon />} label="Upload Image" onClick={onUpload} />
            <IconButton icon={<DownloadIcon />} label="Download Image" onClick={onDownload} disabled={!hasImage} />
          </div>
        </ToolSection>

        <ToolSection title="History">
          <div className="space-y-1 px-2">
            <IconButton icon={<UndoIcon />} label="Undo" onClick={undo} disabled={!canUndo} />
            <IconButton icon={<RedoIcon />} label="Redo" onClick={redo} disabled={!canRedo} />
          </div>
        </ToolSection>

        <ToolSection title="Tools">
          <div className="space-y-1 px-2">
             <IconButton
              icon={<MagicIcon />}
              label="AI Edit"
              onClick={openAiModal}
              isActive={activeTool === 'ai'}
              disabled={!hasImage}
            />
            <IconButton
              icon={<RemoveBgIcon />}
              label="Remove Background"
              onClick={handleRemoveBackground}
              disabled={!hasImage}
            />
            <IconButton
              icon={<AdjustmentsIcon />}
              label="Adjustments"
              onClick={() => handleToolClick('adjust')}
              isActive={activeTool === 'adjust'}
              disabled={!hasImage}
            />
             <IconButton
              icon={<FilterIcon />}
              label="Filters"
              onClick={() => handleToolClick('filters')}
              isActive={activeTool === 'filters'}
              disabled={!hasImage}
            />
             <IconButton
              icon={<CropIcon />}
              label="Crop"
              onClick={() => handleToolClick('crop')}
              isActive={activeTool === 'crop'}
              disabled={!hasImage}
            />
             <IconButton
              icon={<RotateIcon />}
              label="Rotate"
              onClick={() => handleToolClick('rotate')}
              isActive={activeTool === 'rotate'}
              disabled={!hasImage}
            />
             <IconButton
              icon={<FlipIcon />}
              label="Flip"
              onClick={() => handleToolClick('flip')}
              isActive={activeTool === 'flip'}
              disabled={!hasImage}
            />
          </div>
        </ToolSection>

        {hasImage && (
          <div className="px-4 py-2 transition-all duration-300 ease-in-out">
            {activeTool === 'adjust' && (
              <div className="space-y-4 animate-fade-in">
                <Slider
                  label="Brightness"
                  value={filters.brightness}
                  onChange={(e) => setFilters({ ...filters, brightness: +e.target.value })}
                  min={0}
                  max={200}
                />
                <Slider
                  label="Contrast"
                  value={filters.contrast}
                  onChange={(e) => setFilters({ ...filters, contrast: +e.target.value })}
                  min={0}
                  max={200}
                />
                <Slider
                  label="Saturation"
                  value={filters.saturation}
                  onChange={(e) => setFilters({ ...filters, saturation: +e.target.value })}
                  min={0}
                  max={200}
                />
              </div>
            )}
             {activeTool === 'filters' && (
              <div className="space-y-2 animate-fade-in">
                <div className="grid grid-cols-2 gap-2">
                  {(Object.keys(PRESET_FILTERS) as PresetFilter[]).map((preset) => (
                    <button
                      key={preset}
                      onClick={() => setFilters(f => ({ ...f, preset: preset === f.preset ? 'none' : preset }))}
                      className={`p-2 rounded-md text-sm font-medium capitalize text-center transition-colors ${
                        filters.preset === preset
                          ? 'bg-cyan-500/30 text-cyan-300 ring-2 ring-cyan-400'
                          : 'bg-gray-700/50 hover:bg-gray-600/50 text-gray-300'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>
            )}
             {activeTool === 'rotate' && (
                <div className="space-y-2 animate-fade-in">
                    <IconButton icon={<RotateIcon className="transform -scale-x-100" />} label="Rotate Left" onClick={() => handleRotate(-90)} />
                    <IconButton icon={<RotateIcon />} label="Rotate Right" onClick={() => handleRotate(90)} />
                </div>
            )}
            {activeTool === 'flip' && (
                <div className="space-y-2 animate-fade-in">
                     <IconButton icon={<FlipIcon className="transform -rotate-90"/>} label="Flip Horizontal" onClick={() => handleFlip('horizontal')} />
                     <IconButton icon={<FlipIcon />} label="Flip Vertical" onClick={() => handleFlip('vertical')} />
                </div>
            )}
          </div>
        )}
      </div>

       {(isFilterToolActive || isCropToolActive) && (
        <div className="p-4 border-t border-gray-700">
          <button
            onClick={isCropToolActive ? applyCrop : applyFilters}
            className="w-full flex items-center justify-center bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-2 px-4 rounded-md transition-colors duration-200 disabled:bg-gray-500 disabled:cursor-not-allowed"
            disabled={!hasImage || (isCropToolActive && !crop)}
          >
            <CheckIcon className="w-5 h-5 mr-2" />
            {isCropToolActive ? 'Apply Crop' : 'Apply Changes'}
          </button>
        </div>
      )}
    </aside>
  );
};
