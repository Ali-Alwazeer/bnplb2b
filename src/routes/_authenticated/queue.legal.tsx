import { createFileRoute } from "@tanstack/react-router";
import { QueueView } from "@/components/queue-view";

export const Route = createFileRoute("/_authenticated/queue/legal")({
  component: () => <QueueView team="legal" />,
});