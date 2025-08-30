import React from 'react';
import type { Tool, Filter, Crop, PresetFilter, TextOverlay, FontFace, OverlayImage, BlendMode } from '../types';
import { PRESET_FILTERS, FONT_FACES, BLEND_MODES } from '../types';
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
  TextIcon,
  LayerIcon,
  TrashIcon,
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
  textOverlay: TextOverlay | null;
  setTextOverlay: React.Dispatch<React.SetStateAction<TextOverlay | null>>;
  applyText: () => void;
  overlays: OverlayImage[];
  activeOverlayId: string | null;
  setActiveOverlayId: (id: string | null) => void;
  updateOverlayOptions: (id: string, options: Partial<OverlayImage['options']>) => void;
  deleteOverlay: (id: string) => void;
  onUploadOverlay: () => void;
  applyOverlays: () => void;
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
  textOverlay,
  setTextOverlay,
  applyText,
  overlays,
  activeOverlayId,
  setActiveOverlayId,
  updateOverlayOptions,
  deleteOverlay,
  onUploadOverlay,
  applyOverlays,
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

  const handleApply = () => {
    switch(activeTool) {
      case 'crop':
        applyCrop();
        break;
      case 'text':
        applyText();
        break;
      case 'layer':
        applyOverlays();
        break;
      case 'adjust':
      case 'rotate':
      case 'flip':
      case 'filters':
        applyFilters();
        break;
    }
  };

  const isApplyToolActive = ['adjust', 'rotate', 'flip', 'filters', 'crop', 'text', 'layer'].includes(activeTool || '');
  const activeOverlay = overlays.find(o => o.id === activeOverlayId);

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
              icon={<LayerIcon />}
              label="Layer"
              onClick={() => handleToolClick('layer')}
              isActive={activeTool === 'layer'}
              disabled={!hasImage}
            />
            <IconButton
              icon={<TextIcon />}
              label="Text"
              onClick={() => handleToolClick('text')}
              isActive={activeTool === 'text'}
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
            {activeTool === 'layer' && (
                <div className="space-y-4 animate-fade-in">
                    <IconButton icon={<UploadIcon />} label="Add Image Layer" onClick={onUploadOverlay} />

                    {overlays.length > 0 && (
                        <div className="space-y-2">
                            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Layers</h4>
                            <ul className="space-y-1 max-h-40 overflow-y-auto pr-1">
                                {overlays.map((ov, index) => (
                                    <li key={ov.id}>
                                        <div 
                                            onClick={() => setActiveOverlayId(ov.id)}
                                            className={`w-full flex items-center justify-between p-2 rounded-md transition-colors text-sm cursor-pointer ${activeOverlayId === ov.id ? 'bg-cyan-500/20 text-cyan-300 ring-1 ring-cyan-400/50' : 'bg-gray-700/50 hover:bg-gray-600/50 text-gray-300'}`}
                                        >
                                            <span>Layer {index + 1}</span>
                                            <button onClick={(e) => { e.stopPropagation(); deleteOverlay(ov.id); }} className="p-1 text-gray-400 hover:text-red-400 rounded-full hover:bg-red-500/20">
                                                <TrashIcon className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                     {activeOverlay && activeOverlayId && (
                        <div className="space-y-4 pt-4 mt-4 border-t border-gray-700/50">
                             <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Selected Layer</h4>
                            <Slider
                                label="Opacity"
                                value={activeOverlay.options.opacity * 100}
                                onChange={(e) => updateOverlayOptions(activeOverlayId, { opacity: +e.target.value / 100 })}
                                min={0}
                                max={100}
                            />
                            <div>
                                <label className="text-xs text-gray-400 mb-1 block">Blend Mode</label>
                                <select
                                    value={activeOverlay.options.blendMode}
                                    onChange={(e) => updateOverlayOptions(activeOverlayId, { blendMode: e.target.value as BlendMode })}
                                    className="w-full p-2 rounded-md bg-gray-700/50 border border-gray-600 focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 transition text-gray-200 capitalize"
                                >
                                    {BLEND_MODES.map(mode => <option key={mode} value={mode}>{mode === 'source-over' ? 'Normal' : mode.replace(/-/g, ' ')}</option>)}
                                </select>
                            </div>
                             <button
                                onClick={() => deleteOverlay(activeOverlayId)}
                                className="w-full flex items-center text-left p-2 rounded-md transition-all duration-200 ease-in-out text-sm font-medium text-red-400 hover:bg-red-500/20 hover:text-red-300"
                            >
                                <TrashIcon className="w-5 h-5 mr-3" />
                                Remove Selected Layer
                            </button>
                        </div>
                    )}
                </div>
            )}
             {activeTool === 'text' && textOverlay && (
              <div className="space-y-4 animate-fade-in">
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Text</label>
                  <input
                    type="text"
                    value={textOverlay.text}
                    onChange={(e) => setTextOverlay({ ...textOverlay, text: e.target.value })}
                    className="w-full p-2 rounded-md bg-gray-700/50 border border-gray-600 focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 transition text-gray-200"
                  />
                </div>
                <div>
                    <label className="text-xs text-gray-400 mb-1 block">Font</label>
                    <select
                        value={textOverlay.font}
                        onChange={(e) => setTextOverlay({ ...textOverlay, font: e.target.value as FontFace })}
                        className="w-full p-2 rounded-md bg-gray-700/50 border border-gray-600 focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 transition text-gray-200"
                    >
                        {FONT_FACES.map(font => <option key={font} value={font}>{font}</option>)}
                    </select>
                </div>
                <Slider
                  label="Size"
                  value={textOverlay.size}
                  onChange={(e) => setTextOverlay({ ...textOverlay, size: +e.target.value })}
                  min={1}
                  max={20}
                />
                 <div>
                    <label className="text-xs text-gray-400 mb-1 block">Color</label>
                    <input
                        type="color"
                        value={textOverlay.color}
                        onChange={(e) => setTextOverlay({ ...textOverlay, color: e.target.value })}
                        className="w-full h-10 p-1 rounded-md bg-gray-700/50 border border-gray-600 cursor-pointer"
                    />
                </div>
              </div>
            )}
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

       {isApplyToolActive && (
        <div className="p-4 border-t border-gray-700">
          <button
            onClick={handleApply}
            className="w-full flex items-center justify-center bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-2 px-4 rounded-md transition-colors duration-200 disabled:bg-gray-500 disabled:cursor-not-allowed"
            disabled={!hasImage || (activeTool === 'crop' && !crop) || (activeTool === 'layer' && overlays.length === 0)}
          >
            <CheckIcon className="w-5 h-5 mr-2" />
            Apply Changes
          </button>
        </div>
      )}
    </aside>
  );
};