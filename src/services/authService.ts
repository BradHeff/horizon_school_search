import { AccountInfo, AuthenticationResult } from '@azure/msal-browser';
import Cookies from 'js-cookie';
import { detectUserRole, detectUserRoleFromLicenses } from '../config/app-config';
import { loginRequest, msalInstance } from '../config/msalConfig';
import { User } from '../store/slices/authSlice';
import backendService from './backendService';

export class AuthService {
  private static rememberMeCookieName = 'horizon_remember_me';
  private static userCookieName = 'horizon_user_data';
  private static settingsCookieName = 'horizon_user_settings';

  static async login(rememberMe: boolean = false): Promise<User | null> {
    try {
      // Use redirect for production to avoid COOP policy issues
      const isProduction = window.location.hostname.includes('horizon.sa.edu.au');
      
      if (isProduction) {
        // Store remember me preference before redirect
        if (rememberMe) {
          sessionStorage.setItem('horizon_remember_me', 'true');
        }
        await msalInstance.loginRedirect(loginRequest);
        return null; // Will complete on redirect return
      }
      
      const loginResponse: AuthenticationResult = await msalInstance.loginPopup(loginRequest);

      if (loginResponse.account) {
        // Fetch user licenses for role determination
        const licenses = await this.fetchUserLicenses(loginResponse.accessToken);
        const user = this.mapAccountToUserWithLicenses(loginResponse.account, licenses);

        // Store user data in backend
        try {
          const backendResponse = await backendService.login({
            azureId: loginResponse.account.homeAccountId,
            email: loginResponse.account.username,
            name: loginResponse.account.name || user.name,
            displayName: loginResponse.account.name,
            licenses,
            rememberMe
          });

          console.log('✅ User data stored in backend');
          
          // Update user with backend settings if available
          if (backendResponse.success && backendResponse.user.settings) {
            user.settings = {
              aiMode: backendResponse.user.settings.aiMode || 'search',
              chatEnabled: backendResponse.user.settings.chatEnabled || false,
              rememberMe: backendResponse.user.settings.rememberMe || rememberMe
            };
          }
        } catch (backendError) {
          console.warn('Backend login failed, continuing with local auth:', backendError);
          // Continue with local authentication even if backend fails
        }

        if (rememberMe) {
          this.setRememberMeCookie(user);
        }

        return user;
      }
      return null;
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  }

  static async logout(): Promise<void> {
    try {
      // Logout from backend first
      try {
        await backendService.logout();
      } catch (backendError) {
        console.warn('Backend logout failed:', backendError);
        // Continue with local logout even if backend fails
      }

      // Clear all local caches
      this.clearRememberMeCookie();
      this.clearUserSettings();
      
      // Clear breadcrumb cache
      try {
        const { breadcrumbService } = await import('./breadcrumbService');
        breadcrumbService.clearCache();
      } catch (importError) {
        console.warn('Failed to clear breadcrumb cache:', importError);
      }
      
      await msalInstance.logoutPopup();
    } catch (error) {
      console.error('Logout failed:', error);
      throw error;
    }
  }

  static async getTokenSilently(): Promise<string | null> {
    try {
      const accounts = msalInstance.getAllAccounts();
      if (accounts.length === 0) {
        return null;
      }

      const request = {
        ...loginRequest,
        account: accounts[0],
      };

      const response = await msalInstance.acquireTokenSilent(request);
      return response.accessToken;
    } catch (error) {
      console.error('Silent token acquisition failed:', error);
      return null;
    }
  }

  static async checkAutoLogin(): Promise<User | null> {
    try {
      // First check if we have a valid refresh token in backend
      if (backendService.hasValidRefreshToken()) {
        const backendUser = await backendService.getCurrentUser();
        
        if (backendUser) {
          console.log('🔄 Auto-login from backend successful');
          
          // Convert backend user to frontend user format
          const user: User = {
            id: backendUser.azureId,
            name: backendUser.name,
            email: backendUser.email,
            role: backendUser.role,
            settings: backendUser.settings
          };

          return user;
        }
      }

      // Fallback to cookie-based remember me
      const rememberedUser = this.getRememberedUser();
      if (rememberedUser) {
        console.log('🔄 Auto-login from cookie');
        return rememberedUser;
      }

      return null;
    } catch (error) {
      console.error('Auto-login check failed:', error);
      return null;
    }
  }

  static async getCurrentUser(): Promise<User | null> {
    const accounts = msalInstance.getAllAccounts();
    if (accounts.length > 0) {
      try {
        // Try to get fresh token and user licenses
        const silentRequest = {
          ...loginRequest,
          account: accounts[0],
        };
        const response = await msalInstance.acquireTokenSilent(silentRequest);
        const licenses = await this.fetchUserLicenses(response.accessToken);
        return this.mapAccountToUserWithLicenses(accounts[0], licenses);
      } catch (error) {
        console.warn('Failed to get fresh token, using cached data:', error);
        return this.mapAccountToUserWithLicenses(accounts[0], []);
      }
    }

    // Check for remembered user
    return this.getRememberedUser();
  }

  static shouldRememberUser(): boolean {
    return Cookies.get(this.rememberMeCookieName) === 'true';
  }

  static isAuthenticated(): boolean {
    const accounts = msalInstance.getAllAccounts();
    return accounts.length > 0 || this.shouldRememberUser();
  }

  // User Settings Management
  static saveUserSettings(settings: { aiMode: 'search' | 'chat' }): void {
    Cookies.set(this.settingsCookieName, JSON.stringify(settings), { expires: 365 });
  }

  static getUserSettings(): { aiMode: 'search' | 'chat' } {
    const settingsData = Cookies.get(this.settingsCookieName);
    if (settingsData) {
      try {
        return JSON.parse(settingsData);
      } catch (error) {
        console.error('Failed to parse user settings:', error);
      }
    }
    return { aiMode: 'search' }; // Default settings
  }

  static clearUserSettings(): void {
    Cookies.remove(this.settingsCookieName);
  }

  private static async fetchUserGroups(accessToken: string): Promise<string[]> {
    try {
      const response = await fetch('https://graph.microsoft.com/v1.0/me/memberOf', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        const groupNames: string[] = [];
        
        data.value.forEach((group: any) => {
          const displayName = group.displayName || '';
          const mailNickname = group.mailNickname || '';
          const mail = group.mail || '';
          const name = displayName || mailNickname || mail || `UnknownGroup_${group.id}`;
          groupNames.push(name);
        });

        return groupNames;
      } else {
        // Try alternative endpoint for transitive membership
        const transitiveResponse = await fetch('https://graph.microsoft.com/v1.0/me/transitiveMemberOf', {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        });

        if (transitiveResponse.ok) {
          const data = await transitiveResponse.json();
          const groupNames = data.value.map((group: any) => {
            return group.displayName || group.mailNickname || group.mail || 'Unknown Group';
          });
          return groupNames;
        } else {
          return [];
        }
      }
    } catch (error) {
      console.error('Error fetching user groups:', error);
      return [];
    }
  }

  private static async fetchUserLicenses(accessToken: string): Promise<any[]> {
    try {
      const response = await fetch('https://graph.microsoft.com/v1.0/me/licenseDetails', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        const licenses: any[] = [];
        
        data.value.forEach((license: any) => {
          licenses.push({
            skuId: license.skuId,
            skuPartNumber: license.skuPartNumber,
            servicePlans: license.servicePlans || []
          });
        });

        return licenses;
      } else {
        // Try alternative endpoint for assigned licenses
        const userResponse = await fetch('https://graph.microsoft.com/v1.0/me?$select=assignedLicenses', {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        });

        if (userResponse.ok) {
          const userData = await userResponse.json();
          const licenses = userData.assignedLicenses?.map((license: any) => ({
            skuId: license.skuId,
            skuPartNumber: 'Unknown', // Will need to resolve SKU ID to name
            servicePlans: []
          })) || [];

          return licenses;
        } else {
          return [];
        }
      }
    } catch (error) {
      console.error('Error fetching user licenses:', error);
      return [];
    }
  }

  private static mapAccountToUser(account: AccountInfo, groups: string[] = []): User {
    const role = detectUserRole(groups);

    return {
      id: account.localAccountId,
      name: account.name || account.username,
      email: account.username,
      role,
      profileImage: undefined,
      groups,
    };
  }

  private static mapAccountToUserWithLicenses(account: AccountInfo, licenses: any[] = []): User {
    const role = detectUserRoleFromLicenses(licenses);

    return {
      id: account.localAccountId,
      name: account.name || account.username,
      email: account.username,
      role,
      profileImage: undefined,
      groups: [], // No groups when using license-based detection
    };
  }

  private static setRememberMeCookie(user: User): void {
    Cookies.set(this.rememberMeCookieName, 'true', { expires: 30 }); // 30 days
    Cookies.set(this.userCookieName, JSON.stringify(user), { expires: 30 });
  }

  private static clearRememberMeCookie(): void {
    Cookies.remove(this.rememberMeCookieName);
    Cookies.remove(this.userCookieName);
  }

  static async handleRedirectResult(): Promise<User | null> {
    try {
      console.log('🔄 AuthService.handleRedirectResult() called');
      
      const response = await msalInstance.handleRedirectPromise();
      console.log('🔄 MSAL handleRedirectPromise() response:', {
        hasResponse: !!response,
        hasAccount: !!(response?.account),
        accountId: response?.account?.homeAccountId,
        username: response?.account?.username
      });
      
      if (response && response.account) {
        console.log('✅ Valid MSAL response with account');
        
        // Check if remember me was set before redirect
        const rememberMe = sessionStorage.getItem('horizon_remember_me') === 'true';
        console.log('🔄 Remember me setting:', rememberMe);
        sessionStorage.removeItem('horizon_remember_me');
        
        // Fetch user licenses for role determination
        console.log('🔄 Fetching user licenses...');
        const licenses = await this.fetchUserLicenses(response.accessToken);
        console.log('🔄 User licenses:', licenses.length);
        
        const user = this.mapAccountToUserWithLicenses(response.account, licenses);
        console.log('✅ Mapped user:', {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role
        });

        // Store user data in backend
        try {
          console.log('🔄 Attempting backend login...');
          const backendResponse = await backendService.login({
            azureId: response.account.homeAccountId,
            email: response.account.username,
            name: response.account.name || user.name,
            displayName: response.account.name,
            licenses,
            rememberMe
          });

          console.log('🔄 Backend response:', {
            success: backendResponse.success,
            hasUser: !!backendResponse.user
          });

          if (backendResponse.success && backendResponse.user) {
            console.log('✅ Backend login successful');
            if (rememberMe) {
              this.setRememberMeCookie(user);
            }
            return user;
          }
        } catch (backendError) {
          console.error('Backend login failed:', backendError);
          console.log('⚠️ Continuing with frontend-only user');
          // Continue with frontend-only user for now
        }

        if (rememberMe) {
          this.setRememberMeCookie(user);
        }
        console.log('✅ Returning user (frontend-only or after backend failure)');
        return user;
      } else {
        console.log('⚠️ No MSAL response or account - might be already handled');
        
        // Check if we already have an account in MSAL
        const accounts = msalInstance.getAllAccounts();
        console.log('🔄 Existing MSAL accounts:', accounts.length);
        
        if (accounts.length > 0) {
          console.log('🔄 Found existing account, using it');
          const account = accounts[0];
          const licenses: any[] = []; // We don't have fresh token, so use empty licenses
          const user = this.mapAccountToUserWithLicenses(account, licenses);
          console.log('✅ Using existing account:', user.name);
          return user;
        }
      }
      
      console.log('⚠️ No authentication result available');
      return null;
    } catch (error) {
      console.error('Failed to handle redirect result:', error);
      return null;
    }
  }

  private static getRememberedUser(): User | null {
    if (this.shouldRememberUser()) {
      const userData = Cookies.get(this.userCookieName);
      if (userData) {
        try {
          return JSON.parse(userData);
        } catch (error) {
          console.error('Failed to parse remembered user data:', error);
          this.clearRememberMeCookie();
        }
      }
    }
    return null;
  }
}