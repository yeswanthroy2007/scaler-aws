import type { LucideIcon } from "lucide-react";
import { LayoutDashboard, Globe, Route, HeartPulse, Waypoints, Users } from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  comingSoon?: boolean;
}

export const ROUTE53_NAV: NavItem[] = [
  { label: "Dashboard", href: "/route53", icon: LayoutDashboard },
  { label: "Hosted zones", href: "/route53/hosted-zones", icon: Globe },
  { label: "Traffic policies", href: "/route53/traffic-policies", icon: Route, comingSoon: true },
  { label: "Health checks", href: "/route53/health-checks", icon: HeartPulse, comingSoon: true },
  { label: "Resolver", href: "/route53/resolver", icon: Waypoints, comingSoon: true },
  { label: "Profiles", href: "/route53/profiles", icon: Users, comingSoon: true },
];
