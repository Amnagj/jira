
import React from 'react';
import { motion } from 'framer-motion';

export const GlowingOrb: React.FC<{
  className?: string;
  size?: number;
  color?: string;
}> = ({ className, size = 70, color = "#3b82f6" }) => {
  return (
    <motion.div
      className={`absolute rounded-full blur-2xl opacity-20 ${className}`}
      animate={{
        scale: [1, 1.1, 1],
        opacity: [0.2, 0.3, 0.2],
      }}
      transition={{
        duration: 8,
        repeat: Infinity,
        ease: "easeInOut"
      }}
      style={{
        width: size,
        height: size,
        background: color,
      }}
    />
  );
};

export const ShootingStar: React.FC<{
  className?: string;
}> = ({ className }) => {
  return (
    <motion.div
      className={`absolute h-0.5 bg-gradient-to-r from-blue-200 via-white to-transparent ${className}`}
      initial={{ width: 0, opacity: 0 }}
      animate={{ 
        width: ["0%", "15%", "0%"],
        opacity: [0, 0.7, 0],
        x: ["0%", "100%"],
        y: ["0%", "100%"],
      }}
      transition={{
        duration: Math.random() * 2 + 2,
        repeat: Infinity,
        repeatDelay: Math.random() * 10 + 5,
      }}
    />
  );
};

export const Planet: React.FC<{
  className?: string;
  size?: number;
  color?: string;
}> = ({ className, size = 40, color = "#1e40af" }) => {
  return (
    <motion.div
      className={`absolute rounded-full ${className}`}
      animate={{ rotate: 360 }}
      transition={{ duration: 120, repeat: Infinity, ease: "linear" }}
      style={{
        width: size,
        height: size,
        background: `radial-gradient(circle at 30% 30%, ${color}, #0f172a)`,
        boxShadow: `0 0 20px rgba(59, 130, 246, 0.4)`,
      }}
    />
  );
};

export const Comet: React.FC<{
  className?: string;
}> = ({ className }) => {
  return (
    <motion.div
      className={`absolute ${className}`}
      animate={{
        x: ['-100%', '200%'],
        y: ['0%', '100%'],
        opacity: [0, 0.7, 0],
      }}
      transition={{
        duration: 8,
        repeat: Infinity,
        repeatDelay: 15,
        ease: "easeInOut",
      }}
    >
      <div className="w-2 h-2 rounded-full bg-white shadow-[0_0_10px_5px_rgba(219,234,254,0.5)]" />
      <div className="absolute top-0 right-0 w-20 h-0.5 bg-gradient-to-l from-white via-blue-200 to-transparent transform -rotate-45 origin-left" />
    </motion.div>
  );
};

// Minimal constellation with blue theme
export const Constellation: React.FC<{
  className?: string;
  points?: number;
}> = ({ className, points = 5 }) => {
  // Generate random points for the constellation
  const starPoints = Array.from({ length: points }, () => ({
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 1.5 + 0.5
  }));

  return (
    <div className={`absolute ${className}`} style={{ width: '150px', height: '150px' }}>
      {/* Stars */}
      {starPoints.map((point, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full bg-white"
          style={{
            left: `${point.x}%`,
            top: `${point.y}%`,
            width: `${point.size}px`,
            height: `${point.size}px`,
            boxShadow: '0 0 3px 1px rgba(219, 234, 254, 0.7)'
          }}
          animate={{
            opacity: [0.3, 0.7, 0.3],
          }}
          transition={{
            duration: 2 + Math.random() * 3,
            repeat: Infinity,
            ease: "easeInOut",
            delay: Math.random()
          }}
        />
      ))}
      
      {/* Lines connecting the stars */}
      <svg className="absolute inset-0 w-full h-full">
        {starPoints.map((point, i) => {
          if (i < starPoints.length - 1) {
            const nextPoint = starPoints[i + 1];
            return (
              <motion.line
                key={i}
                x1={`${point.x}%`}
                y1={`${point.y}%`}
                x2={`${nextPoint.x}%`}
                y2={`${nextPoint.y}%`}
                stroke="rgba(219, 234, 254, 0.2)"
                strokeWidth="0.3"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 0.3, 0] }}
                transition={{
                  duration: 5,
                  repeat: Infinity,
                  delay: i * 0.5
                }}
              />
            );
          }
          return null;
        })}
      </svg>
    </div>
  );
};

// Very subtle nebula
export const Nebula: React.FC<{
  className?: string;
  color?: string;
  size?: number;
}> = ({ className, color = "#3b82f6", size = 200 }) => {
  return (
    <motion.div
      className={`absolute rounded-full blur-3xl ${className}`}
      animate={{
        scale: [1, 1.1, 1],
        opacity: [0.05, 0.08, 0.05],
      }}
      transition={{
        duration: 10,
        repeat: Infinity,
        ease: "easeInOut"
      }}
      style={{
        width: size,
        height: size * 0.6,
        background: `radial-gradient(ellipse at center, ${color}15 0%, ${color}08 50%, transparent 100%)`,
        transform: 'rotate(15deg)',
      }}
    />
  );
};

export const CosmicElements: React.FC = () => {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {/* Minimal glowing orbs */}
      <GlowingOrb className="top-[10%] left-[15%]" color="#485bbd" size={140} />
      <GlowingOrb className="bottom-[20%] left-[10%]" color="#3944a0" size={100} />
      
      {/* Small planet */}
      <Planet className="top-[8%] right-[15%]" size={20} color="#8b5cf6" />
      
      {/* A few shooting stars */}
      <ShootingStar className="top-[15%] left-[30%]" />
      
      {/* Very subtle nebula */}
      <Nebula className="top-[30%] left-[60%]" color="#3b82f6" size={250} />
      
      {/* A single constellation for subtle detail */}
      <Constellation className="top-[45%] right-[25%]" points={4} />
    </div>
  );
};

export default CosmicElements;
