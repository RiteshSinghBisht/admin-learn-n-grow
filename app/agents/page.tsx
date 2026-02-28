import { AgentCard } from "@/components/agents/agent-card";
import { AGENTS_CONFIG } from "@/lib/agentsConfig";

export default function AgentsHubPage() {
  const hubAgents = AGENTS_CONFIG.filter((agent) => agent.hubVisible);

  return (
    <div className="space-y-7">
      <div>
        <h1 className="page-title">AI Agents Hub</h1>
        <p className="page-subtitle">
          Pick a specialized assistant for coaching center operations.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {hubAgents.map((agent) => (
          <AgentCard key={agent.id} agent={agent} />
        ))}
      </div>
    </div>
  );
}
