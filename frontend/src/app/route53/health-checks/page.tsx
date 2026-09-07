import { HeartPulse } from "lucide-react";
import { ComingSoonPage } from "@/components/route53/ComingSoonPage";

export default function HealthChecksPage() {
  return (
    <ComingSoonPage
      icon={HeartPulse}
      title="Health checks"
      description="Health checks monitor the health and performance of your endpoints, other health checks, and CloudWatch alarms so Route 53 can automatically fail over unhealthy resources."
      bullets={[
        "Endpoint monitoring over HTTP, HTTPS, and TCP",
        "Automatic DNS failover for unhealthy resources",
        "SNS notifications when health status changes",
      ]}
    />
  );
}
