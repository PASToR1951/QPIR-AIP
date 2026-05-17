import React, { useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { MeshGradient } from '@paper-design/shaders-react';

export default function InteractiveShaderCard({ icon: Icon, className = '' }) {
  const ref = useRef(null);

  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const springX = useSpring(x, { stiffness: 150, damping: 18, mass: 0.6 });
  const springY = useSpring(y, { stiffness: 150, damping: 18, mass: 0.6 });

  const rotateX = useTransform(springY, [-0.5, 0.5], ['10deg', '-10deg']);
  const rotateY = useTransform(springX, [-0.5, 0.5], ['-10deg', '10deg']);

  const iconX = useTransform(springX, [-0.5, 0.5], ['-14px', '14px']);
  const iconY = useTransform(springY, [-0.5, 0.5], ['-14px', '14px']);
  const iconScale = useTransform(springX, [-0.5, 0, 0.5], [1.04, 1, 1.04]);

  const glareX = useTransform(springX, [-0.5, 0.5], ['0%', '100%']);
  const glareY = useTransform(springY, [-0.5, 0.5], ['0%', '100%']);
  const glareBg = useTransform(
    [glareX, glareY],
    ([gx, gy]) => `radial-gradient(circle at ${gx} ${gy}, rgba(255,255,255,0.55), transparent 55%)`
  );

  const handleMouseMove = (e) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    x.set((e.clientX - rect.left) / rect.width - 0.5);
    y.set((e.clientY - rect.top) / rect.height - 0.5);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ rotateX, rotateY, transformStyle: 'preserve-3d', transformPerspective: 1000 }}
      className={`hero-card-animate hidden lg:flex flex-shrink-0 w-72 h-72 relative cursor-pointer ${className}`}
    >
      <motion.div
        style={{ transform: 'translateZ(-40px)' }}
        className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl opacity-20 dark:opacity-30 blur-md"
      />

      <div className="absolute inset-0 bg-white dark:bg-dark-base border border-slate-200 dark:border-dark-border rounded-3xl shadow-xl flex items-center justify-center overflow-hidden isolate">
        <MeshGradient
          className="absolute inset-0 w-full h-full rounded-3xl opacity-55 dark:opacity-50"
          colors={['#c7d2fe', '#a5b4fc', '#818cf8', '#8b5cf6', '#c084fc']}
          distortion={0.9}
          swirl={0.7}
          speed={0.55}
        />

        <div
          className="absolute inset-0 rounded-3xl opacity-[0.07]"
          style={{
            backgroundImage: 'radial-gradient(#4f46e5 2px, transparent 2px)',
            backgroundSize: '24px 24px',
          }}
        />

        <motion.div
          style={{ background: glareBg }}
          className="absolute inset-0 rounded-3xl pointer-events-none mix-blend-overlay"
        />

        <motion.div
          style={{ x: iconX, y: iconY, scale: iconScale, transform: 'translateZ(60px)' }}
          className="relative z-10 drop-shadow-[0_12px_28px_rgba(49,46,129,0.55)]"
        >
          <Icon size={104} weight="fill" className="text-white" />
        </motion.div>
      </div>
    </motion.div>
  );
}
