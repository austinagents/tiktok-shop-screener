import { notFound } from "next/navigation";
import { CreatorAvatar } from "@/components/creator-avatar";
import { MovementBadge } from "@/components/movement-badge";
import { WorkflowStack } from "@/components/workflow-stack";
import { creatorTagDisplayLabel, creatorTagSlug, creatorTagStyle } from "@/lib/creator-tags";
import { creators, getCreator, workflows } from "@/lib/data";

export function generateStaticParams() {
  return creators.map((creator) => ({ id: creator.id }));
}

export default function CreatorPage({ params }: { params: { id: string } }) {
  const creator = getCreator(params.id);
  if (!creator) notFound();
  const creatorWorkflows = workflows.filter((workflow) => creator.workflowSlugs.includes(workflow.slug));
  const tags = publicCreatorTags(creator);

  return (
    <div className="stack">
      <section className="detailHeader">
        <div className="toolTitle">
          <CreatorAvatar name={creator.name} src={creator.avatarUrl} size={54} />
          <div>
            <p className="eyebrow">Creator signal</p>
            <h1>{creator.name}</h1>
            <p>{[creator.handle, creator.platform, creator.followers ? `${creator.followers.toLocaleString()} followers` : ""].filter(Boolean).join(" · ")}</p>
            <div className="tagRail">
              {tags.slice(0, 8).map((tag) => <a href={`/creators/tags/${creatorTagSlug(tag)}`} key={tag} style={creatorTagStyle(tag)}>{creatorTagDisplayLabel(tag)}</a>)}
            </div>
          </div>
        </div>
        <div className="headerActions">
          <a className="iconTextButton" href={creator.xUrl} target="_blank" rel="noopener noreferrer">X Profile</a>
        </div>
      </section>
      <section className="gridTwo">
        <div className="sidePanel">
          <div className="panelHeader"><h2>Specialization Cluster</h2></div>
          <div className="miniList">
            {tags.map((tag) => (
              <a className="miniRow" href={`/creators/tags/${creatorTagSlug(tag)}`} key={tag}>
                <span><strong>{creatorTagDisplayLabel(tag)}</strong><small>accepted creator taxonomy</small></span>
              </a>
            ))}
          </div>
        </div>
        <div className="sidePanel">
          <div className="panelHeader"><h2>Relationship Status</h2></div>
          <div className="emptyState">
            Verified creator-tool relationships are pending. This profile is accepted into the creator graph, but AppScreener is not presenting unsupported usage claims.
          </div>
        </div>
      </section>
      <section>
        <div className="sectionHeader"><h2>Workflow Adjacency Preview</h2><p>Based on specialization tags, not verified creator usage.</p></div>
        <div className="workflowGrid">
          {creatorWorkflows.map((workflow) => <a className="workflowRow" href={`/workflows/${workflow.slug}`} key={workflow.id}><WorkflowStack toolSlugs={workflow.toolSlugs} /><span><strong>{workflow.name}</strong><small>{workflow.outcome}</small></span><MovementBadge value={workflow.growth24h} /></a>)}
          {!creatorWorkflows.length && <div className="emptyState">Workflow adjacency is pending stronger creator graph coverage.</div>}
        </div>
      </section>
    </div>
  );
}

function publicCreatorTags(creator: NonNullable<ReturnType<typeof getCreator>>) {
  return [...new Set([
    creator.primarySpecialization,
    ...creator.specializationTags
  ].filter((tag): tag is NonNullable<typeof creator.primarySpecialization> => Boolean(tag)))];
}
