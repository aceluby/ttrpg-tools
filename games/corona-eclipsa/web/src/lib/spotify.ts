import fs from "node:fs/promises";
import path from "node:path";

const ACCESS_COOKIE = "corona-eclipsa-spotify-access-token";
const REFRESH_COOKIE = "corona-eclipsa-spotify-refresh-token";
const EXPIRY_COOKIE = "corona-eclipsa-spotify-access-expiry";
const STATE_COOKIE = "corona-eclipsa-spotify-auth-state";
const RETURN_TO_COOKIE = "corona-eclipsa-spotify-return-to";

type SpotifySecrets = {
  clientId: string;
  clientSecret: string;
};

type SpotifyTokenResponse = {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
};

type CookieStore = {
  delete: (name: string) => void;
  get: (name: string) => { value: string } | undefined;
  set: (name: string, value: string, options?: {
    httpOnly?: boolean;
    maxAge?: number;
    path?: string;
    sameSite?: "lax";
    secure?: boolean;
  }) => void;
};

export async function getSpotifySecrets(): Promise<SpotifySecrets> {
  const secretsPath = path.join(process.cwd(), "secrets", "secrets.md");
  const raw = await fs.readFile(secretsPath, "utf8");
  const lines = raw.split(/\r?\n/);

  const values = lines.reduce<Record<string, string>>((output, line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      return output;
    }

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex === -1) {
      return output;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed.slice(separatorIndex + 1).trim();
    if (key && value) {
      output[key] = value;
    }

    return output;
  }, {});

  if (!values.client_id || !values.client_secret) {
    throw new Error("Spotify credentials are missing from secrets.md");
  }

  return {
    clientId: values.client_id,
    clientSecret: values.client_secret,
  };
}

export function buildSpotifyAuthorizeUrl(options: {
  clientId: string;
  redirectUri: string;
  returnTo: string;
  state: string;
}) {
  const url = new URL("https://accounts.spotify.com/authorize");
  url.searchParams.set("client_id", options.clientId);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("redirect_uri", options.redirectUri);
  url.searchParams.set(
    "scope",
    "user-modify-playback-state user-read-playback-state user-read-currently-playing user-read-email user-read-private",
  );
  url.searchParams.set("state", options.state);
  return url.toString();
}

export function getSpotifyCallbackOrigin(requestOrigin: string) {
  if (process.env.NODE_ENV !== "production") {
    return "http://127.0.0.1:3000";
  }

  return requestOrigin;
}

export async function exchangeSpotifyCode(options: {
  clientId: string;
  clientSecret: string;
  code: string;
  redirectUri: string;
}) {
  return requestSpotifyTokens({
    clientId: options.clientId,
    clientSecret: options.clientSecret,
    body: new URLSearchParams({
      code: options.code,
      grant_type: "authorization_code",
      redirect_uri: options.redirectUri,
    }),
  });
}

export async function refreshSpotifyAccessToken(options: {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
}) {
  return requestSpotifyTokens({
    clientId: options.clientId,
    clientSecret: options.clientSecret,
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: options.refreshToken,
    }),
  });
}

async function requestSpotifyTokens(options: {
  clientId: string;
  clientSecret: string;
  body: URLSearchParams;
}) {
  const basicAuth = Buffer.from(`${options.clientId}:${options.clientSecret}`).toString("base64");
  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${basicAuth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: options.body.toString(),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Spotify token request failed");
  }

  return response.json() as Promise<SpotifyTokenResponse>;
}

export async function getValidSpotifyAccessToken(cookieStore: CookieStore) {
  const accessToken = cookieStore.get(ACCESS_COOKIE)?.value;
  const expiry = Number.parseInt(cookieStore.get(EXPIRY_COOKIE)?.value ?? "0", 10);
  const now = Date.now();

  if (accessToken && Number.isFinite(expiry) && expiry > now + 30_000) {
    return accessToken;
  }

  const refreshToken = cookieStore.get(REFRESH_COOKIE)?.value;
  if (!refreshToken) {
    return null;
  }

  const secrets = await getSpotifySecrets();
  const refreshed = await refreshSpotifyAccessToken({
    clientId: secrets.clientId,
    clientSecret: secrets.clientSecret,
    refreshToken,
  });

  persistSpotifyTokens(cookieStore, refreshed);
  if (refreshed.refresh_token) {
    cookieStore.set(REFRESH_COOKIE, refreshed.refresh_token, buildCookieOptions(60 * 60 * 24 * 30));
  }

  return refreshed.access_token;
}

export async function spotifyApiFetch<T>(
  cookieStore: CookieStore,
  input: string,
  init?: RequestInit,
) {
  const accessToken = await getValidSpotifyAccessToken(cookieStore);
  if (!accessToken) {
    throw new Error("Spotify is not connected");
  }

  const response = await fetch(input, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const rawMessage = await response.text();
    throw new Error(extractSpotifyErrorMessage(rawMessage) || "Spotify request failed");
  }

  if (response.status === 204) {
    return null as T;
  }

  return response.json() as Promise<T>;
}

function extractSpotifyErrorMessage(rawMessage: string) {
  if (!rawMessage) {
    return "";
  }

  try {
    const parsed = JSON.parse(rawMessage) as {
      error?: {
        message?: string;
        reason?: string;
        status?: number;
      } | string;
    };

    if (typeof parsed.error === "string") {
      return parsed.error;
    }

    if (parsed.error?.message) {
      return parsed.error.reason
        ? `${parsed.error.message} (${parsed.error.reason})`
        : parsed.error.message;
    }
  } catch {
    return rawMessage;
  }

  return rawMessage;
}

export function persistSpotifyTokens(cookieStore: CookieStore, tokens: SpotifyTokenResponse) {
  cookieStore.set(ACCESS_COOKIE, tokens.access_token, buildCookieOptions(tokens.expires_in));
  cookieStore.set(
    EXPIRY_COOKIE,
    String(Date.now() + tokens.expires_in * 1000),
    buildCookieOptions(tokens.expires_in),
  );

  if (tokens.refresh_token) {
    cookieStore.set(REFRESH_COOKIE, tokens.refresh_token, buildCookieOptions(60 * 60 * 24 * 30));
  }
}

export function setSpotifyAuthCookies(cookieStore: CookieStore, options: {
  returnTo: string;
  state: string;
}) {
  cookieStore.set(STATE_COOKIE, options.state, buildCookieOptions(60 * 10));
  cookieStore.set(RETURN_TO_COOKIE, options.returnTo, buildCookieOptions(60 * 10));
}

export function consumeSpotifyAuthCookies(cookieStore: CookieStore) {
  const state = cookieStore.get(STATE_COOKIE)?.value ?? "";
  const returnTo = cookieStore.get(RETURN_TO_COOKIE)?.value ?? "/";
  cookieStore.delete(STATE_COOKIE);
  cookieStore.delete(RETURN_TO_COOKIE);

  return {
    state,
    returnTo,
  };
}

export function clearSpotifyCookies(cookieStore: CookieStore) {
  cookieStore.delete(ACCESS_COOKIE);
  cookieStore.delete(REFRESH_COOKIE);
  cookieStore.delete(EXPIRY_COOKIE);
  cookieStore.delete(STATE_COOKIE);
  cookieStore.delete(RETURN_TO_COOKIE);
}

export function createSpotifyState() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function buildCookieOptions(maxAgeSeconds: number) {
  return {
    httpOnly: true,
    maxAge: maxAgeSeconds,
    path: "/",
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
  };
}
