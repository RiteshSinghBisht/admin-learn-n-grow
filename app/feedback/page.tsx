import { MessageCircleMore } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function FeedbackPage() {
  return (
    <div className="space-y-7">
      <div>
        <h1 className="page-title">User Feedback</h1>
        <p className="page-subtitle">Placeholder for future feedback workflows.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="inline-flex items-center gap-2 text-base">
            <MessageCircleMore className="h-4 w-4" />
            Coming soon
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            This page will host learner feedback, ratings, and communication insights.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
