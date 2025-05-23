import { types, Instance, SnapshotIn, SnapshotOut, flow } from 'mobx-state-tree';
import { LoginResponse } from './login';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Api } from '../../services/api/api';
import { ApiEndpoint } from '../../services/api/api-endpoint';
import { create } from 'apisauce';

const STORAGE_AUTH_KEY = '@auth_store';

const UserModel = types.model('User', {
  id: types.string,
  role: types.enumeration('Role', ['admin', 'employee']),
  fullName: types.string,
  email: types.string,
  avatar: types.maybeNull(types.string),
  phoneNumber: types.maybeNull(types.string),
  address: types.maybeNull(types.string),
  gender: types.maybeNull(types.string),
  dob: types.maybeNull(types.string),
});

export const AuthStore = types
  .model('AuthStore', {
    isAuthenticated: types.optional(types.boolean, false),
    user: types.maybeNull(UserModel),
    accessToken: types.maybeNull(types.string),
    refreshToken: types.maybeNull(types.string),
    expiresIn: types.maybeNull(types.number),
    tokenExpiryTime: types.maybeNull(types.number),
  })
  .actions((self) => {
    // Helper function để lưu thông tin auth vào storage
    const saveAuthToStorage = flow(function* (authData) {
      yield AsyncStorage.setItem(STORAGE_AUTH_KEY, JSON.stringify(authData));
    });

    return {
      setAuth: flow(function* (data: LoginResponse) {
        self.isAuthenticated = true;
        self.user = {
          id: data.userId,
          role: data.role,
          fullName: data.fullName,
          email: data.email,
          avatar: data.avatar || null,
          phoneNumber: data.phoneNumber || null,
          address: data.address || null,
          gender: data.gender || null,
          dob: data.dob || null,
        };
        self.accessToken = data.accessToken;
        self.refreshToken = data.refreshToken;
        self.expiresIn = data.expiresIn;
        // Tính thời điểm hết hạn token (thời gian hiện tại + expiresIn)
        self.tokenExpiryTime = Date.now() + (data.expiresIn * 1000);

        // Lưu vào storage
        const authData = {
          isAuthenticated: true,
          user: self.user,
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
          expiresIn: data.expiresIn,
          tokenExpiryTime: self.tokenExpiryTime,
        };
        yield saveAuthToStorage(authData);
      }),

      clearAuth: flow(function* () {
        self.isAuthenticated = false;
        self.user = null;
        self.accessToken = null;
        self.refreshToken = null;
        self.expiresIn = null;
        self.tokenExpiryTime = null;

        // Xóa khỏi storage
        yield AsyncStorage.removeItem(STORAGE_AUTH_KEY);
      }),

      loadStoredAuth: flow(function* () {
        try {
          const storedAuth = yield AsyncStorage.getItem(STORAGE_AUTH_KEY);
          if (storedAuth) {
            const auth = JSON.parse(storedAuth);
            self.isAuthenticated = auth.isAuthenticated;
            self.user = auth.user;
            self.accessToken = auth.accessToken;
            self.refreshToken = auth.refreshToken;
            self.expiresIn = auth.expiresIn;
            self.tokenExpiryTime = auth.tokenExpiryTime;
            
            // Kiểm tra nếu token sắp hết hạn thì thực hiện refresh
            if (self.tokenExpiryTime && Date.now() > self.tokenExpiryTime - 300000) { // Refresh trước 5 phút
              console.log('Token sắp hết hạn, tiến hành refresh token');
              yield self.refreshAccessToken();
            }
          }
        } catch (error) {
          console.error('Error loading auth from storage:', error);
        }
      }),

      refreshAccessToken: flow(function* () {
        if (!self.refreshToken) {
          console.error('No refresh token available');
          return false;
        }

        try {
          console.log('Refreshing token...');
          
          const response = yield Api.post(ApiEndpoint.REFRESH_TOKEN, { 
            refreshToken: self.refreshToken 
          });
          
          if (response.ok && response.data?.status) {
            const { token: accessToken, refreshToken, expiresIn } = response.data;
            
            if (!accessToken) {
              console.error('Missing accessToken in response');
              return false;
            }
            
            self.accessToken = accessToken;
            if (refreshToken) {
              self.refreshToken = refreshToken;
            }
            self.expiresIn = expiresIn || 3600; // Default 1 hour if not provided
            self.tokenExpiryTime = Date.now() + (self.expiresIn * 1000);

            // Update storage
            const authData = {
              isAuthenticated: self.isAuthenticated,
              user: self.user,
              accessToken,
              refreshToken: self.refreshToken,
              expiresIn: self.expiresIn,
              tokenExpiryTime: self.tokenExpiryTime,
            };
            yield saveAuthToStorage(authData);
            return true;
          } else {
            // Handle error cases
            if (response.problem === 'NETWORK_ERROR' || response.problem === 'TIMEOUT_ERROR') {
              console.log('Network issue, keeping current token');
              return false;
            }
            
            if (response.status === 401 || response.status === 403) {
              console.log('Invalid token (401/403), logging out');
              yield self.clearAuth();
            }
            return false;
          }
        } catch (error) {
          console.error('Error refreshing token:', error);
          return false;
        }
      }),

      updateAccessToken: flow(function* (token: string, expiryTime?: number) {
        if (!token) {
          console.log('Không thể cập nhật token vì token rỗng');
          return;
        }
        
        self.accessToken = token;
        if (expiryTime) {
          self.tokenExpiryTime = expiryTime;
        } else if (self.expiresIn) {
          // Nếu không có expiryTime, tính dựa trên expiresIn
          self.tokenExpiryTime = Date.now() + (self.expiresIn * 1000);
        }
        
        console.log('Token được cập nhật:', {
          tokenLength: token.length,
          expiryTime: self.tokenExpiryTime ? new Date(self.tokenExpiryTime).toISOString() : null
        });
        
        // Lưu vào storage để giữ lại giữa các session
        try {
          const authData = {
            isAuthenticated: self.isAuthenticated,
            user: self.user,
            accessToken: token,
            refreshToken: self.refreshToken,
            expiresIn: self.expiresIn,
            tokenExpiryTime: self.tokenExpiryTime,
          };
          yield saveAuthToStorage(authData);
        } catch (error) {
          console.error('Lỗi khi lưu token mới vào storage:', error);
        }
      }),
    };
  })
  .views((self) => ({
    get isAdmin() {
      return self.user?.role === 'admin';
    },
    get isEmployee() {
      return self.user?.role === 'employee';
    },
    get userRole() {
      return self.user?.role;
    },
    get userFullName() {
      return self.user?.fullName;
    },
    get userId() {
      return self.user?.id;
    },
    get debugAuthInfo() {
      console.log('Auth Info:', {
        isAuthenticated: self.isAuthenticated,
        role: self.user?.role,
        accessToken: self.accessToken ? self.accessToken.substring(0, 10) + '...' : null,
        userId: self.user?.id,
      });
      return {
        isAuthenticated: self.isAuthenticated,
        role: self.user?.role,
        hasToken: !!self.accessToken,
      };
    },
    get isTokenExpired() {
      if (!self.tokenExpiryTime) return true;
      return Date.now() >= self.tokenExpiryTime;
    },
    get shouldRefreshToken() {
      if (!self.tokenExpiryTime) return false;
      // Nên refresh token trước khi hết hạn 5 phút
      return Date.now() >= (self.tokenExpiryTime - 5 * 60 * 1000);
    }
  }));

export interface IAuthStore extends Instance<typeof AuthStore> {}
export interface IAuthStoreSnapshotIn extends SnapshotIn<typeof AuthStore> {}
export interface IAuthStoreSnapshotOut extends SnapshotOut<typeof AuthStore> {}

export const authStore = AuthStore.create({});
