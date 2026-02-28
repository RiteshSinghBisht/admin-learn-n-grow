import type { AgentConfig } from "@/lib/types";

export const AGENTS_CONFIG: AgentConfig[] = [
  {
    id: "marketing-expert",
    name: "Marketing Expert",
    description: "Craft campaigns, ad copy, and funnel ideas for student growth.",
    specialty: "Growth",
    hubVisible: true,
  },
  {
    id: "finance-guru",
    name: "Finance Guru",
    description: "Analyze revenue, expenses, margins, and budgeting strategy.",
    specialty: "Finance",
    hubVisible: true,
  },
  {
    id: "personal-assistant",
    name: "Personal Assistant",
    description: "Plan schedules, draft messages, and organize daily tasks.",
    specialty: "Productivity",
    hubVisible: true,
  },
  {
    id: "khushi",
    name: "Khushi Bot",
    description: "A friendly conversational assistant for daily center operations.",
    specialty: "Assistant",
    hubVisible: false,
  },
  {
    id: "fluent",
    name: "Fluent Bot",
    description: "Language-focused coaching helper for practice prompts.",
    specialty: "English Coaching",
    hubVisible: false,
  },
];

export const AGENTS_BY_ID = Object.fromEntries(
  AGENTS_CONFIG.map((agent) => [agent.id, agent]),
) as Record<string, AgentConfig>;
