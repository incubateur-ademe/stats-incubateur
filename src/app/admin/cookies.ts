import { type RequestCookies, type ResponseCookies } from "next/dist/compiled/@edge-runtime/cookies";
import { type UnsafeUnwrappedCookies as ReadonlyRequestCookies } from "next/dist/server/request/cookies";

const COOKIE_NAME = "stats-incubateur-admin-auth";
const COOKIE_MAX_AGE = 1000 * 60 * 60; // 1 hour

export const setAuthCookie = (cookies: ResponseCookies) => {
  cookies.set({
    name: COOKIE_NAME,
    value: `${Date.now() + COOKIE_MAX_AGE}`,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
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
