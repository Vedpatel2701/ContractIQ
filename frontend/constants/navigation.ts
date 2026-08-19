export const navItems = [
  { label: "Features", href: "#features" },
  { label: "Security", href: "#security" },
  { label: "Pricing", href: "#pricing" },
  { label: "Contact", href: "mailto:hello@contractiq.demo" },
] as const;

export const dashboardNavItems = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Contracts", href: "/dashboard/contracts" },
  { label: "Upload Contract", href: "/dashboard/contracts/upload" },
  { label: "Notifications", href: "/dashboard/notifications" },
  { label: "Settings", href: "/dashboard/settings" },
  { label: "Profile", href: "/dashboard/profile" },
  { label: "Logout", href: "/login" },
] as const;

export const footerLinks = ["Privacy", "Terms", "Support"] as const;