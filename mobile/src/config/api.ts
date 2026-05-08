export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? '';

if (__DEV__) {
  console.log('📡 API Base URL:', API_BASE_URL);
}
