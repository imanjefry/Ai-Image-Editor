export type Tool = 'adjust' | 'rotate' | 'flip' | 'ai' | 'crop' | 'filters';

export const PRESET_FILTERS = {
  none: 'none',
  sepia: 'sepia(100%)',
  grayscale: 'grayscale(100%)',
  vintage: 'sepia(60%) contrast(75%) brightness(120%) saturate(120%)',
  invert: 'invert(100%)',
} as const;

export type PresetFilter = keyof typeof PRESET_FILTERS;

export interface Filter {
  brightness: number;
  contrast: number;
  saturation: number;
  rotation: number;
  scaleX: number;
  scaleY: number;
  preset: PresetFilter;
}

export interface ImageDimensions {
  width: number;
  height: number;
}

export interface Crop {
  x: number;
  y: number;
  width: number;
  height: number;
}
