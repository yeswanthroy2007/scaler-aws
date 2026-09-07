import { Users } from "lucide-react";
import { ComingSoonPage } from "@/components/route53/ComingSoonPage";

export default function ProfilesPage() {
  return (
    <ComingSoonPage
      icon={Users}
      title="Profiles"
      description="Route 53 Profiles let you define a shared set of DNS resource associations -- like resolver rules and private hosted zones -- and apply them consistently across many VPCs at once."
      bullets={[
        "Bundle hosted zone and resolver rule associations into a profile",
        "Apply a profile to many VPCs across accounts",
        "Centralized drift detection for DNS configuration",
      ]}
    />
  );
}
