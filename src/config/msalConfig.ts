import { Configuration, LogLevel, PublicClientApplication } from '@azure/msal-browser';
import { getConfig } from './app-config';

// Initialize with fallback values
const fallbackConfig: Configuration = {
  auth: {
    clientId: 'd5ddc5ca-19c2-4aa9-b0ae-24888c573a22',
    authority: 'https://login.microsoftonline.com/48079679-d6e0-4844-9476-5bbee68b888a',
    redirectUri: `${window.location.origin}/redirect`,
    postLogoutRedirectUri: window.location.origin,
    navigateToLoginRequestUrl: false,
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
      logLevel: LogLevel.Warning,
    },
  },
};

export let msalConfig: Configuration = fallbackConfig;

export let loginRequest = {
  scopes: ['User.Read', 'User.Read.All'],
};

// Don't create instance immediately, wait for proper initialization
export let msalInstance: PublicClientApplication;

// Track initialization to prevent duplicate instances
let isInitializing = false;
let initializationPromise: Promise<void> | null = null;

// Initialize MSAL with runtime config
export const initializeMSAL = async (): Promise<void> => {
  // If already initializing, return the existing promise
  if (isInitializing && initializationPromise) {
    return initializationPromise;
  }

  // If already initialized, return immediately
  if (msalInstance) {
    return Promise.resolve();
  }

  isInitializing = true;
  initializationPromise = initializeMSALInternal();
  
  try {
    await initializationPromise;
  } finally {
    isInitializing = false;
    initializationPromise = null;
  }
};

const initializeMSALInternal = async (): Promise<void> => {
  try {
    // Check if there's already an MSAL instance in the global window
    if ((window as any).msal_instance) {
      console.warn('MSAL instance already exists globally, reusing it');
      msalInstance = (window as any).msal_instance;
      return;
    }

    const config = await getConfig();

    msalConfig = {
      auth: {
        clientId: config.azureAd.clientId,
        authority: config.azureAd.authority,
        redirectUri: config.azureAd.redirectUri,
        postLogoutRedirectUri: config.azureAd.redirectUri,
        navigateToLoginRequestUrl: false,
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
          logLevel: LogLevel.Warning,
        },
      },
    };

    loginRequest = {
      scopes: config.azureAd.scopes,
    };

    // Create single instance with proper config
    msalInstance = new PublicClientApplication(msalConfig);
    await msalInstance.initialize();
    
    // Store globally to prevent duplicate instances
    (window as any).msal_instance = msalInstance;
  } catch (error) {
    console.error('Failed to initialize MSAL:', error);
    // Create fallback instance if main config failed
    msalInstance = new PublicClientApplication(fallbackConfig);
    await msalInstance.initialize();
    
    // Store globally to prevent duplicate instances
    (window as any).msal_instance = msalInstance;
  }
};