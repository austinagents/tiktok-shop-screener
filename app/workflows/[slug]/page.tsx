import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { MovementBadge } from "@/components/movement-badge";
import { SaveButton } from "@/components/save-button";
import { TimeframeToggle } from "@/components/timeframe-toggle";
import { WorkflowProcessTabs } from "@/components/workflow-process-tabs";
import { WorkflowStack } from "@/components/workflow-stack";
import { creatorWorkflowRelationships, creators, getWorkflow, toolsForWorkflow, workflows } from "@/lib/data";

export function generateStaticParams() {
  return workflows.map((workflow) => ({ slug: workflow.slug }));
}

export default function WorkflowDetailPage({ params }: { params: { slug: string } }) {
  const workflow = getWorkflow(params.slug);
  if (!workflow) notFound();
  const stackTools = toolsForWorkflow(workflow);
  const workflowProcessSteps = stackTools.map((tool, index) => ({
    toolSlug: tool.slug,
    toolName: tool.name,
    officialLogoUrl: tool.officialLogoUrl,
    logoUrl: tool.logoUrl,
    faviconUrl: tool.faviconUrl,
    iconUrl: tool.iconUrl,
    task: taskForWorkflowTool(workflow.slug, tool.name),
    output: outputForWorkflowTool(workflow.slug, tool.name),
    connection: connectionForWorkflowTool(workflow.slug, tool.name, index === stackTools.length - 1, workflow.outcome)
  }));
  const workflowCreatorRelationships = creatorWorkflowRelationships.filter((relationship) => relationship.status === "accepted" && relationship.workflowSlug === workflow.slug);
  const related = workflows.filter((item) => item.slug !== workflow.slug && item.toolSlugs.some((slug) => workflow.toolSlugs.includes(slug))).slice(0, 4);

  return (
    <div className="stack">
      <section className="detailHeader">
        <div>
          <p className="eyebrow">Workflow</p>
          <h1>{workflow.name}</h1>
          <p>{workflow.description}</p>
        </div>
        <SaveButton kind="workflows" id={workflow.slug} />
      </section>
      <section className="terminalStatus">
        <Metric label="Momentum Score" value={workflow.momentumScore} />
        <Metric label="24h Growth" value={<MovementBadge value={workflow.growth24h} />} />
        <Metric label="7d Growth" value={<MovementBadge value={workflow.growth7d} />} />
        <Metric label="Saves" value={workflow.savesCount.toLocaleString()} />
        <Metric label="Tools in stack" value={workflow.toolSlugs.length} />
        <TimeframeToggle compact />
      </section>
      {workflowProcessSteps.length ? (
        <section className="workflowProcess">
          <div className="sectionHeader"><h2>How This Workflow Breaks Down</h2><p>Step-by-step tool sequence showing how this workflow gets completed.</p></div>
          <WorkflowProcessTabs steps={workflowProcessSteps} />
        </section>
      ) : null}
      <section className="sidePanel">
        <div className="panelHeader"><h2>Creator Relationships</h2></div>
        {workflowCreatorRelationships.length ? (
          <div className="miniList">
            {workflowCreatorRelationships.map((relationship) => {
              const creator = creators.find((item) => item.id === relationship.creatorId);
              if (!creator) return null;
              return (
                <a className="miniRow" href={`/creators/${creator.id}`} key={relationship.id}>
                  <span><strong>{creator.name}</strong><small>{relationship.supportingToolSlugs?.length ?? 0} accepted tool overlaps</small></span>
                </a>
              );
            })}
          </div>
        ) : (
          <p className="emptyState">Verified creator-workflow adoption is pending. This workflow is currently ranked by tool-stack composition and local movement signals.</p>
        )}
      </section>
      <section><div className="sectionHeader"><h2>Related Workflows</h2></div><div className="workflowGrid">{related.map((item) => <a className="workflowRow" href={`/workflows/${item.slug}`} key={item.id}><WorkflowStack toolSlugs={item.toolSlugs} /><span><strong>{item.name}</strong><small>{item.outcome}</small></span><MovementBadge value={item.growth24h} /></a>)}</div></section>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: ReactNode }) {
  return <div className="metric"><span>{label}</span><strong>{value}</strong></div>;
}

function taskForWorkflowTool(workflowSlug: string, toolName: string) {
  const tasks: Record<string, Record<string, string>> = {
    "solo-founder-stack": {
      ChatGPT: "Draft the initial MVP scope, target user, feature list, and launch assumptions.",
      Claude: "Refine the product brief, clarify tradeoffs, and turn rough ideas into build-ready requirements.",
      Cursor: "Implement the core product code from the brief and iterate inside the codebase.",
      Lovable: "Prototype the product experience quickly from the product brief.",
      V0: "Generate interface sections and UI patterns for the MVP.",
      Linear: "Turn the build plan into prioritized tasks and track execution.",
      Gamma: "Package the product story for launch, investor, or customer-facing communication."
    },
    "ai-coding-stack": {
      Claude: "Translate the coding goal into a technical plan and implementation approach.",
      Cursor: "Apply the plan directly in the codebase.",
      Windsurf: "Coordinate larger multi-file edits and agentic coding passes.",
      V0: "Generate interface drafts when the workflow needs frontend screens.",
      Bolt: "Create full-stack prototype flows from prompts.",
      Replit: "Run, test, and share the coded prototype in a hosted workspace."
    },
    "research-assistant-stack": {
      Perplexity: "Find source material and relevant external references.",
      NotebookLM: "Organize uploaded or referenced material into a searchable workspace.",
      Claude: "Synthesize the source base into a structured briefing.",
      ChatGPT: "Draft alternate summaries, questions, or follow-up analysis from the brief.",
      Glean: "Pull relevant internal knowledge into the research context."
    }
  };

  return tasks[workflowSlug]?.[toolName] ?? "Supports this workflow step with its core capability.";
}

function outputForWorkflowTool(workflowSlug: string, toolName: string) {
  const outputs: Record<string, Record<string, string>> = {
    "solo-founder-stack": {
      ChatGPT: "initial MVP plan",
      Claude: "build-ready product brief",
      Cursor: "working product code",
      Lovable: "clickable product prototype",
      V0: "interface draft",
      Linear: "prioritized build queue",
      Gamma: "launch narrative"
    },
    "ai-coding-stack": {
      Claude: "technical implementation plan",
      Cursor: "code changes",
      Windsurf: "multi-file implementation pass",
      V0: "frontend UI draft",
      Bolt: "full-stack prototype",
      Replit: "hosted runnable build"
    },
    "research-assistant-stack": {
      Perplexity: "source list",
      NotebookLM: "organized source base",
      Claude: "final research brief",
      ChatGPT: "follow-up analysis draft",
      Glean: "internal knowledge context"
    }
  };

  return outputs[workflowSlug]?.[toolName] ?? "workflow contribution";
}

function connectionForWorkflowTool(workflowSlug: string, toolName: string, isFinalStep: boolean, workflowOutcome: string) {
  const connections: Record<string, Record<string, string>> = {
    "solo-founder-stack": {
      ChatGPT: "This gives Claude a concrete starting point to refine into requirements.",
      Claude: "The clarified brief gives build tools a cleaner implementation target.",
      Cursor: "The codebase becomes the foundation for rapid product prototyping and UI iteration.",
      Lovable: "The prototype helps validate the product flow before deeper implementation polish.",
      V0: "The generated interface pieces can be folded back into the product build.",
      Linear: "The task queue keeps the build sequence organized through launch.",
      Gamma: "This packages the finished MVP story for selling, pitching, or sharing."
    },
    "ai-coding-stack": {
      Claude: "The plan gives the coding environment a clear implementation path.",
      Cursor: "The first code pass creates the base for broader multi-file refinement.",
      Windsurf: "The larger edit pass prepares the project for UI and prototype work.",
      V0: "The UI draft gives app builders a concrete interface target.",
      Bolt: "The prototype creates a runnable flow that can be tested and shared.",
      Replit: "This turns the coded work into a usable hosted result."
    },
    "research-assistant-stack": {
      Perplexity: "The source list becomes the material to organize and query.",
      NotebookLM: "The organized source base gives Claude grounded material to synthesize.",
      Claude: "The structured brief becomes the core workflow output.",
      ChatGPT: "Follow-up analysis expands the brief into questions, variants, or next actions.",
      Glean: "Internal context adds organization-specific knowledge to the final briefing."
    }
  };

  return connections[workflowSlug]?.[toolName] ?? (isFinalStep ? `This contributes to the final workflow outcome: ${workflowOutcome}` : "This prepares useful context for the next step in the workflow.");
}
