"use client";

// components/login.tsx
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { useMutation } from "@apollo/client";
import { LOGIN_MUTATION } from "@/graphql/mutations";

interface LoginData {
  login: {
    accessToken: string;
    refreshToken: string;
  };
}

interface LoginError {
  message: string;
}

export const description =
  "A simple login form with email and password. The submit button says 'Sign in'.";

export function LoginForm() {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [login, { loading }] = useMutation<LoginData, { email: string; password: string }>(LOGIN_MUTATION, {
    onCompleted: (data) => {
      const { accessToken, refreshToken } = data.login;
      localStorage.setItem("accessToken", accessToken);
      localStorage.setItem("refreshToken", refreshToken);
      window.location.href = "/my-info/time-off";
    },
    onError: (error: LoginError) => {
      setErrorMessage(error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage(null); // Очистка предыдущих ошибок
    login({ variables: { email, password } });
  };

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle className="text-2xl">Login</CardTitle>
        <CardDescription>
          Enter your email below to login to your account.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="m@example.com"
              required
              onChange={(e) => setEmail(e.target.value)}
              value={email} // Установка значения
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              required
              onChange={(e) => setPassword(e.target.value)}
              value={password} // Установка значения
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Signing in..." : "Sign in"}
          </Button>
          {errorMessage && <p className="text-red-500">{errorMessage}</p>}
        </form>
      </CardContent>
      <CardFooter />
    </Card>
  );
}
