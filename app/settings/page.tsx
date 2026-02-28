"use client";

import { useAppData } from "@/components/providers/app-data-provider";
import { DataCard } from "@/components/settings/data-card";
import { PreferencesCard } from "@/components/settings/preferences-card";
import { ProfileCard } from "@/components/settings/profile-card";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Settings, Database } from "lucide-react";

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
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Settings</h1>
        <p className="page-subtitle">Manage profile, preferences, and data operations.</p>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="mb-6 grid w-full grid-cols-3 gap-2">
          <TabsTrigger value="profile" className="gap-2">
            <User className="h-4 w-4" />
            <span>Profile</span>
          </TabsTrigger>
          <TabsTrigger value="preferences" className="gap-2">
            <Settings className="h-4 w-4" />
            <span>Preferences</span>
          </TabsTrigger>
          <TabsTrigger value="data" className="gap-2">
            <Database className="h-4 w-4" />
            <span>Data</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <ProfileCard profile={profile} onSave={updateProfile} />
        </TabsContent>

        <TabsContent value="preferences">
          <PreferencesCard />
        </TabsContent>

        <TabsContent value="data">
          <DataCard students={students} finances={finances} attendance={attendance} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
