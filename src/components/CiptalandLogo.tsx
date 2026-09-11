import React from "react";

export function CiptalandLogo({ size = 48, className = "" }: { size?: number; className?: string }) {
  return (
    <div
      style={{ width: size, height: size }}
      className={`relative inline-flex items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-slate-200/80 p-1 flex-shrink-0 ${className}`}
    >
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="50" cy="50" r="48" fill="#FFFFFF" stroke="#0D9488" strokeWidth="1.5" strokeDasharray="3 2" />
        <circle cx="50" cy="50" r="44" fill="#F0FDFA" stroke="#14B8A6" strokeWidth="1" />
        
        {/* Curved text path */}
        <path
          id="ciptaland-text-path-top"
          d="M 20,50 A 30,30 0 1,1 80,50"
          fill="none"
        />
        <text fontSize="7.5" fontWeight="bold" fill="#0F766E" letterSpacing="0.5">
          <textPath href="#ciptaland-text-path-top" startOffset="50%" textAnchor="middle">
            PERUMAHAN CIPTALAND
          </textPath>
        </text>

        <path
          id="ciptaland-text-path-bottom"
          d="M 80,50 A 30,30 0 0,1 20,50"
          fill="none"
        />
        <text fontSize="5.5" fontWeight="bold" fill="#115E59" letterSpacing="0.3">
          <textPath href="#ciptaland-text-path-bottom" startOffset="50%" textAnchor="middle">
            BLOK MAWAR RT 002 RW 014
          </textPath>
        </text>

        {/* Center Floral Rosette */}
        <g transform="translate(50,50)">
          {/* Outer teal petals */}
          <circle cx="0" cy="-9" r="4" fill="#0D9488" />
          <circle cx="6.4" cy="-6.4" r="4" fill="#0D9488" />
          <circle cx="9" cy="0" r="4" fill="#0D9488" />
          <circle cx="6.4" cy="6.4" r="4" fill="#0D9488" />
          <circle cx="0" cy="9" r="4" fill="#0D9488" />
          <circle cx="-6.4" cy="6.4" r="4" fill="#0D9488" />
          <circle cx="-9" cy="0" r="4" fill="#0D9488" />
          <circle cx="-6.4" cy="-6.4" r="4" fill="#0D9488" />
          
          {/* Inner coral accents */}
          <circle cx="0" cy="-4.5" r="2.2" fill="#E11D48" />
          <circle cx="4.5" cy="0" r="2.2" fill="#E11D48" />
          <circle cx="0" cy="4.5" r="2.2" fill="#E11D48" />
          <circle cx="-4.5" cy="0" r="2.2" fill="#E11D48" />
          
          {/* Center core */}
          <circle cx="0" cy="0" r="3" fill="#042F2E" />
          <circle cx="0" cy="0" r="1.5" fill="#FFFFFF" />
        </g>
      </svg>
    </div>
  );
}
