import { create, ApiResponse } from 'apisauce';
import { AxiosError } from 'axios';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { IPromotion } from '../../models/promotion/promotion';
import { ApiEndpoint } from './api-endpoint';
import { rootStore } from '../../models/root-store';

// Type cho request tạo mới promotion
type PromotionRequest = {
  name: string;
  discount: number;
  minOrderValue: number;
  maxDiscount: number;
  startDate: string;
  endDate: string;
  status: 'sapdienra' | 'active' | 'expired';
};

// Define base URLs for different environments
const ANDROID_BASE_URL = 'http://10.0.2.2';  // Android emulator localhost
const IOS_BASE_URL = 'http://localhost';     // iOS simulator localhost
const DEFAULT_BASE_URL = 'http://localhost'; // Fallback

// List of ports to try
const PORTS = [5000, 3000, 8000, 8080];

// Generate all possible base URLs
const generateBaseUrls = (baseUrl: string) => {
  return PORTS.map(port => `${baseUrl}:${port}`);
};

// Get appropriate base URLs for current platform
const getBaseUrls = () => {
  if (Platform.OS === 'android') {
    return generateBaseUrls(ANDROID_BASE_URL);
  } else if (Platform.OS === 'ios') {
    return generateBaseUrls(IOS_BASE_URL);
  }
  return generateBaseUrls(DEFAULT_BASE_URL);
};

// Start with first URL
let currentUrlIndex = 0;
const baseUrls = getBaseUrls();

// Current BASE_URL - will be updated if a port works
export const BASE_URL = baseUrls[currentUrlIndex];

// Store the active port when found
const saveActivePort = async (port: number) => {
  try {
    await AsyncStorage.setItem('active_api_port', port.toString());
    console.log(`🔄 Saved active API port: ${port}`);
  } catch (error) {
    console.error('❌ Failed to save active port:', error);
  }
};

// Try to load the last working port
const loadActivePort = async (): Promise<string | null> => {
  try {
    const port = await AsyncStorage.getItem('active_api_port');
    if (port) {
      console.log(`🔄 Loaded previously working port: ${port}`);
      const baseUrl = Platform.OS === 'android' ? ANDROID_BASE_URL : 
                     (Platform.OS === 'ios' ? IOS_BASE_URL : DEFAULT_BASE_URL);
      return `${baseUrl}:${port}`;
    }
  } catch (error) {
    console.error('❌ Failed to load active port:', error);
  }
  return null;
};

// Create API client with default configs
const apiClient = create({
  baseURL: BASE_URL,
  headers: { 
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  timeout: 10000 // Reduced timeout to 10 seconds
});

// Add auth token to requests
apiClient.addRequestTransform(request => {
  const token = rootStore.auth.accessToken;
  if (token) {
    if (!request.headers) {
      request.headers = {};
    }
    request.headers['Authorization'] = `Bearer ${token}`;
  }
});

// API functions
export const promotionAPI = {
  // Get promotions list
  getPromotions: async (): Promise<ApiResponse<IPromotion[]>> => {
    console.log('🔍 Current baseURL:', apiClient.getBaseURL());
    console.log('🔍 Fetching promotions from:', ApiEndpoint.PROMOTIONS);
    console.log('🔑 Using token:', rootStore.auth.accessToken); // Debug log for token

    // Try each port until one works
    for (let i = 0; i < PORTS.length; i++) {
      const port = PORTS[i];
      const baseUrl = `${Platform.OS === 'android' ? ANDROID_BASE_URL : IOS_BASE_URL}:${port}`;
      console.log(`🔄 Trying base URL: ${baseUrl}`);
      
      apiClient.setBaseURL(baseUrl);
      
      try {
        const response = await apiClient.get<IPromotion[]>(ApiEndpoint.PROMOTIONS);
        console.log(`📦 Response from ${baseUrl}:`, response);

        if (response.ok && response.data) {
          saveActivePort(port);
          return response;
        }
      } catch (error) {
        console.error(`❌ Error with ${baseUrl}:`, error);
      }
    }

    // If all ports failed, return error response
    return {
      ok: false,
      problem: 'NETWORK_ERROR',
      data: [] as IPromotion[],
      status: 500,
      headers: {},
      config: {},
      originalError: new AxiosError('Failed to connect to any available ports')
    };
  },
  
  // Get promotion by ID
  getPromotionById: async (id: string): Promise<ApiResponse<IPromotion>> => {
    console.log(`🔍 Fetching promotion details for ID: ${id}`);
    return apiClient.get(`/promotions/${id}`);
  },

  // Add new promotion
  addPromotion: async (promotionData: PromotionRequest): Promise<ApiResponse<IPromotion>> => {
    console.log('📝 Creating new promotion with data:', promotionData);
    return apiClient.post('/promotions', promotionData);
  },
  
  // Update promotion
  updatePromotion: async (id: string, promotionData: Partial<IPromotion>): Promise<ApiResponse<IPromotion>> => {
    console.log(`📝 Updating promotion ${id} with data:`, promotionData);
    return apiClient.put(`/promotions/${id}`, promotionData);
  },
  
  // Delete promotion
  deletePromotion: async (id: string): Promise<ApiResponse<void>> => {
    console.log(`🗑️ Deleting promotion with ID: ${id}`);
    return apiClient.delete(`/promotions/${id}`);
  },

  // Try the next available port if the current one fails
  tryNextPort: () => {
    currentUrlIndex = (currentUrlIndex + 1) % baseUrls.length;
    const newBaseUrl = baseUrls[currentUrlIndex];
    apiClient.setBaseURL(newBaseUrl);
    console.log(`🔄 Switching to next API URL: ${newBaseUrl}`);
    return newBaseUrl;
  },
  
  // Initialize with stored port if available
  initializeApi: async () => {
    const storedBaseUrl = await loadActivePort();
    if (storedBaseUrl) {
      apiClient.setBaseURL(storedBaseUrl);
      console.log(`🔄 Using stored API URL: ${storedBaseUrl}`);
      return storedBaseUrl;
    }
    return BASE_URL;
  }
};

// Setup API monitor to detect and handle port issues
apiClient.addMonitor((response) => {
  if (response.problem === 'NETWORK_ERROR' || response.problem === 'CONNECTION_ERROR') {
    // Try next port on next request
    promotionAPI.tryNextPort();
  } else if (response.ok) {
    // Extract port from successful URL
    const url = response.config?.baseURL;
    if (url) {
      const portMatch = url.match(/:(\d+)/);
      if (portMatch && portMatch[1]) {
        const port = parseInt(portMatch[1], 10);
        saveActivePort(port);
      }
    }
  }
});

// Initialize the API with the stored port
promotionAPI.initializeApi();

export default promotionAPI;
