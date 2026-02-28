"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, LockKeyhole } from "lucide-react";

import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getDefaultPathForRole } from "@/lib/access-control";

export default function LoginPage() {
  const router = useRouter();
  const { isAuthEnabled, loading, roleLoading, user, role, signIn } = useAuth();

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!isAuthEnabled) {
      return;
    }

    if (loading || roleLoading || !user || !role) {
      return;
    }

    router.replace(getDefaultPathForRole(role));
  }, [isAuthEnabled, loading, role, roleLoading, router, user]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      await signIn(email, password);
    } catch (submitError) {
      const message =
        submitError instanceof Error ? submitError.message : "Unable to sign in. Please retry.";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  if (!isAuthEnabled) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Authentication Disabled</CardTitle>
            <CardDescription>
              Enable `NEXT_PUBLIC_USE_SUPABASE=true` with valid Supabase credentials to activate
              login.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute left-[8%] top-[10%] h-72 w-72 rounded-full bg-sky-300/20 blur-[100px] dark:bg-sky-400/10" />
        <div className="absolute bottom-[8%] right-[12%] h-72 w-72 rounded-full bg-indigo-300/20 blur-[100px] dark:bg-indigo-400/10" />
      </div>

      <Card className="w-full max-w-md border-border/80 bg-white/80 backdrop-blur-xl dark:border-white/15 dark:bg-slate-950/60">
        <CardHeader className="space-y-3">
          <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-border/80 bg-white/70 dark:border-white/15 dark:bg-white/[0.08]">
            <LockKeyhole className="h-5 w-5" />
          </div>
          <CardTitle>Sign In</CardTitle>
          <CardDescription>Use your authorized account to access Learn N Grow Admin.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                required
              />
            </div>

            {error ? <p className="text-sm font-medium text-destructive">{error}</p> : null}

            <Button className="w-full" type="submit" disabled={submitting || loading}>
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing In...
                </>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
