import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Empty } from "@/components/kit";

export const Route = createFileRoute("/_authenticated/habits")({
  head: () => ({ meta: [{ title: "Habits — 30-Day Transformation" }, { name: "description", content: "Habits in your 30-Day Transformation tracker." }, { property: "og:title", content: "Habits — 30-Day Transformation" }, { property: "og:description", content: "Habits in your 30-Day Transformation tracker." }] }),
  component: Page,
});

function Page() {
  return (
    <>
      <PageHeader title="Habits" />
      <Empty>This section is being built next.</Empty>
    </>
  );
}
