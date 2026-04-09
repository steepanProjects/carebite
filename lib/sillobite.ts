const SILLOBITE_API_URL = process.env.SILLOBITE_API_URL || "https://sillobite-backend.com";

interface VerifyCodeResponse {
  success: boolean;
  access_token?: string;
  user_id?: string;
  message?: string;
}

export async function verifyCode(
  email: string,
  code: string
): Promise<VerifyCodeResponse> {
  try {
    const response = await fetch(
      `${SILLOBITE_API_URL}/auth/verify-code`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, code }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: data.message || "Failed to verify code",
      };
    }

    return {
      success: true,
      access_token: data.access_token,
      user_id: data.user_id,
    };
  } catch (error) {
    return {
      success: false,
      message: "Network error. Please try again.",
    };
  }
}

export async function getMenus(accessToken: string) {
  const response = await fetch(`${SILLOBITE_API_URL}/api/menus`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  return response.json();
}

export async function getOrders(accessToken: string) {
  const response = await fetch(`${SILLOBITE_API_URL}/api/orders`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  return response.json();
}
