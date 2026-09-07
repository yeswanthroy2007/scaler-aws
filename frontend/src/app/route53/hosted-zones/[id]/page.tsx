import { HostedZoneDetailClient } from "@/features/hosted-zones/HostedZoneDetailClient";

export default async function HostedZoneDetailPage({ params }: PageProps<"/route53/hosted-zones/[id]">) {
  const { id } = await params;
  return <HostedZoneDetailClient zoneId={Number(id)} />;
}
