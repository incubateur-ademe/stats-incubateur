"use server";

import { cookies } from "next/headers";

import { config } from "@/config";
import { type ServerActionResponse } from "@/utils/next";

import { COOKIE_MAX_AGE, COOKIE_NAME } from "../cookies";

export const authenticateAdmin = async (login: string, password: string): Promise<ServerActionResponse> => {
  if (login !== config.admin.login || password !== config.admin.password) {
    return { error: "Identifiant ou mot de passe incorrect.", ok: false };
  }

  const cookieStore = await cookies();
  cookieStore.set({
    httpOnly: true,
    maxAge: COOKIE_MAX_AGE / 1000,
    name: COOKIE_NAME,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    value: String(Date.now() + COOKIE_MAX_AGE),
  });

  return { ok: true };
};
