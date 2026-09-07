import { Route } from "lucide-react";
import { ComingSoonPage } from "@/components/route53/ComingSoonPage";

export default function TrafficPoliciesPage() {
  return (
    <ComingSoonPage
      icon={Route}
      title="Traffic policies"
      description="Traffic policies let you configure complex routing (weighted, latency-based, geoproximity) as a reusable, versioned template you can apply across multiple hosted zones."
      bullets={[
        "Visual policy editor for building routing trees",
        "Versioned policies with policy records applied to zones",
        "One-click rollback to a previous policy version",
      ]}
    />
  );
}
