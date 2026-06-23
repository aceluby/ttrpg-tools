"use client";

import { useEffect } from "react";

export function DevLocalhostRedirect() {
  useEffect(() => {
    if (process.env.NODE_ENV === "production") {
      return;
    }

    if (window.location.hostname !== "localhost") {
      return;
    }

    const nextUrl = `http://127.0.0.1:3000${window.location.pathname}${window.location.search}${window.location.hash}`;
    window.location.replace(nextUrl);
  }, []);

  return null;
}
