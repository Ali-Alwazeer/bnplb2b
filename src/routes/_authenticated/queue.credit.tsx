import { createFileRoute } from "@tanstack/react-router";
import { QueueView } from "@/components/queue-view";

export const Route = createFileRoute("/_authenticated/queue/credit")({
  component: () => <QueueView team="credit" />,
});