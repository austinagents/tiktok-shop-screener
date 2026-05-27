import { notFound } from "next/navigation";
import { CreatorCard } from "@/components/creator-card";
import { creatorSpecializationFromSlug, creatorTagDisplayLabel, creatorTagSlug, creatorSpecializations } from "@/lib/creator-tags";
import { creators } from "@/lib/data";

export function generateStaticParams() {
  return creatorSpecializations.map((tag) => ({ tag: creatorTagSlug(tag) }));
}

export default function CreatorTagPage({ params }: { params: { tag: string } }) {
  const tag = creatorSpecializationFromSlug(params.tag);
  if (!tag) notFound();
  const label = creatorTagDisplayLabel(tag);
  const taggedCreators = creators.filter((creator) => creator.primarySpecialization === tag || creator.specializationTags.includes(tag));

  return (
    <div className="stack">
      <section className="detailHeader compactHeader">
        <div>
          <p className="eyebrow">Creator specialization</p>
          <h1>{label} Creators</h1>
          <p>Creators specializing in {label}.</p>
        </div>
      </section>
      {taggedCreators.length ? (
        <section className="creatorGrid">
          {taggedCreators.map((creator) => <CreatorCard creator={creator} key={creator.id} />)}
        </section>
      ) : (
        <section className="sidePanel">
          <div className="panelHeader"><h2>No Creators Yet</h2></div>
          <p className="emptyState">No accepted creators are currently tagged with {label}.</p>
        </section>
      )}
    </div>
  );
}
