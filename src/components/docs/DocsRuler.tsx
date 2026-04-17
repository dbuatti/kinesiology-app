"use client";

import React from 'react';

const DocsRuler = () => {
  return (
    <div className="bg-[#F9FBFD] h-8 border-b border-slate-200 relative flex items-end print:hidden">
      <div className="absolute left-1/2 -translate-x-1/2 w-[816px] h-full flex items-end px-12">
        <div className="w-full h-4 flex items-end justify-between text-[9px] text-slate-400 font-medium pb-0.5">
          {[2, 1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18].map((num, i) => (
            <div key={i} className="relative flex flex-col items-center">
              <div className="h-1.5 w-px bg-slate-300 mb-0.5" />
              <span>{num}</span>
              {/* Blue markers for margins */}
              {num === 0 && i === 2 && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[8px] border-t-blue-600" />
              )}
              {num === 16 && i === 18 && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[8px] border-t-blue-600" />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DocsRuler;