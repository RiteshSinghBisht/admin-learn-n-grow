"use client";

import { useAppData } from "@/components/providers/app-data-provider";
import { DataCard } from "@/components/settings/data-card";
import { PreferencesCard } from "@/components/settings/preferences-card";
import { ProfileCard } from "@/components/settings/profile-card";
import { Card, CardContent } from "@/components/ui/card";

export default function SettingsPage() {
  const {
    profile,
    students,
    finances,
    attendance,
    loading,
    updateProfile,
  } = useAppData();

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 text-sm text-muted-foreground">Loading settings...</CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-7">
      <div>
        <h1 className="page-title">Settings</h1>
        <p className="page-subtitle">Manage profile, preferences, and data operations.</p>
      </div>

      <ProfileCard profile={profile} onSave={updateProfile} />
      <PreferencesCard />
      <DataCard students={students} finances={finances} attendance={attendance} />
    </div>
  );
}
