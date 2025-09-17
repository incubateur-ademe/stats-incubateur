import { ReasonPhrases, StatusCodes } from "http-status-codes";
import { type NextRequest, NextResponse } from "next/server";

import { config } from "@/config";

import { deleteAuthCookie, getAuthCookie, isAuthCookieExpired, setAuthCookie } from "../cookies";

function getUnauthorizedResponse() {
  return new NextResponse(ReasonPhrases.UNAUTHORIZED, {
    status: StatusCodes.UNAUTHORIZED,
    headers: { "WWW-Authenticate": `Basic realm="Admin Page", charset="UTF-8"` },
  });
}

export const GET = (request: NextRequest) => {
  const { searchParams, origin } = new URL(request.url);
  if (!origin.startsWith(config.host)) {
    return new NextResponse(ReasonPhrases.FORBIDDEN, { status: StatusCodes.FORBIDDEN });
  }

  const returnTo = new URL(searchParams.get("returnTo") || "/admin", config.host);

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

  // else if expired or no auth header
  const response = getUnauthorizedResponse();
  deleteAuthCookie(response.cookies);
  return response;
};
