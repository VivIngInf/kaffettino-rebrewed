import { authClient } from "@/lib/auth-client";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function SignOutPage() {
  if (await authClient.signOut()) redirect("/");

  return (
    <div className="h-screen flex items-center justify-center">
      <h1 className="text-3xl font-bold">Signed out!</h1>
      <p>
        Se non sei stato reindirizzato alla home page,{" "}
        <Link href={"/"}>clicca qui!</Link>
      </p>
    </div>
  );
}
