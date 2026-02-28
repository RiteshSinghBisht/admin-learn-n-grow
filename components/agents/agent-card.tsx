import Link from "next/link";
import { ArrowUpRight, Bot } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AgentConfig } from "@/lib/types";

interface AgentCardProps {
  agent: AgentConfig;
}

export function AgentCard({ agent }: AgentCardProps) {
  return (
    <Link href={`/agents/${agent.id}`}>
      <Card className="h-full transition-all duration-300 hover:-translate-y-1">
        <CardHeader className="pb-2">
          <div className="mb-3 inline-flex w-fit items-center gap-2 rounded-full border border-border/80 bg-white/55 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground backdrop-blur-xl dark:border-white/15 dark:bg-white/[0.06]">
            <Bot className="h-3.5 w-3.5" />
            {agent.specialty}
          </div>
          <CardTitle className="text-lg">{agent.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{agent.description}</p>
          <div className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary">
            Open Chat
            <ArrowUpRight className="h-4 w-4" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
