import { cookies } from "next/headers";
import { redirect, RedirectType } from "next/navigation";

import { config } from "@/config";

import { isAuthCookieExpired } from "../cookies";

const AdminLayout = async ({ children }: { children: React.ReactNode }) => {
  const expired = isAuthCookieExpired(await cookies());
  if (expired) {
    redirect(new URL("/admin/login", config.host).toString(), RedirectType.replace);
  }

  return <>{children}</>;
};

export default AdminLayout;
