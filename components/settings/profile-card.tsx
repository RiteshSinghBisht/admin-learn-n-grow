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
    "h-11 rounded-lg border border-slate-300 bg-white px-4 pl-10 text-sm dark:border-slate-600 dark:bg-slate-800";

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
    <Card className="overflow-hidden border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
      <CardHeader className="border-b border-slate-200 bg-slate-50 pb-6 dark:border-slate-700 dark:bg-slate-800/50">
        <div className="flex items-start gap-4">
          <div className="rounded-xl border border-slate-200 bg-white p-2.5 dark:border-slate-600 dark:bg-slate-700">
            <Building2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <CardTitle className="text-lg text-slate-900 dark:text-white">Business Profile</CardTitle>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              Update business identity details used across this admin panel.
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form className="space-y-5 pt-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="businessName" className="text-slate-700 dark:text-slate-300">Business Name</Label>
            <div className="relative">
              <Building2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
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
              <Label htmlFor="ownerName" className="text-slate-700 dark:text-slate-300">Owner Name</Label>
              <div className="relative">
                <UserRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
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
              <Label htmlFor="profilePhone" className="text-slate-700 dark:text-slate-300">Phone</Label>
              <div className="relative">
                <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
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
            <Label htmlFor="address" className="text-slate-700 dark:text-slate-300">Address</Label>
            <div className="relative">
              <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
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

          <div className="flex items-center justify-between pt-2">
            {saved ? (
              <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                Profile saved successfully.
              </p>
            ) : (
              <p className="text-sm text-slate-500 dark:text-slate-400">Keep details up to date for accurate records.</p>
            )}
            <Button
              type="submit"
              disabled={saving}
              className="min-w-[132px] rounded-lg"
            >
              {saving ? "Saving..." : "Save"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
