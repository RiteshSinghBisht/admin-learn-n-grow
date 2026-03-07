interface ApiResponse<T> {
  success?: boolean;
  data?: T;
  error?: string;
  details?: string;
  message?: string;
}

export function withAccessToken(headers: HeadersInit | undefined, accessToken?: string | null) {
  const nextHeaders = new Headers(headers);

  if (accessToken) {
    nextHeaders.set("Authorization", `Bearer ${accessToken}`);
  }

  return nextHeaders;
}

export async function requestJson<T>(
  url: string,
  init?: RequestInit,
  accessToken?: string | null,
) {
  const response = await fetch(url, {
    ...init,
    headers: withAccessToken(init?.headers, accessToken),
  });

  const result = (await response.json()) as ApiResponse<T>;

  if (!response.ok || result.success === false) {
    throw new Error(result.details ?? result.error ?? result.message ?? "Request failed.");
  }

  return result;
}
