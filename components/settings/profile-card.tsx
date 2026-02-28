"use client";

import * as React from "react";
import { Building2, MapPin, Phone, UserRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { BusinessProfile } from "@/lib/types";

interface ProfileCardProps {
  profile: BusinessProfile;
  onSave: (input: BusinessProfile) => Promise<void>;
}

export function ProfileCard({ profile, onSave }: ProfileCardProps) {
  const [formState, setFormState] = React.useState(profile);
  const [saving, setSaving] = React.useState(false);
  const [saved, setSaved] = React.useState(false);

  const inputClassName =
    "h-11 rounded-xl border-border/80 bg-white/70 pl-10 text-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.55)] focus-visible:ring-2 focus-visible:ring-primary/40 dark:border-white/20 dark:bg-white/[0.06]";

  React.useEffect(() => {
    setFormState(profile);
  }, [profile]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setSaved(false);

    try {
      await onSave(formState);
      setSaved(true);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="overflow-hidden border border-border/80 bg-white/55 dark:border-white/15 dark:bg-white/[0.04]">
      <CardHeader className="border-b border-border/70 bg-gradient-to-br from-sky-500/12 via-indigo-500/10 to-fuchsia-500/12 dark:border-white/10 dark:from-sky-400/16 dark:via-indigo-400/12 dark:to-fuchsia-400/16">
        <div className="flex items-start gap-4">
          <div className="rounded-2xl border border-white/50 bg-white/70 p-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.75)] dark:border-white/20 dark:bg-white/[0.08]">
            <Building2 className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-base md:text-lg">Business Profile</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Update business identity details used across this admin panel.
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form className="space-y-5 pt-1" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="businessName">Business Name</Label>
            <div className="relative">
              <Building2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/80" />
              <Input
                id="businessName"
                className={inputClassName}
                value={formState.businessName}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, businessName: event.target.value }))
                }
                required
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="ownerName">Owner Name</Label>
              <div className="relative">
                <UserRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/80" />
                <Input
                  id="ownerName"
                  className={inputClassName}
                  value={formState.ownerName}
                  onChange={(event) =>
                    setFormState((prev) => ({ ...prev, ownerName: event.target.value }))
                  }
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="profilePhone">Phone</Label>
              <div className="relative">
                <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/80" />
                <Input
                  id="profilePhone"
                  className={inputClassName}
                  value={formState.phone}
                  onChange={(event) =>
                    setFormState((prev) => ({ ...prev, phone: event.target.value }))
                  }
                  required
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <div className="relative">
              <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/80" />
              <Input
                id="address"
                className={inputClassName}
                value={formState.address}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, address: event.target.value }))
                }
                required
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            {saved ? (
              <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                Profile saved successfully.
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">Keep details up to date for accurate records.</p>
            )}
            <Button
              type="submit"
              disabled={saving}
              className="min-w-[132px] rounded-xl shadow-[0_12px_22px_-14px_rgba(37,99,235,0.75)]"
            >
              {saving ? "Saving..." : "Save"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
