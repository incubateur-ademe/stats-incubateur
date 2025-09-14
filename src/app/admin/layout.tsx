import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { isAuthCookieExpired } from "./cookies";

const AdminLayout = async ({ children }: { children: React.ReactNode }) => {
  const expired = isAuthCookieExpired(await cookies());
  if (expired) {
    redirect("/admin/auth?returnTo=/admin");
  }

  return <>{children}</>;
};

export default AdminLayout;
