import { Waypoints } from "lucide-react";
import { ComingSoonPage } from "@/components/route53/ComingSoonPage";

export default function ResolverPage() {
  return (
    <ComingSoonPage
      icon={Waypoints}
      title="Resolver"
      description="Route 53 Resolver enables DNS resolution between your VPCs and your on-premises network via inbound and outbound endpoints, plus configurable resolver rules."
      bullets={[
        "Inbound and outbound resolver endpoints",
        "Conditional forwarding rules per domain",
        "DNS Firewall rule groups for VPC traffic filtering",
      ]}
    />
  );
}
