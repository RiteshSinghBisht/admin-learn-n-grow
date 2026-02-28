export const CURRENCY_SYMBOL = "₹";

export const FINANCE_CATEGORIES = [
  "Student Fee",
  "Rent",
  "Salary",
  "Utilities",
  "Marketing",
  "Supplies",
] as const;

export const MONTHS_TO_SHOW = 6;

export const NAV_ITEMS = [
  { title: "Dashboard", href: "/" },
  { title: "Finance", href: "/finance" },
  { title: "Students", href: "/students" },
  { title: "Access Management", href: "/access-management" },
  { title: "AI Agents", href: "/agents" },
  { title: "Settings", href: "/settings" },
] as const;
