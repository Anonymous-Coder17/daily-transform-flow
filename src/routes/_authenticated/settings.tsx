import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Empty } from "@/components/kit";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({ meta: [{ title: "Settings — 30-Day Transformation" }, { name: "description", content: "Settings in your 30-Day Transformation tracker." }, { property: "og:title", content: "Settings — 30-Day Transformation" }, { property: "og:description", content: "Settings in your 30-Day Transformation tracker." }] }),
  component: Page,
});

function Page() {
  return (
    <>
      <PageHeader title="Settings" />
      <Empty>This section is being built next.</Empty>
    </>
  );
}
