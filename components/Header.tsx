
import React from 'react';
import { EditIcon } from './icons';

export const Header: React.FC = () => {
  return (
    <header className="bg-gray-900/80 backdrop-blur-sm border-b border-gray-700 p-4 flex items-center shadow-md z-20">
      <EditIcon className="w-8 h-8 text-cyan-400 mr-3" />
      <h1 className="text-2xl font-bold text-gray-100 tracking-wider">
        AI Image Editor
      </h1>
    </header>
  );
};
