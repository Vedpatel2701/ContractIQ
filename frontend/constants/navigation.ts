export const navItems = [
  { label: "Overview", href: "/#workflow" },
  { label: "Features", href: "/#features" },
  { label: "Security & Privacy", href: "/#security" },
] as const;

export const dashboardNavItems = [
  { label: "Overview", href: "/dashboard", icon: "layout-dashboard" },
  { label: "Contracts", href: "/dashboard/contracts", icon: "file-text" },
  { label: "Analyze Contract", href: "/dashboard/contracts/upload", icon: "upload", highlight: true },
  { label: "Notifications", href: "/dashboard/notifications", icon: "bell" },
] as const;

export const secondaryNavItems = [
  { label: "Settings", href: "/dashboard/settings", icon: "settings" },
  { label: "Profile", href: "/dashboard/profile", icon: "user" },
] as const;

export const footerLinks = ["Security & Privacy", "Terms of Use", "Help Center"] as const;