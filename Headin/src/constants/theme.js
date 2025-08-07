export const theme = {
  colors: {
    // Black & Gold Modern Theme
    primary: '#FFD700',           // Gold
    primaryDark: '#FFA500',       // Darker gold
    primaryLight: '#FFF8DC',      // Light gold
    
    background: '#000000',        // Pure black
    surface: '#1A1A1A',          // Dark surface
    surfaceLight: '#2D2D2D',     // Lighter surface
    
    text: '#FFFFFF',             // White text
    textSecondary: '#B8B8B8',    // Gray text
    textMuted: '#808080',        // Muted text
    
    accent: '#FFD700',           // Gold accent
    success: '#32D74B',          // Green
    error: '#FF3B30',            // Red
    warning: '#FF9500',          // Orange
    
    border: '#333333',           // Dark border
    shadow: 'rgba(255, 215, 0, 0.3)', // Gold shadow
    
    // Gradients
    goldGradient: ['#FFD700', '#FFA500'],
    blackGradient: ['#000000', '#1A1A1A'],
    accentGradient: ['#FFD700', '#FFED4A'],
  },
  
  typography: {
    // Font families
    fontFamily: {
      regular: 'System',
      medium: 'System',
      bold: 'System',
      black: 'System',
    },
    
    // Font sizes
    fontSize: {
      xs: 12,
      sm: 14,
      base: 16,
      lg: 18,
      xl: 20,
      '2xl': 24,
      '3xl': 30,
      '4xl': 36,
      '5xl': 48,
    },
    
    // Font weights
    fontWeight: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
      extrabold: '800',
      black: '900',
    },
    
    // Line heights
    lineHeight: {
      tight: 1.2,
      normal: 1.4,
      relaxed: 1.6,
    },
  },
  
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    '2xl': 48,
    '3xl': 64,
  },
  
  borderRadius: {
    sm: 6,
    md: 12,
    lg: 16,
    xl: 24,
    full: 9999,
  },
  
  shadows: {
    sm: {
      shadowColor: '#FFD700',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    md: {
      shadowColor: '#FFD700',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 4,
    },
    lg: {
      shadowColor: '#FFD700',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.2,
      shadowRadius: 16,
      elevation: 8,
    },
  },
  
  // Component-specific styles
  components: {
    button: {
      primary: {
        backgroundColor: '#FFD700',
        color: '#000000',
      },
      secondary: {
        backgroundColor: 'transparent',
        borderColor: '#FFD700',
        borderWidth: 2,
        color: '#FFD700',
      },
      ghost: {
        backgroundColor: 'transparent',
        color: '#FFFFFF',
      },
    },
    
    card: {
      backgroundColor: '#1A1A1A',
      borderColor: '#333333',
      borderWidth: 1,
    },
    
    input: {
      backgroundColor: '#1A1A1A',
      borderColor: '#333333',
      placeholderColor: '#808080',
      color: '#FFFFFF',
    },
  },
};