const SILLOBITE_API_URL = process.env.SILLOBITE_API_URL || "http://localhost:5000";

interface VerifyCodeResponse {
  success: boolean;
  access_token?: string;
  user_id?: string | number;
  message?: string;
}

export async function verifyCode(
  email: string,
  code: string
): Promise<VerifyCodeResponse> {
  try {
    const url = `${SILLOBITE_API_URL}/api/auth/verify-code`;
    console.log("Calling SilloBite API:", url);

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, code }),
    });

    const data = await response.json();
    console.log("SilloBite API response:", data);

    if (!response.ok) {
      return {
        success: false,
        message: data.error || data.message || "Failed to verify code",
      };
    }

    return {
      success: true,
      access_token: data.access_token,
      user_id: data.user_id,
    };
  } catch (error) {
    console.error("SilloBite API error:", error);
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
