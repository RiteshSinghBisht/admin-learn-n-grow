import { notFound } from "next/navigation";

import { ChatWindow } from "@/components/agents/chat-window";
import { AGENTS_BY_ID } from "@/lib/agentsConfig";

interface AgentChatPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function AgentChatPage({ params }: AgentChatPageProps) {
  const { id } = await params;
  const agent = AGENTS_BY_ID[id];

  if (!agent) {
    notFound();
  }

  return <ChatWindow agent={agent} />;
}
