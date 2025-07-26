import { useState, useEffect } from 'react';

// Breakpoint definitions (matching Tailwind CSS)
export const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
};

// Custom hook for responsive design
export const useResponsive = () => {
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1024,
    height: typeof window !== 'undefined' ? window.innerHeight : 768,
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);
    
    // Set initial size
    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = windowSize.width < BREAKPOINTS.md;
  const isTablet = windowSize.width >= BREAKPOINTS.md && windowSize.width < BREAKPOINTS.lg;
  const isDesktop = windowSize.width >= BREAKPOINTS.lg;
  const isLargeDesktop = windowSize.width >= BREAKPOINTS.xl;

  const isSmallScreen = windowSize.width < BREAKPOINTS.sm;
  const isMediumScreen = windowSize.width >= BREAKPOINTS.md && windowSize.width < BREAKPOINTS.lg;
  const isLargeScreen = windowSize.width >= BREAKPOINTS.lg;

  return {
    windowSize,
    isMobile,
    isTablet,
    isDesktop,
    isLargeDesktop,
    isSmallScreen,
    isMediumScreen,
    isLargeScreen,
    breakpoints: BREAKPOINTS,
  };
};

// Responsive grid configurations
export const getResponsiveGrid = (isMobile, isTablet, isDesktop) => {
  if (isMobile) {
    return {
      performers: 'grid-cols-2 gap-3',
      stats: 'grid-cols-2 gap-4',
      dashboard: 'grid-cols-1 gap-6',
      forms: 'grid-cols-1 gap-4',
    };
  } else if (isTablet) {
    return {
      performers: 'grid-cols-3 gap-4',
      stats: 'grid-cols-2 gap-4',
      dashboard: 'grid-cols-2 gap-6',
      forms: 'grid-cols-1 gap-4',
    };
  } else {
    return {
      performers: 'grid-cols-4 xl:grid-cols-6 gap-4',
      stats: 'grid-cols-4 gap-6',
      dashboard: 'grid-cols-2 gap-8',
      forms: 'grid-cols-2 gap-6',
    };
  }
};

// Responsive spacing utilities
export const getResponsiveSpacing = (isMobile, isTablet) => {
  if (isMobile) {
    return {
      container: 'px-4 py-4',
      section: 'mb-6',
      card: 'p-4',
      header: 'px-4 py-3',
      modal: 'mx-4',
    };
  } else if (isTablet) {
    return {
      container: 'px-6 py-6',
      section: 'mb-8',
      card: 'p-5',
      header: 'px-6 py-4',
      modal: 'mx-8',
    };
  } else {
    return {
      container: 'px-6 py-8',
      section: 'mb-8',
      card: 'p-6',
      header: 'px-6 py-4',
      modal: '',
    };
  }
};

// Responsive text sizes
export const getResponsiveText = (isMobile, isTablet) => {
  if (isMobile) {
    return {
      h1: 'text-2xl font-bold',
      h2: 'text-xl font-semibold',
      h3: 'text-lg font-semibold',
      body: 'text-sm',
      small: 'text-xs',
      button: 'text-sm',
    };
  } else if (isTablet) {
    return {
      h1: 'text-3xl font-bold',
      h2: 'text-2xl font-semibold',
      h3: 'text-xl font-semibold',
      body: 'text-base',
      small: 'text-sm',
      button: 'text-base',
    };
  } else {
    return {
      h1: 'text-4xl font-bold',
      h2: 'text-3xl font-semibold',
      h3: 'text-2xl font-semibold',
      body: 'text-base',
      small: 'text-sm',
      button: 'text-base',
    };
  }
};

// Responsive layout utilities
export const getResponsiveLayout = (isMobile, isTablet) => {
  return {
    sidebar: {
      show: !isMobile,
      width: isMobile ? 'w-full' : isTablet ? 'w-56' : 'w-64',
      position: isMobile ? 'fixed bottom-0 left-0 right-0 z-50' : 'sticky top-0 h-screen',
    },
    header: {
      height: 'h-16',
      mobile: isMobile,
      showSearch: !isMobile,
      showFullMenu: !isMobile,
    },
    main: {
      padding: isMobile ? 'p-4' : isTablet ? 'p-6' : 'p-8',
      marginLeft: isMobile ? 'ml-0' : isTablet ? 'ml-56' : 'ml-64',
      marginBottom: isMobile ? 'mb-20' : 'mb-0', // Account for mobile bottom nav
    },
    modal: {
      size: isMobile ? 'max-w-full mx-4' : isTablet ? 'max-w-lg' : 'max-w-2xl',
      padding: isMobile ? 'p-4' : 'p-6',
    },
  };
};

// Mobile navigation utilities
export const getMobileNavigation = (isMobile) => {
  if (!isMobile) return null;
  
  return {
    show: true,
    position: 'fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-700 z-50',
    itemClass: 'flex-1 py-3 px-2 text-center',
    iconSize: 'w-6 h-6',
    textSize: 'text-xs',
  };
};

// Responsive component configurations
export const getComponentConfig = (componentType, isMobile, isTablet, isDesktop) => {
  const configs = {
    performerCard: {
      mobile: {
        imageHeight: 'h-32',
        padding: 'p-2',
        textSize: 'text-xs',
        showDetails: false,
      },
      tablet: {
        imageHeight: 'h-40',
        padding: 'p-3',
        textSize: 'text-sm',
        showDetails: true,
      },
      desktop: {
        imageHeight: 'h-48',
        padding: 'p-3',
        textSize: 'text-sm',
        showDetails: true,
      },
    },
    
    statsCard: {
      mobile: {
        padding: 'p-4',
        iconSize: 'w-8 h-8',
        valueSize: 'text-xl',
        labelSize: 'text-xs',
      },
      tablet: {
        padding: 'p-5',
        iconSize: 'w-10 h-10',
        valueSize: 'text-2xl',
        labelSize: 'text-sm',
      },
      desktop: {
        padding: 'p-6',
        iconSize: 'w-12 h-12',
        valueSize: 'text-2xl',
        labelSize: 'text-sm',
      },
    },
    
    tokenPackage: {
      mobile: {
        padding: 'p-3',
        spacing: 'space-y-2',
        buttonSize: 'text-sm py-2',
      },
      tablet: {
        padding: 'p-4',
        spacing: 'space-y-3',
        buttonSize: 'text-base py-3',
      },
      desktop: {
        padding: 'p-4',
        spacing: 'space-y-3',
        buttonSize: 'text-base py-3',
      },
    },
    
    modal: {
      mobile: {
        size: 'max-w-full mx-4 my-8',
        padding: 'p-4',
        titleSize: 'text-xl',
      },
      tablet: {
        size: 'max-w-lg mx-auto my-12',
        padding: 'p-6',
        titleSize: 'text-2xl',
      },
      desktop: {
        size: 'max-w-2xl mx-auto my-16',
        padding: 'p-8',
        titleSize: 'text-3xl',
      },
    },
  };

  const config = configs[componentType];
  if (!config) return {};

  if (isMobile) return config.mobile;
  if (isTablet) return config.tablet;
  return config.desktop;
};

// Utility function to conditionally apply classes based on screen size
export const responsiveClass = (mobileClass, tabletClass, desktopClass, currentSize) => {
  const { isMobile, isTablet } = currentSize;
  
  if (isMobile) return mobileClass;
  if (isTablet) return tabletClass;
  return desktopClass;
};

// Touch-friendly utilities for mobile
export const getTouchConfig = (isMobile) => {
  if (!isMobile) return {};
  
  return {
    minTouchTarget: 'min-h-[44px] min-w-[44px]', // 44px is iOS recommended minimum
    tapHighlight: 'active:bg-opacity-75',
    scrollable: 'overflow-x-auto scrollbar-hide',
    swipeable: 'touch-pan-x',
  };
};

// Responsive image configurations
export const getImageConfig = (isMobile, isTablet) => {
  return {
    avatar: {
      small: isMobile ? 'w-8 h-8' : 'w-10 h-10',
      medium: isMobile ? 'w-12 h-12' : isTablet ? 'w-16 h-16' : 'w-20 h-20',
      large: isMobile ? 'w-20 h-20' : isTablet ? 'w-24 h-24' : 'w-32 h-32',
    },
    performer: {
      card: isMobile ? 'h-32' : isTablet ? 'h-40' : 'h-48',
      hero: isMobile ? 'h-48' : isTablet ? 'h-64' : 'h-80',
    },
    logo: {
      header: isMobile ? 'h-8' : 'h-10',
      splash: isMobile ? 'h-16' : isTablet ? 'h-20' : 'h-24',
    },
  };
};

export default {
  useResponsive,
  getResponsiveGrid,
  getResponsiveSpacing,
  getResponsiveText,
  getResponsiveLayout,
  getMobileNavigation,
  getComponentConfig,
  responsiveClass,
  getTouchConfig,
  getImageConfig,
  BREAKPOINTS,
};