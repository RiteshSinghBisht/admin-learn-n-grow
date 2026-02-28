"use client";

import { ShieldCheck } from "lucide-react";

import { AccessManagementCard } from "@/components/settings/access-management-card";
import { useAuth } from "@/components/providers/auth-provider";
import { Card, CardContent } from "@/components/ui/card";

export default function AccessManagementPage() {
  const { roleLoading, role } = useAuth();

  if (roleLoading) {
    return (
      <Card>
        <CardContent className="p-6 text-sm text-muted-foreground">
          Loading access management...
        </CardContent>
      </Card>
    );
  }

  if (role !== "admin") {
    return (
      <Card className="border border-border/80 bg-white/55 dark:border-white/15 dark:bg-white/[0.04]">
        <CardContent className="flex items-start gap-3 p-6">
          <ShieldCheck className="mt-0.5 h-5 w-5 text-muted-foreground" />
          <div>
            <h2 className="text-base font-semibold">Admin Access Required</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Only admins can view and manage user access roles.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-8 pt-1 md:pt-2">
      <div>
        <h1 className="page-title">Access Management</h1>
        <p className="page-subtitle">Add users and control role-based access for this admin panel.</p>
      </div>
      <AccessManagementCard />
    </div>
  );
}
