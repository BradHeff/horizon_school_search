// Application Configuration File
// Runtime configuration loaded from public/env.json for production deployment

export interface EnvConfig {
  API_BASE_URL: string;
  AZURE_CLIENT_ID: string;
  AZURE_AUTHORITY: string;
  AZURE_REDIRECT_URI: string;
  OPENAI_API_KEY: string;
  OPENAI_MODEL: string;
  SEARCH_API_ENDPOINT: string;
  SEARCH_API_KEY: string;
  ENVIRONMENT: string;
}

export interface AppConfig {
  // API Configuration
  api: {
    baseUrl: string;
  };

  // Azure AD Configuration
  azureAd: {
    clientId: string;
    authority: string;
    redirectUri: string;
    scopes: string[];
  };

  // OpenAI Configuration
  openAi: {
    apiKey: string;
    model: string;
    systemPrompts: {
      search: string;
      chat: string;
    };
  };

  // Search API Configuration (LangSearch)
  search: {
    apiEndpoint: string;
    apiKey: string;
  };

  // Role Mapping Configuration
  roles: {
    mappings: {
      guest: string[];
      student: string[];
      staff: string[];
    };
    defaultRole: string;
  };

  // Application Settings
  app: {
    name: string;
    schoolName: string;
    version: string;
    environment: 'development' | 'production';
  };
}

// Runtime environment configuration loader
let runtimeEnv: EnvConfig | null = null;

const loadRuntimeConfig = async (): Promise<EnvConfig> => {
  if (runtimeEnv) return runtimeEnv;

  try {
    const response = await fetch('/env.json');
    if (!response.ok) {
      throw new Error(`Failed to load env.json: ${response.status}`);
    }
    const configData = await response.json();
    runtimeEnv = configData;
    return configData;
  } catch (error) {
    console.warn('Failed to load runtime config, falling back to build-time environment variables:', error);
    // Fallback to build-time environment variables
    const fallbackConfig: EnvConfig = {
      API_BASE_URL: process.env.REACT_APP_API_BASE_URL || 'https://search.horizon.sa.edu.au',
      AZURE_CLIENT_ID: process.env.REACT_APP_AZURE_CLIENT_ID || 'd5ddc5ca-19c2-4aa9-b0ae-24888c573a22',
      AZURE_AUTHORITY: process.env.REACT_APP_AZURE_AUTHORITY || 'https://login.microsoftonline.com/48079679-d6e0-4844-9476-5bbee68b888a',
      AZURE_REDIRECT_URI: process.env.REACT_APP_AZURE_REDIRECT_URI || `${window.location.origin}/redirect`,
      OPENAI_API_KEY: process.env.REACT_APP_OPENAI_API_KEY || 'your-openai-api-key',
      OPENAI_MODEL: process.env.REACT_APP_OPENAI_MODEL || 'gpt-5-nano-2025-08-07',
      SEARCH_API_ENDPOINT: process.env.REACT_APP_SEARCH_API_ENDPOINT || 'https://api.langsearch.com/v1/web-search',
      SEARCH_API_KEY: process.env.REACT_APP_SEARCH_API_KEY || 'your-search-api-key',
      ENVIRONMENT: process.env.NODE_ENV || 'development'
    };
    runtimeEnv = fallbackConfig;
    return fallbackConfig;
  }
};

const createConfig = async (): Promise<AppConfig> => {
  const env = await loadRuntimeConfig();

  return {
    // API Configuration
    api: {
      baseUrl: env.API_BASE_URL,
    },

    // Azure Active Directory Configuration
    azureAd: {
      clientId: env.AZURE_CLIENT_ID,
      authority: env.AZURE_AUTHORITY,
      redirectUri: env.AZURE_REDIRECT_URI || (env.ENVIRONMENT === 'production' ? 'https://search.horizon.sa.edu.au' : window.location.origin),
      scopes: ['User.Read', 'GroupMember.Read.All']
    },

    // OpenAI Configuration
    openAi: {
      apiKey: env.OPENAI_API_KEY,
      model: env.OPENAI_MODEL,
      systemPrompts: {
        search: `You are a helpful search assistant. Generate educational search results for any query. Return results as JSON array format only. Focus on educational, family-friendly content from reputable sources like educational institutions, encyclopedias, and official organizations. Avoid social media and inappropriate content.`,

        chat: `You are an AI assistant for Horizon Christian School staff. You can engage in conversational assistance while maintaining Christian values and educational focus.

CORE PRINCIPLES:
- Uphold Christian values and biblical principles
- Support educational excellence and character development
- Provide professional, helpful assistance to school staff
- Maintain confidentiality and appropriate boundaries

CAPABILITIES:
- Answer questions about educational practices and curriculum
- Provide teaching assistance and resource recommendations
- Help with administrative tasks and school policies
- Offer guidance on student support and Christian education
- Assist with lesson planning and educational activities

LIMITATIONS:
- Do not provide personal counseling or therapy
- Respect student privacy and confidentiality
- Avoid controversial topics unrelated to education
- Direct users to appropriate professionals when needed

Be conversational, supportive, and always align with the school's mission of providing excellent Christian education.`
      }
    },

    // Search API Configuration (LangSearch)
    search: {
      apiEndpoint: env.SEARCH_API_ENDPOINT,
      apiKey: env.SEARCH_API_KEY,
    },

    // Role Mapping Configuration
    roles: {
      mappings: {
        guest: [], // No groups = guest
        student: ['Office365-', 'student', 'students'], // Groups containing these keywords
        staff: ['Office365-', 'faculty'] // Groups containing these keywords
      },
      defaultRole: 'guest'
    },

    // Application Settings
    app: {
      name: 'Horizon AI Search',
      schoolName: 'Horizon Christian School',
      version: '1.0.0',
      environment: (env.ENVIRONMENT as 'development' | 'production') || 'development'
    }
  };
};

// Create config instance - now async
let configPromise: Promise<AppConfig> | null = null;

export const getConfig = (): Promise<AppConfig> => {
  if (!configPromise) {
    configPromise = createConfig();
  }
  return configPromise;
};

// For backwards compatibility, create a sync version with defaults for initial load
const config: AppConfig = {
  api: {
    baseUrl: 'https://search.horizon.sa.edu.au',
  },
  azureAd: {
    clientId: 'loading...',
    authority: 'loading...',
    redirectUri: window.location.origin,
    scopes: ['User.Read', 'GroupMember.Read.All']
  },
  openAi: {
    apiKey: 'loading...',
    model: 'gpt-4',
    systemPrompts: {
      search: 'Loading...',
      chat: 'Loading...'
    }
  },
  search: {
    apiEndpoint: 'loading...',
    apiKey: 'loading...',
  },
  roles: {
    mappings: {
      guest: [],
      student: ['Office365-', 'student', 'students'],
      staff: ['Office365-', 'faculty']
    },
    defaultRole: 'guest'
  },
  app: {
    name: 'Horizon AI Search',
    schoolName: 'Horizon Christian School',
    version: '1.0.0',
    environment: 'development'
  }
};

// License-based role detection function
export const detectUserRoleFromLicenses = (licenses: any[] = []): 'guest' | 'student' | 'staff' => {
  if (!licenses || licenses.length === 0) {
    return 'guest';
  }

  // Common Microsoft 365 Education license patterns for staff/faculty
  const staffLicensePatterns = [
    'FACULTY', 'STAFF', 'TEACHER', 'EDUCATOR', 'EMPLOYEE',
    'M365EDU_A5_FACULTY', 'M365EDU_A3_FACULTY', 'OFFICESUBSCRIPTION_FACULTY',
    'EXCHANGEENTERPRISE_FACULTY', 'SHAREPOINTENTERPRISE_FACULTY',
    'OFFICE_365_A5_FACULTY', 'OFFICE_365_A3_FACULTY',
    'ENTERPRISEPACK_FACULTY', 'STANDARDPACK_FACULTY'
  ];

  // Common Microsoft 365 Education license patterns for students
  const studentLicensePatterns = [
    'STUDENT', 'STUDENTS', 'PUPIL',
    'M365EDU_A1_STUDENT', 'M365EDU_A3_STUDENT', 'M365EDU_A5_STUDENT',
    'OFFICESUBSCRIPTION_STUDENT', 'EXCHANGEENTERPRISE_STUDENT',
    'OFFICE_365_A1_STUDENT', 'OFFICE_365_A3_STUDENT', 'OFFICE_365_A5_STUDENT',
    'STANDARDPACK_STUDENT', 'ENTERPRISEPACK_STUDENT'
  ];

  // Check for staff licenses first
  const staffLicense = licenses.find(license => {
    const skuPartNumber = (license.skuPartNumber || '').toUpperCase();
    return staffLicensePatterns.some(pattern => skuPartNumber.includes(pattern));
  });

  if (staffLicense) {
    return 'staff';
  }

  // Check for student licenses
  const studentLicense = licenses.find(license => {
    const skuPartNumber = (license.skuPartNumber || '').toUpperCase();
    return studentLicensePatterns.some(pattern => skuPartNumber.includes(pattern));
  });

  if (studentLicense) {
    return 'student';
  }

  return 'guest';
};

// Legacy group-based detection (kept for fallback)
export const detectUserRole = (userGroups: string[] = []): 'guest' | 'student' | 'staff' => {
  if (!userGroups || userGroups.length === 0) {
    return 'guest';
  }

  const isStaff = userGroups.some(group =>
    group.toLowerCase().includes('office365') &&
    group.toLowerCase().includes('faculty')
  );

  if (isStaff) return 'staff';

  const isStudent = userGroups.some(group =>
    group.toLowerCase().includes('office365') &&
    (group.toLowerCase().includes('student') || group.toLowerCase().includes('students'))
  );

  if (isStudent) return 'student';

  return 'guest';
};

// Environment validation for runtime config
export const validateRuntimeConfig = async (): Promise<boolean> => {
  try {
    const config = await getConfig();
    const requiredFields = [
      config.azureAd.clientId,
      config.azureAd.authority,
      config.openAi.apiKey
    ];

    const missing = requiredFields.filter(field => !field || field === 'loading...' || field === 'your-azure-client-id' || field === 'your-openai-api-key');

    if (missing.length > 0 && config.app.environment === 'production') {
      console.error('Missing required configuration values. Please update public/env.json');
      return false;
    }

    return true;
  } catch (error) {
    console.error('Configuration validation failed:', error);
    return false;
  }
};

export default config;