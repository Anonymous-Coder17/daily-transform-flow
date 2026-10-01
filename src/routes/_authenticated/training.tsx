import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Empty } from "@/components/kit";

export const Route = createFileRoute("/_authenticated/training")({
  head: () => ({ meta: [{ title: "Training — 30-Day Transformation" }, { name: "description", content: "Training in your 30-Day Transformation tracker." }, { property: "og:title", content: "Training — 30-Day Transformation" }, { property: "og:description", content: "Training in your 30-Day Transformation tracker." }] }),
  component: Page,
});

function Page() {
  return (
    <>
      <PageHeader title="Training" />
      <Empty>This section is being built next.</Empty>
    </>
  );
}
