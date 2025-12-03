import { type RequestCookies, type ResponseCookies } from "next/dist/compiled/@edge-runtime/cookies";
import { type ReadonlyRequestCookies } from "next/dist/server/web/spec-extension/adapters/request-cookies";

const COOKIE_NAME = "stats-incubateur-admin-auth";
const COOKIE_MAX_AGE = 1000 * 60 * 60; // 1 hour

export const setAuthCookie = (cookies: ResponseCookies) => {
  cookies.set({
    httpOnly: true,
    name: COOKIE_NAME,
    secure: process.env.NODE_ENV === "production",
    value: `${Date.now() + COOKIE_MAX_AGE}`,
  });
};

export const getAuthCookie = (cookies: ReadonlyRequestCookies | RequestCookies) => {
  return cookies.get(COOKIE_NAME);
};

export const isAuthCookieExpired = (cookies: ReadonlyRequestCookies | RequestCookies) => {
  const authCookie = getAuthCookie(cookies);
  if (!authCookie) return true;
  return parseInt(authCookie.value) < Date.now();
};

export const deleteAuthCookie = (cookies: ResponseCookies) => {
  cookies.delete(COOKIE_NAME);
};
