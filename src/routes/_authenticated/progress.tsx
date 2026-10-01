import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Empty } from "@/components/kit";

export const Route = createFileRoute("/_authenticated/progress")({
  head: () => ({ meta: [{ title: "Progress — 30-Day Transformation" }, { name: "description", content: "Progress in your 30-Day Transformation tracker." }, { property: "og:title", content: "Progress — 30-Day Transformation" }, { property: "og:description", content: "Progress in your 30-Day Transformation tracker." }] }),
  component: Page,
});

function Page() {
  return (
    <>
      <PageHeader title="Progress" />
      <Empty>This section is being built next.</Empty>
    </>
  );
}
