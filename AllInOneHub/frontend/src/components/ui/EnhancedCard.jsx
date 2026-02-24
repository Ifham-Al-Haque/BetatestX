import React from 'react';
import { motion } from 'framer-motion';

const EnhancedCard = ({ 
  children, 
  className = '', 
  hover = true, 
  glow = false,
  glass = false,
  animated = false,
  ...props 
}) => {
  const baseClasses = 'enhanced-card';
  const glassClasses = glass ? 'glass-card' : '';
  const glowClasses = glow ? 'hover-glow' : '';
  const animatedClasses = animated ? 'animated-bg' : '';
  
  const cardClasses = [
    baseClasses,
    glassClasses,
    glowClasses,
    animatedClasses,
    hover ? 'cursor-pointer' : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <motion.div
      className={cardClasses}
      whileHover={hover ? { y: -2 } : {}}
      whileTap={hover ? { y: 0 } : {}}
      transition={{ duration: 0.2 }}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export default EnhancedCard;
