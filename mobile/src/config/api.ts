import { Platform } from 'react-native';

/**
 * API Configuration for different platforms
 * 
 * iOS Simulator: Use localhost or your Mac's IP address
 * Android Emulator: Use 10.0.2.2 (special alias for host machine)
 * Physical Devices: Use your computer's IP address on the same network
 */

// For development, set your computer's IP address here
// Find it by running: ifconfig (macOS/Linux) or ipconfig (Windows)
const DEV_SERVER_IP = '10.175.59.188';
const DEV_SERVER_PORT = '8000';

// For production, set your production server URL
const PROD_SERVER_URL = 'https://api.medifix.com';

// Determine if we're in production
const isProduction = false; // Change to true when deploying

// Get the appropriate base URL based on platform and environment
export const getApiBaseUrl = (): string => {
  if (isProduction) {
    return PROD_SERVER_URL;
  }

  // Development environment
  if (Platform.OS === 'android') {
    // For Android emulator, use special alias for host machine
    // For physical Android device, use actual IP
    // You can detect this, but for simplicity, use IP that works for both
    return `http://${DEV_SERVER_IP}:${DEV_SERVER_PORT}`;
  } else if (Platform.OS === 'ios') {
    // For iOS simulator, localhost works
    // For physical iOS device, use actual IP
    return `http://${DEV_SERVER_IP}:${DEV_SERVER_PORT}`;
  } else {
    // Web or other platforms
    return `http://localhost:${DEV_SERVER_PORT}`;
  }
};

export const API_BASE_URL = getApiBaseUrl();

// Helper to check if running on emulator vs physical device
export const isEmulator = () => {
  // This is a simplified check
  // For more accurate detection, you might need additional libraries
  return __DEV__;
};

// Export for debugging
export const API_CONFIG = {
  baseURL: API_BASE_URL,
  platform: Platform.OS,
  isProduction,
  isDevelopment: __DEV__,
};

// Log configuration in development
if (__DEV__) {
  console.log('🔧 API Configuration:', API_CONFIG);
  console.log('📡 API Base URL:', API_BASE_URL);
}
