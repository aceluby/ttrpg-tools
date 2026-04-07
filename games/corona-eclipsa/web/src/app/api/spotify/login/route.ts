import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import {
  buildSpotifyAuthorizeUrl,
  createSpotifyState,
  getSpotifyCallbackOrigin,
  getSpotifySecrets,
  setSpotifyAuthCookies,
} from "@/lib/spotify";

export async function GET(request: NextRequest) {
  const cookieStore = await cookies();
  const secrets = await getSpotifySecrets();
  const state = createSpotifyState();
  const returnTo = request.nextUrl.searchParams.get("returnTo") || "/";
  const spotifyOrigin = getSpotifyCallbackOrigin(request.nextUrl.origin);
  const redirectUri = `${spotifyOrigin}/api/spotify/callback`;

  setSpotifyAuthCookies(cookieStore, {
    returnTo,
    state,
  });

  return NextResponse.redirect(buildSpotifyAuthorizeUrl({
    clientId: secrets.clientId,
    redirectUri,
    returnTo,
    state,
  }));
}
