import React from 'react';

const UaePlate = ({ plate, size = 'md' }) => {
  const compact = size === 'sm';
  return (
    <div className={`inline-flex items-stretch rounded-md overflow-hidden border-2 border-slate-800 max-w-full ${compact ? '' : 'shadow-sm'}`}>
      <div className={`${compact ? 'w-5' : 'w-7'} bg-white border-r border-slate-300 flex flex-col overflow-hidden shrink-0`}>
        <div className={compact ? 'h-1 bg-red-600' : 'h-1.5 bg-red-600'} />
        <div className="flex-1 flex items-center justify-center bg-white">
          <span className={`${compact ? 'text-[7px]' : 'text-[8px]'} font-black text-green-700 leading-none`}>UAE</span>
        </div>
        <div className={compact ? 'h-1 bg-black' : 'h-1.5 bg-black'} />
      </div>
      <div className={`bg-white ${compact ? 'px-1.5 py-0.5 min-w-[4.5rem]' : 'px-2.5 py-1 min-w-[6rem]'}`}>
        <p className={`${compact ? 'text-[10px] tracking-[0.12em]' : 'text-[11px] tracking-[0.16em]'} font-black text-slate-900 uppercase text-center truncate`}>
          {plate || 'NO PLATE'}
        </p>
      </div>
    </div>
  );
};

export default UaePlate;
