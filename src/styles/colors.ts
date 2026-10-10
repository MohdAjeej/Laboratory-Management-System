/**
 * LIMS Color Palette - Healthcare Professional Theme
 * Inspired by medical and telemedicine standards
 * Primary: Blue (trust, security, professionalism)
 * Secondary: White (cleanliness, clarity)
 * Accent: Red (urgency, importance, alerts)
 */

export const colors = {
  // Primary Blue Palette - Trust & Professionalism
  primary: {
    50: '#E3F2FD',   // Lightest blue for backgrounds
    100: '#BBDEFB',  // Very light blue
    200: '#90CAF9',  // Light blue for hover states
    300: '#64B5F6',  // Medium light blue
    400: '#42A5F5',  // Medium blue
    500: '#2196F3',  // Main primary blue - trust & security
    600: '#1E88E5',  // Darker blue for emphasis
    700: '#1976D2',  // Deep blue for headers
    800: '#1565C0',  // Very dark blue
    900: '#0D47A1',  // Darkest blue for text
  },

  // Medical Blue (alternative)
  medical: {
    light: '#47ABD8',    // Summer Sky - light medical blue
    main: '#3C85C4',     // Aquarius - professional medical blue
    dark: '#1974D1',     // Deep medical blue
    darker: '#0D47A1',   // Navy medical
  },

  // White & Neutral Palette - Cleanliness & Clarity
  neutral: {
    white: '#FFFFFF',     // Pure white
    50: '#FAFAFA',        // Off-white background
    100: '#F5F5F5',       // Light gray background
    200: '#EEEEEE',       // Very light gray
    300: '#E0E0E0',       // Light gray borders
    400: '#BDBDBD',       // Medium gray
    500: '#9E9E9E',       // Gray text
    600: '#757575',       // Dark gray text
    700: '#616161',       // Darker gray text
    800: '#424242',       // Very dark gray
    900: '#212121',       // Almost black
  },

  // Red Accent Palette - Urgency & Alerts
  accent: {
    50: '#FFEBEE',       // Lightest red for backgrounds
    100: '#FFCDD2',      // Very light red
    200: '#EF9A9A',      // Light red
    300: '#E57373',      // Medium light red
    400: '#EF5350',      // Medium red
    500: '#F44336',      // Main accent red - alerts & critical
    600: '#E53935',      // Darker red
    700: '#D32F2F',      // Deep red for errors
    800: '#C62828',      // Very dark red
    900: '#B71C1C',      // Darkest red for critical alerts
  },

  // Medical Red (softer alternative)
  warning: {
    light: '#FF4242',    // Coral red - warnings
    main: '#D01B1B',     // Romantic kiss - important
    dark: '#AD1115',     // Midnight red - critical
    darker: '#850102',   // Maroon - severe
  },

  // Success Green (complementary)
  success: {
    light: '#81C784',
    main: '#4CAF50',
    dark: '#388E3C',
  },

  // Information Cyan (complementary)
  info: {
    light: '#4FC3F7',
    main: '#29B6F6',
    dark: '#0288D1',
  },

  // Warning Orange (complementary)
  caution: {
    light: '#FFB74D',
    main: '#FF9800',
    dark: '#F57C00',
  },

  // Semantic Colors
  semantic: {
    error: '#D32F2F',
    warning: '#F57C00',
    info: '#1976D2',
    success: '#388E3C',
  },

  // Background Colors
  background: {
    default: '#FAFAFA',      // Main background
    paper: '#FFFFFF',        // Card/paper background
    sidebar: '#1976D2',      // Sidebar background (primary blue)
    header: '#1565C0',       // Header background (darker blue)
    footer: '#424242',       // Footer background (dark gray)
  },

  // Text Colors
  text: {
    primary: '#212121',      // Main text
    secondary: '#757575',    // Secondary text
    disabled: '#BDBDBD',     // Disabled text
    hint: '#9E9E9E',         // Hint text
    inverse: '#FFFFFF',      // White text on dark backgrounds
  },

  // Border Colors
  border: {
    light: '#E0E0E0',
    main: '#BDBDBD',
    dark: '#757575',
  },

  // Status Colors
  status: {
    pending: '#FF9800',      // Orange
    inProgress: '#2196F3',   // Blue
    completed: '#4CAF50',    // Green
    cancelled: '#F44336',    // Red
    urgent: '#D32F2F',       // Dark red
    critical: '#B71C1C',     // Darkest red
  },

  // Component-specific Colors
  components: {
    // Buttons
    buttonPrimary: '#2196F3',
    buttonPrimaryHover: '#1E88E5',
    buttonSecondary: '#FFFFFF',
    buttonSecondaryHover: '#F5F5F5',
    buttonDanger: '#F44336',
    buttonDangerHover: '#E53935',

    // Inputs
    inputBackground: '#FFFFFF',
    inputBorder: '#E0E0E0',
    inputBorderFocus: '#2196F3',
    inputText: '#212121',
    inputPlaceholder: '#9E9E9E',

    // Tables
    tableHeader: '#1976D2',
    tableHeaderText: '#FFFFFF',
    tableRowEven: '#FAFAFA',
    tableRowOdd: '#FFFFFF',
    tableRowHover: '#E3F2FD',
    tableBorder: '#E0E0E0',

    // Cards
    cardBackground: '#FFFFFF',
    cardBorder: '#E0E0E0',
    cardShadow: 'rgba(0, 0, 0, 0.1)',

    // Sidebar
    sidebarBackground: '#1976D2',
    sidebarText: '#FFFFFF',
    sidebarHover: '#1565C0',
    sidebarActive: '#0D47A1',

    // Header
    headerBackground: '#1565C0',
    headerText: '#FFFFFF',

    // Badges
    badgeSuccess: '#4CAF50',
    badgeWarning: '#FF9800',
    badgeError: '#F44336',
    badgeInfo: '#2196F3',
    badgeNeutral: '#9E9E9E',
  },
};

// CSS Variables for Tailwind/CSS
export const cssVariables = `
  --color-primary: #2196F3;
  --color-primary-dark: #1976D2;
  --color-primary-light: #64B5F6;
  
  --color-accent: #F44336;
  --color-accent-dark: #D32F2F;
  --color-accent-light: #EF5350;
  
  --color-white: #FFFFFF;
  --color-background: #FAFAFA;
  --color-paper: #FFFFFF;
  
  --color-text-primary: #212121;
  --color-text-secondary: #757575;
  --color-text-inverse: #FFFFFF;
  
  --color-border: #E0E0E0;
  --color-border-dark: #BDBDBD;
  
  --color-success: #4CAF50;
  --color-warning: #FF9800;
  --color-error: #F44336;
  --color-info: #2196F3;
`;

// Tailwind Config Colors
export const tailwindColors = {
  primary: {
    DEFAULT: '#2196F3',
    50: '#E3F2FD',
    100: '#BBDEFB',
    200: '#90CAF9',
    300: '#64B5F6',
    400: '#42A5F5',
    500: '#2196F3',
    600: '#1E88E5',
    700: '#1976D2',
    800: '#1565C0',
    900: '#0D47A1',
  },
  accent: {
    DEFAULT: '#F44336',
    50: '#FFEBEE',
    100: '#FFCDD2',
    200: '#EF9A9A',
    300: '#E57373',
    400: '#EF5350',
    500: '#F44336',
    600: '#E53935',
    700: '#D32F2F',
    800: '#C62828',
    900: '#B71C1C',
  },
};

export default colors;
