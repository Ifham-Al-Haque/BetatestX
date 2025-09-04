import { useState, useEffect } from 'react';

export const useSidebarAnimation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);

  // Handle scroll-based animations
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Add subtle animation based on scroll direction
      if (Math.abs(currentScrollY - lastScrollY) > 10) {
        setIsAnimating(true);
        setTimeout(() => setIsAnimating(false), 300);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (event) => {
      // Toggle sidebar with Ctrl/Cmd + B
      if ((event.ctrlKey || event.metaKey) && event.key === 'b') {
        event.preventDefault();
        setIsOpen(prev => !prev);
      }
      
      // Close sidebar with Escape
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [isOpen]);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      const sidebar = document.querySelector('[data-sidebar]');
      const menuButton = document.querySelector('[data-menu-button]');
      
      if (
        isOpen &&
        sidebar &&
        !sidebar.contains(event.target) &&
        menuButton &&
        !menuButton.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const toggleSidebar = () => {
    setIsOpen(prev => !prev);
  };

  const closeSidebar = () => {
    setIsOpen(false);
  };

  return {
    isOpen,
    isAnimating,
    toggleSidebar,
    closeSidebar,
    setIsOpen
  };
};

// Animation presets for different elements
export const animationPresets = {
  // Sidebar slide animation
  sidebar: {
    closed: {
      x: "-100%",
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30
      }
    },
    open: {
      x: 0,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30
      }
    }
  },

  // Menu button animations
  menuButton: {
    initial: { scale: 1 },
    hover: { scale: 1.1 },
    tap: { scale: 0.95 }
  },

  // Navigation item animations
  navItem: {
    initial: { x: -20, opacity: 0 },
    animate: { x: 0, opacity: 1 },
    hover: { 
      x: 5,
      transition: { type: "spring", stiffness: 400, damping: 10 }
    }
  },

  // Logo animations
  logo: {
    initial: { scale: 0.8, opacity: 0 },
    animate: { 
      scale: 1, 
      opacity: 1,
      transition: { delay: 0.1, type: "spring", stiffness: 200 }
    }
  },

  // User info animations
  userInfo: {
    initial: { y: 20, opacity: 0 },
    animate: { 
      y: 0, 
      opacity: 1,
      transition: { delay: 0.2, type: "spring", stiffness: 200 }
    }
  },

  // Overlay animations
  overlay: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 }
  },

  // Icon animations
  icon: {
    hover: { rotate: 5 },
    tap: { scale: 0.9 }
  },

  // Active indicator animations
  activeIndicator: {
    initial: { opacity: 0, scaleY: 0 },
    animate: { opacity: 1, scaleY: 1 },
    transition: { duration: 0.3, ease: "easeOut" }
  },

  // Hover effect animations
  hoverEffect: {
    initial: { opacity: 0, scale: 0.8 },
    hover: { opacity: 1, scale: 1 },
    transition: { duration: 0.2 }
  }
};

// Utility functions for animations
export const animationUtils = {
  // Stagger children animation
  staggerContainer: {
    initial: "initial",
    animate: "animate",
    transition: { staggerChildren: 0.1 }
  },

  // Delayed animation
  delayedAnimation: (delay = 0) => ({
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { delay, duration: 0.5 }
  }),

  // Spring animation
  springAnimation: (stiffness = 300, damping = 30) => ({
    transition: { type: "spring", stiffness, damping }
  }),

  // Fade animation
  fadeAnimation: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 }
  },

  // Scale animation
  scaleAnimation: {
    initial: { scale: 0.8 },
    animate: { scale: 1 },
    hover: { scale: 1.05 },
    tap: { scale: 0.95 }
  }
}; 