"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";
import { SignInSchema } from "@/zod/sign-in-schema";
import { Github } from "lucide-react";
import { useState } from "react";
import { set } from "zod";

export default function SignInPage() {
  const [emailError, setEmailError] = useState<string[]>([]);
  const [passwordError, setPasswordError] = useState<string[]>([]);
  const [gitHubError, setGitHubError] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSignIn = async () => {
    setEmailError([]);
    setPasswordError([]);

    const parsed = SignInSchema.safeParse({ email, password });
    if (parsed.success) {
      await authClient.signIn.email({
        email: parsed.data.email,
        password: parsed.data.password,
      });
    } else {
      const errors = parsed.error.flatten();
      setEmailError(errors.fieldErrors.email || []);
      setPasswordError(errors.fieldErrors.password || []);
    }
  };

  const handleGitHubSignIn = async () => {
    setGitHubError(null);

    const gitHubLogin = await authClient.signIn.social({
      provider: "github",
    });

    if (gitHubLogin.error) {
      console.error(gitHubLogin.error);
      setGitHubError("Failed to sign in with GitHub. Please try again.");
    }
  };

  return (
    <div className="h-screen flex items-center justify-center w-full">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>Accedi</CardTitle>
          <CardDescription>Accedi con il tuo account.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              {emailError[0] && (
                <p className="text-red-500 text-sm">{emailError[0]}</p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              {passwordError[0] && (
                <p className="text-red-500 text-sm">{passwordError[0]}</p>
              )}
            </div>
            <div className="grid gap-2">
              <Button onClick={handleSignIn}>Accedi</Button>
            </div>
            <p className="text-center">oppure</p>
            <div className="grid gap-2">
              <Button variant={"outline"} onClick={() => handleGitHubSignIn()}>
                <Github></Github> Accedi con GitHub
              </Button>
              {gitHubError && (
                <p className="text-red-500 text-sm">{gitHubError}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
