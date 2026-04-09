// Platform configuration
export type Platform = 'sillobite' | 'figgy' | 'komato';

interface PlatformConfig {
  name: string;
  displayName: string;
  apiUrl: string;
  icon: string;
}

export const PLATFORMS: Record<Platform, PlatformConfig> = {
  sillobite: {
    name: 'sillobite',
    displayName: 'SilloBite',
    apiUrl: process.env.SILLOBITE_API_URL || 'http://localhost:5000',
    icon: '🍽️',
  },
  figgy: {
    name: 'figgy',
    displayName: 'Figgy',
    apiUrl: process.env.FIGGY_API_URL || 'http://localhost:5001',
    icon: '🥗',
  },
  komato: {
    name: 'komato',
    displayName: 'Komato',
    apiUrl: process.env.KOMATO_API_URL || 'http://localhost:5002',
    icon: '🍅',
  },
};

interface VerifyCodeResponse {
  success: boolean;
  access_token?: string;
  user_id?: string | number;
  message?: string;
}

export async function verifyCode(
  platform: Platform,
  email: string,
  code: string
): Promise<VerifyCodeResponse> {
  try {
    const config = PLATFORMS[platform];
    const url = `${config.apiUrl}/api/auth/verify-code`;
    console.log(`Calling ${config.displayName} API:`, url);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, code }),
    });

    const data = await response.json();
    console.log(`${config.displayName} API response:`, data);

    if (!response.ok) {
      return {
        success: false,
        message: data.error || data.message || 'Failed to verify code',
      };
    }

    return {
      success: true,
      access_token: data.access_token,
      user_id: data.user_id,
    };
  } catch (error) {
    console.error(`${platform} API error:`, error);
    return {
      success: false,
      message: 'Network error. Please try again.',
    };
  }
}

export async function getMenus(platform: Platform, accessToken: string) {
  const config = PLATFORMS[platform];
  const response = await fetch(`${config.apiUrl}/api/menus`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  return response.json();
}

export async function getOrders(platform: Platform, accessToken: string) {
  const config = PLATFORMS[platform];
  const response = await fetch(`${config.apiUrl}/api/orders`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  return response.json();
}
