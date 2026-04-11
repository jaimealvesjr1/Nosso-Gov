// Arquivo: src/components/UI.tsx
import React from 'react';

export function NavButton({ icon: Icon, label, active, onClick }: any) { 
  return ( 
    <button onClick={onClick} className={`flex md:flex-row flex-col items-center justify-center md:justify-start p-3 rounded-lg flex-1 md:flex-none transition-colors ${active ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-400 hover:bg-gray-700 hover:text-white'}`}> 
      <Icon className="w-6 h-6 md:w-5 md:h-5 md:mr-3 mb-1 md:mb-0" />
      <span className="text-xs md:text-sm font-medium">{label}</span> 
    </button> 
  ); 
}

export function DataBar({ label, value, icon: Icon, color }: any) { 
  return ( 
    <div> 
      <div className="flex justify-between text-sm mb-1">
        <span className="flex items-center text-gray-300">
          {Icon && <Icon className="w-4 h-4 mr-2" />} 
          {label}
        </span>
        <span className="font-bold">{Math.floor(value)}/100</span>
      </div> 
      <div className="w-full h-3 bg-gray-900 rounded-full overflow-hidden border border-gray-700">
        <div style={{ width: `${Math.min(100, Math.max(0, value))}%` }} className={`h-full ${color} transition-all duration-1000`}></div>
      </div> 
    </div> 
  ); 
}
