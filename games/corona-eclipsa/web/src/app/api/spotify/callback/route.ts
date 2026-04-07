import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import {
  clearSpotifyCookies,
  consumeSpotifyAuthCookies,
  exchangeSpotifyCode,
  getSpotifyCallbackOrigin,
  getSpotifySecrets,
  persistSpotifyTokens,
} from "@/lib/spotify";

export async function GET(request: NextRequest) {
  const cookieStore = await cookies();
  const code = request.nextUrl.searchParams.get("code");
  const returnedState = request.nextUrl.searchParams.get("state");
  const error = request.nextUrl.searchParams.get("error");
  const { state, returnTo } = consumeSpotifyAuthCookies(cookieStore);

  if (error || !code || !returnedState || returnedState !== state) {
    clearSpotifyCookies(cookieStore);
    return NextResponse.redirect(new URL(returnTo || "/", request.nextUrl.origin));
  }

  const secrets = await getSpotifySecrets();
  const spotifyOrigin = getSpotifyCallbackOrigin(request.nextUrl.origin);
  const redirectUri = `${spotifyOrigin}/api/spotify/callback`;

  try {
    const tokens = await exchangeSpotifyCode({
      clientId: secrets.clientId,
      clientSecret: secrets.clientSecret,
      code,
      redirectUri,
    });

    persistSpotifyTokens(cookieStore, tokens);
    return NextResponse.redirect(new URL(returnTo || "/", request.nextUrl.origin));
  } catch {
    clearSpotifyCookies(cookieStore);
    return NextResponse.redirect(new URL(returnTo || "/", request.nextUrl.origin));
  }
}
