import { authClient } from "@/lib/auth-client";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function KaffettinoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headersList = await headers();
  const cookieHeader = headersList.get("cookie") || "";

  console.log(
    "🔍 DEBUG COOKIE:",
    cookieHeader ? "Presente" : "VUOTO/ASSENTE",
    cookieHeader,
  );

  const { data: session, error } = await authClient.getSession({
    fetchOptions: {
      headers: {
        cookie: cookieHeader,
      },
    },
  });

  console.log("Session in layout:", session);

  if (!session) {
    redirect("/sign-in");
  }

  return <html lang="it">{children}</html>;
}
