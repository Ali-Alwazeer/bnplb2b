import { createFileRoute } from "@tanstack/react-router";
import { CaseDetail } from "@/components/case-detail";

export const Route = createFileRoute("/_authenticated/case/$id")({
  component: CasePage,
});

function CasePage() {
  const { id } = Route.useParams();
  return <CaseDetail id={id} />;
}