import { Configuration, LogLevel, PublicClientApplication } from '@azure/msal-browser';
import { getConfig } from './app-config';

// Initialize with fallback values
const fallbackConfig: Configuration = {
  auth: {
    clientId: 'd5ddc5ca-19c2-4aa9-b0ae-24888c573a22',
    authority: 'https://login.microsoftonline.com/48079679-d6e0-4844-9476-5bbee68b888a',
    redirectUri: `${window.location.origin}/redirect`,
    postLogoutRedirectUri: window.location.origin,
    navigateToLoginRequestUrl: true,
  },
  cache: {
    cacheLocation: 'localStorage',
    storeAuthStateInCookie: true,
  },
  system: {
    loggerOptions: {
      loggerCallback: (level, message, containsPii) => {
        if (containsPii) return;
        console.log(`MSAL ${level}: ${message}`);
      },
      piiLoggingEnabled: false,
      logLevel: LogLevel.Verbose,
    },
  },
};

export let msalConfig: Configuration = fallbackConfig;

export let loginRequest = {
  scopes: ['User.Read'],
};

// Singleton instance management
let msalInstance: PublicClientApplication | null = null;
let isInitialized = false;
let initializationPromise: Promise<PublicClientApplication> | null = null;

// Get or initialize MSAL instance (singleton pattern)
export const getMsalInstance = async (): Promise<PublicClientApplication> => {
  // If already initialized, return existing instance
  if (isInitialized && msalInstance) {
    return msalInstance;
  }

  // If currently initializing, wait for completion
  if (initializationPromise) {
    return initializationPromise;
  }

  // Start initialization
  initializationPromise = initializeMSALInternal();
  const instance = await initializationPromise;

  // Mark as complete
  isInitialized = true;
  initializationPromise = null;

  return instance;
};

// Legacy wrapper for backwards compatibility
export const initializeMSAL = async (): Promise<void> => {
  await getMsalInstance();
};

const initializeMSALInternal = async (): Promise<PublicClientApplication> => {
  try {
    // Check if there's already an MSAL instance in the global window
    if ((window as any).msal_instance) {
      console.log('♻️ Reusing existing MSAL instance');
      msalInstance = (window as any).msal_instance;
      return msalInstance!; // Non-null assertion since we just verified it exists
    }

    const config = await getConfig();

    // Validate required configuration values
    if (!config.azureAd.clientId || !config.azureAd.authority) {
      console.error('❌ Missing required Azure AD configuration, using fallback config');
      throw new Error('Missing Azure AD configuration');
    }

    msalConfig = {
      auth: {
        clientId: config.azureAd.clientId,
        authority: config.azureAd.authority,
        redirectUri: config.azureAd.redirectUri || window.location.origin,
        postLogoutRedirectUri: config.azureAd.redirectUri || window.location.origin,
        navigateToLoginRequestUrl: true,
      },
      cache: {
        cacheLocation: 'localStorage',
        storeAuthStateInCookie: true,
      },
      system: {
        loggerOptions: {
          loggerCallback: (level, message, containsPii) => {
            if (containsPii) return;
            console.log(`MSAL ${level}: ${message}`);
          },
          piiLoggingEnabled: false,
          logLevel: LogLevel.Verbose,
        },
      },
    };

    loginRequest = {
      scopes: config.azureAd.scopes,
    };

    console.log('🔑 Creating new MSAL instance with config');
    // Create single instance with proper config
    msalInstance = new PublicClientApplication(msalConfig);
    await msalInstance.initialize();

    // Store globally to prevent duplicate instances
    (window as any).msal_instance = msalInstance;

    return msalInstance;
  } catch (error) {
    console.error('❌ Failed to initialize MSAL with runtime config, using fallback:', error);
    // Create fallback instance if main config failed
    msalInstance = new PublicClientApplication(fallbackConfig);
    await msalInstance.initialize();

    // Store globally to prevent duplicate instances
    (window as any).msal_instance = msalInstance;

    return msalInstance;
  }
};

// Export the instance getter for direct access
export const getMsalInstanceSync = (): PublicClientApplication | null => {
  return msalInstance;
};

// Legacy export for backwards compatibility
export { getMsalInstance as msalInstance };