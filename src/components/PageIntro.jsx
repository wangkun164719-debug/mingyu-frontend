import PageSection from "./PageSection";
import SectionTitle from "./SectionTitle";

export default function PageIntro({ title, subtitle }) {
  return (
    <PageSection className="pt-12 sm:pt-16 lg:pt-20">
      <SectionTitle title={title} subtitle={subtitle} />
    </PageSection>
  );
}
