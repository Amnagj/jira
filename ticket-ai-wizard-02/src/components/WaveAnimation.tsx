
import React from "react";

export const WaveAnimation = () => {
  return (
    <div className="absolute bottom-0 left-0 right-0 pointer-events-none">
      <svg
        className="w-full h-auto"
        viewBox="0 0 1440 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M0,64L48,80C96,96,192,128,288,128C384,128,480,96,576,85.3C672,75,768,85,864,96C960,107,1056,117,1152,112C1248,107,1344,85,1392,74.7L1440,64L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
          fill="url(#paint0_linear)"
          fillOpacity="0.5"
        />
        <path
          d="M0,96L48,85.3C96,75,192,53,288,53.3C384,53,480,75,576,80C672,85,768,75,864,69.3C960,64,1056,64,1152,69.3C1248,75,1344,85,1392,90.7L1440,96L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
          fill="url(#paint1_linear)"
          fillOpacity="0.3"
        />
        <defs>
          <linearGradient
            id="paint0_linear"
            x1="720"
            y1="64"
            x2="720"
            y2="320"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#3b82f6" />
            <stop offset="1" stopColor="#3b82f6" stopOpacity="0" />
          </linearGradient>
          <linearGradient
            id="paint1_linear"
            x1="720"
            y1="53.3"
            x2="720"
            y2="320"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#2563eb" />
            <stop offset="1" stopColor="#2563eb" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
};
