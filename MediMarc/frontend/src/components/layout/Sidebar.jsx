import * as React from "react";
import { NavLink } from "react-router-dom";
import {
  Activity,
  ChevronDown,
  FileText,
  LayoutDashboard,
  LogOut,
  MenuIcon,
  Package,
  PanelLeftClose,
  PanelLeftOpen,
  ShoppingCart,
  Tags,
  UserRound,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const NAV_ITEMS = [
  { to: "/home", label: "Dashboard", icon: LayoutDashboard },
  { to: "/user-management", label: "User Management", icon: Users },
  { to: "/products", label: "Product Management", icon: Package },
  { to: "/customers", label: "Customer Management", icon: UserRound },
  { to: "/categories", label: "Categories", icon: Tags },
  { to: "/sales", label: "Sales", icon: ShoppingCart },
  { to: "/reports", label: "Sales Report", icon: FileText },
  { to: "/activity-logs", label: "Activity Logs", icon: Activity },
];

function getUser() {
  try {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function handleLogout() {
  localStorage.clear();
  window.location.href = "/";
}

function SidebarNav({ collapsed = false }) {
  return (
    <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
      {NAV_ITEMS.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          title={collapsed ? item.label : undefined}
          className={({ isActive }) =>
            cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
              collapsed && "justify-center px-2"
            )
          }
        >
          <item.icon className="size-5 shrink-0" />
          {!collapsed && <span className="truncate">{item.label}</span>}
        </NavLink>
      ))}
    </nav>
  );
}

function SidebarFooter({ user, collapsed = false }) {
  const initials = (user?.username || "?").slice(0, 2).toUpperCase();

  if (collapsed) {
    return (
      <div className="border-t p-3">
        <Button
          variant="ghost"
          size="icon"
          className="mx-auto flex"
          onClick={handleLogout}
          title="Log out"
        >
          <LogOut className="size-5" />
        </Button>
      </div>
    );
  }

  return (
    <div className="border-t p-3">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="flex w-full items-center gap-2 justify-start px-2 py-2 h-auto"
          >
            <span className="bg-primary/10 text-primary flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold">
              {initials}
            </span>
            <span className="min-w-0 flex-1 text-left">
              <span className="block truncate text-sm font-medium">
                {user?.username || "User"}
              </span>
              <span className="text-muted-foreground block truncate text-xs">
                {user?.user_type_display || ""}
              </span>
            </span>
            <ChevronDown className="size-4 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" side="top" className="w-48">
          <DropdownMenuLabel>Account</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onClick={handleLogout}>
            <LogOut />
            Log Out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

function Sidebar() {
  const [collapsed, setCollapsed] = React.useState(false);
  const [user, setUser] = React.useState(null);

  React.useEffect(() => {
    setUser(getUser());
  }, []);

  return (
    <aside
      className={cn(
        "bg-card sticky top-0 hidden h-dvh shrink-0 flex-col border-r transition-[width] duration-200 lg:flex",
        collapsed ? "w-16" : "w-64"
      )}
    >
      <div
        className={cn(
          "flex h-14 shrink-0 items-center border-b px-3",
          collapsed ? "justify-center" : "justify-between"
        )}
      >
        {!collapsed && (
          <div className="flex min-w-0 items-center gap-2">
            <img src="/logo.png" alt="MediMarc logo" className="size-8 shrink-0 object-contain" />
            <span className="font-semibold tracking-tight">MediMarc</span>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed((prev) => !prev)}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="shrink-0"
        >
          {collapsed ? <PanelLeftOpen className="size-5" /> : <PanelLeftClose className="size-5" />}
        </Button>
      </div>
      <SidebarNav collapsed={collapsed} />
      <SidebarFooter user={user} collapsed={collapsed} />
    </aside>
  );
}

function MobileSidebar() {
  const [user, setUser] = React.useState(null);

  React.useEffect(() => {
    setUser(getUser());
  }, []);

  return (
    <header className="bg-card sticky top-0 z-30 flex h-14 shrink-0 items-center gap-2 border-b px-4 lg:hidden">
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" aria-label="Open menu">
            <MenuIcon className="size-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="flex w-72 flex-col p-0">
          <SheetTitle className="sr-only">Navigation menu</SheetTitle>
          <div className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
            <img src="/logo.png" alt="MediMarc logo" className="size-8 object-contain" />
            <span className="font-semibold tracking-tight">MediMarc</span>
          </div>
          <SidebarNav />
          <SidebarFooter user={user} />
        </SheetContent>
      </Sheet>
      <img src="/logo.png" alt="MediMarc logo" className="size-8 object-contain" />
      <span className="font-semibold tracking-tight">MediMarc</span>
    </header>
  );
}

export { Sidebar, MobileSidebar };