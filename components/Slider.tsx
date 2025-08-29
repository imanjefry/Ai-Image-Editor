
import React from 'react';

interface SliderProps {
  label: string;
  value: number;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  min?: number;
  max?: number;
}

export const Slider: React.FC<SliderProps> = ({ label, value, onChange, min = 0, max = 100 }) => {
  return (
    <div className="w-full">
      <label className="flex justify-between items-center text-xs text-gray-400 mb-1">
        <span>{label}</span>
        <span>{value}</span>
      </label>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={onChange}
        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider-thumb"
        style={{
          '--thumb-color': '#22d3ee'
        } as React.CSSProperties}
      />
      <style>{`
        .slider-thumb::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 16px;
          height: 16px;
          background: var(--thumb-color);
          border-radius: 50%;
          cursor: pointer;
          border: 2px solid #111827;
        }
        .slider-thumb::-moz-range-thumb {
          width: 16px;
          height: 16px;
          background: var(--thumb-color);
          border-radius: 50%;
          cursor: pointer;
          border: 2px solid #111827;
        }
      `}</style>
    </div>
  );
};
