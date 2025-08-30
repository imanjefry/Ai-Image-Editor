export type Tool = 'adjust' | 'rotate' | 'flip' | 'ai' | 'crop' | 'filters' | 'text' | 'layer';

export const PRESET_FILTERS = {
  none: 'none',
  sepia: 'sepia(100%)',
  grayscale: 'grayscale(100%)',
  vintage: 'sepia(60%) contrast(75%) brightness(120%) saturate(120%)',
  invert: 'invert(100%)',
  sunny: 'saturate(150%) brightness(110%) sepia(20%)',
  cool: 'contrast(110%) saturate(150%) hue-rotate(180deg)',
  noir: 'grayscale(100%) contrast(150%) brightness(90%)',
  lomo: 'saturate(160%) contrast(140%)',
  dreamy: 'saturate(120%) blur(1px) contrast(90%)',
  faded: 'contrast(80%) brightness(115%) saturate(80%)',
} as const;

export const FONT_FACES = [
    'Arial',
    'Verdana',
    'Georgia',
    'Times New Roman',
    'Courier New',
    'Lucida Console',
    'Impact',
    'Comic Sans MS',
] as const;

// FIX: Replaced 'normal' with 'source-over' to be compatible with the CanvasRenderingContext2D.globalCompositeOperation property. This resolves the type error in App.tsx.
export const BLEND_MODES = [
    'source-over',
    'multiply',
    'screen',
    'overlay',
    'darken',
    'lighten',
    'color-dodge',
    'color-burn',
    'hard-light',
    'soft-light',
] as const;

export type PresetFilter = keyof typeof PRESET_FILTERS;
export type FontFace = typeof FONT_FACES[number];
export type BlendMode = typeof BLEND_MODES[number];

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

export interface TextOverlay {
    text: string;
    font: FontFace;
    size: number;
    color: string;
    x: number;
    y: number;
}

export interface OverlayImage {
    id: string;
    src: string;
    options: {
        opacity: number;
        blendMode: BlendMode;
        x: number;
        y: number;
        width: number;
        height: number;
    };
}