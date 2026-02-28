"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, SendHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { AgentConfig, ChatMessage } from "@/lib/types";

interface ChatWindowProps {
  agent: AgentConfig;
}

function createMessage(role: ChatMessage["role"], content: string): ChatMessage {
  return {
    id:
      typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    role,
    content,
    createdAt: new Date().toISOString(),
  };
}

export function ChatWindow({ agent }: ChatWindowProps) {
  const [messages, setMessages] = React.useState<ChatMessage[]>([
    createMessage(
      "assistant",
      `Hi, I am ${agent.name}. Ask me anything related to ${agent.specialty.toLowerCase()}.`,
    ),
  ]);
  const [draft, setDraft] = React.useState("");
  const [responding, setResponding] = React.useState(false);

  async function handleSend(event?: React.FormEvent) {
    event?.preventDefault();

    if (!draft.trim() || responding) {
      return;
    }

    const userMessage = createMessage("user", draft.trim());
    setMessages((prev) => [...prev, userMessage]);
    setDraft("");
    setResponding(true);

    await new Promise((resolve) => setTimeout(resolve, 900));

    const responseText = `Mock response from ${agent.name}: I received your message - "${userMessage.content}". Let's build on this.`;
    setMessages((prev) => [...prev, createMessage("assistant", responseText)]);
    setResponding(false);
  }

  return (
    <div className="flex h-[calc(100vh-9rem)] flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title text-foreground">{agent.name}</h1>
          <p className="page-subtitle">{agent.description}</p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/agents">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Link>
        </Button>
      </div>

      <Card className="flex min-h-0 flex-1 flex-col">
        <CardHeader>
          <CardTitle className="text-base">Chat</CardTitle>
        </CardHeader>

        <CardContent className="flex min-h-0 flex-1 flex-col gap-4">
          <ScrollArea className="flex-1 rounded-xl border border-border/80 bg-white/50 p-4 backdrop-blur-xl dark:border-white/15 dark:bg-white/[0.03]">
            <div className="space-y-3">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex",
                    message.role === "user" ? "justify-end" : "justify-start",
                  )}
                >
                  <div
                    className={cn(
                      "max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm",
                      message.role === "user"
                        ? "bg-[linear-gradient(135deg,hsl(var(--primary))_0%,hsl(219_95%_66%)_100%)] text-primary-foreground shadow-[0_14px_26px_-18px_rgba(37,99,235,0.75)]"
                        : "border border-border/80 bg-white/78 text-foreground backdrop-blur-xl dark:border-white/15 dark:bg-white/[0.06]",
                    )}
                  >
                    {message.content}
                  </div>
                </div>
              ))}

              {responding ? (
                <div className="flex justify-start">
                  <div className="rounded-2xl border border-border/80 bg-white/70 px-3 py-2 text-sm text-muted-foreground backdrop-blur-xl dark:border-white/15 dark:bg-white/[0.06]">
                    {agent.name} is typing...
                  </div>
                </div>
              ) : null}
            </div>
          </ScrollArea>

          <form onSubmit={handleSend} className="sticky bottom-0 flex gap-2 border-t border-border/80 pt-3 dark:border-white/15">
            <Input
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder={`Message ${agent.name}...`}
            />
            <Button type="submit" disabled={responding || !draft.trim()}>
              <SendHorizontal className="mr-2 h-4 w-4" />
              Send
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
