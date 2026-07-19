import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { MovementBadge } from "@/components/movement-badge";
import { SaveButton } from "@/components/save-button";
import { TimeframeToggle } from "@/components/timeframe-toggle";
import { WorkflowProcessTabs } from "@/components/workflow-process-tabs";
import { WorkflowStack } from "@/components/workflow-stack";
import { creatorWorkflowRelationships, creators, evidenceSourcesForTool, getWorkflow, toolsForWorkflow, workflows } from "@/lib/data";
import type { ToolEvidenceSource } from "@/lib/types";

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
    lookFor: lookForWorkflowTool(workflow.slug, tool.name),
    output: outputForWorkflowTool(workflow.slug, tool.name),
    connection: connectionForWorkflowTool(workflow.slug, tool.name, index === stackTools.length - 1, workflow.outcome)
  }));
  const workflowCreatorRelationships = creatorWorkflowRelationships.filter((relationship) => relationship.status === "accepted" && relationship.workflowSlug === workflow.slug);
  const related = workflows.filter((item) => item.slug !== workflow.slug && item.toolSlugs.some((slug) => workflow.toolSlugs.includes(slug))).slice(0, 4);
  const proofSources = evidenceForWorkflowStack(workflow.toolSlugs);

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
      <WorkflowProofSources evidenceItems={proofSources} workflowName={workflow.name} />
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

function WorkflowProofSources({ evidenceItems, workflowName }: { evidenceItems: ToolEvidenceSource[]; workflowName: string }) {
  const buckets = sourceTypesFor(evidenceItems);
  return (
    <section className="toolIntelPanel">
      <div className="toolPanelHeader">
        <div><h2>Proof Sources</h2><p>Public receipts discussing the {workflowName} stack.</p></div>
      </div>
      {buckets.length ? (
        <div className="toolEvidenceRow">
          {buckets.map((sourceType) => (
            <article className="toolEvidenceCard" key={sourceType}>
              <div className="toolReceiptSourceHeader"><span>{sourceTypeIcon(sourceType)}</span><strong>{sourceTypeLabel(sourceType)}</strong></div>
              <div className="toolReceiptPreviewList">
                {evidenceItems.filter((item) => item.sourceType === sourceType).slice(0, 3).map((item) => (
                  <article className="toolReceiptPreview" key={item.id}>
                    {item.sourceImageUrl ? <img src={item.sourceImageUrl} alt="" /> : null}
                    <div className="toolEvidenceIdentity"><strong>{item.sourceAuthor || item.platformLabel}</strong><p>{item.sourceTitle}</p></div>
                    {item.snippet ? <p className="toolEvidenceSnippet">{item.snippet}</p> : null}
                    <a className="toolReportCta" href={item.sourceUrl} target="_blank" rel="noreferrer">Open source →</a>
                  </article>
                ))}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <p className="emptyState">No proof sources are indexed for this workflow stack yet.</p>
      )}
    </section>
  );
}

function evidenceForWorkflowStack(toolSlugs: string[]) {
  const stackTools = toolsForWorkflow({ toolSlugs } as (typeof workflows)[number]);
  const stackNames = new Set(stackTools.map((tool) => normalizeToolName(tool.name)));
  const expectedSize = stackNames.size;
  const byId = new Map<string, ToolEvidenceSource>();

  toolSlugs.forEach((toolSlug) => {
    evidenceSourcesForTool(toolSlug).forEach((source) => {
      const matched = new Set(source.matchedTools.map(normalizeToolName));
      if (matched.size !== expectedSize) return;
      if (![...stackNames].every((toolName) => matched.has(toolName))) return;
      byId.set(source.id, source);
    });
  });

  return [...byId.values()].sort((a, b) => new Date(b.detectedAt).getTime() - new Date(a.detectedAt).getTime());
}

function sourceTypesFor(evidenceItems: ToolEvidenceSource[]) {
  const ordered: ToolEvidenceSource["sourceType"][] = ["x", "youtube", "github", "news", "newsletter_blog", "article", "directory", "docs", "official", "other"];
  return ordered.filter((sourceType) => evidenceItems.some((item) => item.sourceType === sourceType));
}

function sourceTypeLabel(type: ToolEvidenceSource["sourceType"]) {
  if (type === "x") return "X";
  if (type === "youtube") return "YouTube";
  if (type === "github") return "Repository";
  if (type === "docs") return "Docs";
  if (type === "official") return "Official";
  if (type === "news") return "News";
  if (type === "newsletter_blog") return "Newsletter / Blog";
  if (type === "directory") return "Directory";
  if (type === "article") return "Article";
  return "Other";
}

function sourceTypeIcon(type: ToolEvidenceSource["sourceType"]) {
  if (type === "youtube") return "YT";
  if (type === "github") return "GH";
  if (type === "newsletter_blog") return "NB";
  if (type === "directory") return "DIR";
  return sourceTypeLabel(type).slice(0, 2).toUpperCase();
}

function normalizeToolName(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function Metric({ label, value }: { label: string; value: ReactNode }) {
  return <div className="metric"><span>{label}</span><strong>{value}</strong></div>;
}

type WorkflowEducationStep = {
  do: string;
  look: string;
  get: string;
  check: string;
  why: string;
};

const step = (doThis: string, look: string, get: string, check: string, why: string): WorkflowEducationStep => ({ do: doThis, look, get, check, why });

const workflowEducation: Record<string, Record<string, WorkflowEducationStep>> = {};

function educationForWorkflowTool(workflowSlug: string, toolName: string) {
  return workflowEducation[workflowSlug]?.[toolName];
}

function taskForWorkflowTool(workflowSlug: string, toolName: string) {
  const education = educationForWorkflowTool(workflowSlug, toolName);
  return education?.do ?? "Review this tool's role in the workflow and use it to create the artifact needed for the next step.";
}

function lookForWorkflowTool(workflowSlug: string, toolName: string) {
  const education = educationForWorkflowTool(workflowSlug, toolName);
  return education ? `${education.look} ${education.check}` : "A concrete artifact that is clear enough to move into the next step.";
}

function outputForWorkflowTool(workflowSlug: string, toolName: string) {
  return educationForWorkflowTool(workflowSlug, toolName)?.get ?? "Workflow Artifact";
}

function connectionForWorkflowTool(workflowSlug: string, toolName: string, isFinalStep: boolean, workflowOutcome: string) {
  const education = educationForWorkflowTool(workflowSlug, toolName);
  return education?.why ?? (isFinalStep ? workflowOutcome : "Each step should reduce ambiguity before the workflow continues.");
}
