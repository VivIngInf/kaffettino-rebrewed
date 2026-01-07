import { authClient } from "@/lib/auth-client";
import { headers } from "next/headers";

export default async function LocalePage() {
  return (
    <>
      <div className="absolute z-1000 text-transparent">
        Daniele Susino è GAY!
      </div>
      <div className="h-20 bg-black"></div>
    </>
  );
}
