import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Empty } from "@/components/kit";

export const Route = createFileRoute("/_authenticated/calendar")({
  head: () => ({ meta: [{ title: "Calendar — 30-Day Transformation" }, { name: "description", content: "Calendar in your 30-Day Transformation tracker." }, { property: "og:title", content: "Calendar — 30-Day Transformation" }, { property: "og:description", content: "Calendar in your 30-Day Transformation tracker." }] }),
  component: Page,
});

function Page() {
  return (
    <>
      <PageHeader title="Calendar" />
      <Empty>This section is being built next.</Empty>
    </>
  );
}
