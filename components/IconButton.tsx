
import React from 'react';

interface IconButtonProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  isActive?: boolean;
  disabled?: boolean;
}

export const IconButton: React.FC<IconButtonProps> = ({ icon, label, onClick, isActive = false, disabled = false }) => {
  const baseClasses = "w-full flex items-center text-left p-2 rounded-md transition-all duration-200 ease-in-out text-sm font-medium";
  const activeClasses = "bg-cyan-500/20 text-cyan-300";
  const inactiveClasses = "text-gray-300 hover:bg-gray-700/50 hover:text-white";
  const disabledClasses = "opacity-50 cursor-not-allowed";

  const classes = `${baseClasses} ${isActive ? activeClasses : inactiveClasses} ${disabled ? disabledClasses : ''}`;

  return (
    <button onClick={onClick} className={classes} disabled={disabled}>
      <span className="w-5 h-5 mr-3">{icon}</span>
      {label}
    </button>
  );
};
