import { ReasonPhrases, StatusCodes } from "http-status-codes";
import { type NextRequest, NextResponse } from "next/server";

import { config } from "@/config";

import { deleteAuthCookie, getAuthCookie, isAuthCookieExpired, setAuthCookie } from "../cookies";

export const GET = (request: NextRequest) => {
  const { searchParams, origin } = new URL(request.url);
  const returnTo = new URL(searchParams.get("returnTo") || "/admin", origin);

  // handle cookies based auth
  const authCookie = getAuthCookie(request.cookies);
  const expired = isAuthCookieExpired(request.cookies);
  if (authCookie) {
    if (!expired) return NextResponse.redirect(returnTo);
  } else {
    const auth = request.headers.get("authorization");
    if (auth) {
      const [scheme, encoded] = auth.split(" ");
      if (scheme === "Basic") {
        const decoded = Buffer.from(encoded, "base64").toString();
        const [username, password] = decoded.split(":");
        if (username === config.admin.login && password === config.admin.password) {
          const response = NextResponse.redirect(returnTo);
          setAuthCookie(response.cookies);
          return response;
        }
      }
    }
  }

  const response = new NextResponse(ReasonPhrases.UNAUTHORIZED, {
    status: StatusCodes.UNAUTHORIZED,
    headers: { "WWW-Authenticate": `Basic realm="Admin Page", charset="UTF-8"` },
  });
  deleteAuthCookie(response.cookies);
  return response;
};
