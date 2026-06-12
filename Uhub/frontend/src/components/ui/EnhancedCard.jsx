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
  const cardClasses = [
    glass ? 'uhub-card-glass' : 'uhub-card',
    glow ? 'hover-glow' : '',
    animated ? 'animated-bg' : '',
    hover ? 'cursor-pointer' : '',
    'p-6',
    className,
  ]
    .filter(Boolean)
    .join(' ');

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
