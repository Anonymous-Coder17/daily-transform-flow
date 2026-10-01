import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Empty } from "@/components/kit";

export const Route = createFileRoute("/_authenticated/journal")({
  head: () => ({ meta: [{ title: "Journal — 30-Day Transformation" }, { name: "description", content: "Journal in your 30-Day Transformation tracker." }, { property: "og:title", content: "Journal — 30-Day Transformation" }, { property: "og:description", content: "Journal in your 30-Day Transformation tracker." }] }),
  component: Page,
});

function Page() {
  return (
    <>
      <PageHeader title="Journal" />
      <Empty>This section is being built next.</Empty>
    </>
  );
}
