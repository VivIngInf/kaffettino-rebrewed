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
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { authClient } from "@/lib/auth-client";
import { SignInSchema, SignUpSchema } from "@/zod/sign-in-schema";
import { Github } from "lucide-react";
import { useState } from "react";
import { set } from "zod";

export default function SignUpPage() {
  const [emailError, setEmailError] = useState<string[]>([]);
  const [passwordError, setPasswordError] = useState<string[]>([]);
  const [confirmPasswordError, setConfirmPasswordError] = useState<string[]>(
    [],
  );
  const [nameError, setNameError] = useState<string[]>([]);
  const [surnameError, setSurnameError] = useState<string[]>([]);

  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [name, setName] = useState<string>("");
  const [surname, setSurname] = useState<string>("");
  const [birthdate, setBirthdate] = useState<string>("");
  const [course, setCourse] = useState<string>("");

  const handleSignUP = async () => {
    setEmailError([]);
    setPasswordError([]);
    setNameError([]);
    setSurnameError([]);

    const parsed = SignUpSchema.safeParse({
      email,
      password,
      confirmPassword,
      name,
      surname,
    });

    if (parsed.success) {
      const { data, error } = await authClient.signUp.email({
        email: parsed.data.email,
        password: parsed.data.password,
        name: `${name} ${surname}`,
      });

      console.log(data, error);
    } else {
      const errors = parsed.error.flatten();
      setEmailError(errors.fieldErrors.email || []);
      setPasswordError(errors.fieldErrors.password || []);
      setConfirmPasswordError(errors.fieldErrors.confirmPassword || []);
      setNameError(errors.fieldErrors.name || []);
      setSurnameError(errors.fieldErrors.surname || []);
    }
  };

  return (
    <div className="h-screen flex items-center justify-center w-full">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>Registrati</CardTitle>
          <CardDescription>Registrati con il tuo account.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              {nameError[0] && (
                <p className="text-red-500 text-sm">{nameError[0]}</p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="surname">Cognome</Label>
              <Input
                id="surname"
                type="text"
                value={surname}
                onChange={(e) => setSurname(e.target.value)}
              />
              {surnameError[0] && (
                <p className="text-red-500 text-sm">{surnameError[0]}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="grid gap-2">
                <Label htmlFor="birthdate">Data di nascita</Label>
                <Input
                  id="birthdate"
                  type="date"
                  value={birthdate}
                  onChange={(e) => setBirthdate(e.target.value)}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="course">Corso di Studi</Label>
                <Select onValueChange={(value) => setCourse(value)}>
                  <SelectTrigger className="w-full">
                    <SelectValue
                      className="truncate"
                      placeholder="Il tuo corso di studi"
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="Informatica">Informatica</SelectItem>
                      <SelectItem value="Ingegneria">Ingegneria</SelectItem>
                      <SelectItem value="Matematica">Matematica</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
            </div>

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
              <Label htmlFor="confirmPassword">Conferma Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              {confirmPasswordError[0] && (
                <p className="text-red-500 text-sm">
                  {confirmPasswordError[0]}
                </p>
              )}
            </div>
            <div className="grid gap-2">
              <Button onClick={handleSignUP}>Registrati</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
