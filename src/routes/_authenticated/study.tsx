import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Empty } from "@/components/kit";

export const Route = createFileRoute("/_authenticated/study")({
  head: () => ({ meta: [{ title: "Study — 30-Day Transformation" }, { name: "description", content: "Study in your 30-Day Transformation tracker." }, { property: "og:title", content: "Study — 30-Day Transformation" }, { property: "og:description", content: "Study in your 30-Day Transformation tracker." }] }),
  component: Page,
});

function Page() {
  return (
    <>
      <PageHeader title="Study" />
      <Empty>This section is being built next.</Empty>
    </>
  );
}
