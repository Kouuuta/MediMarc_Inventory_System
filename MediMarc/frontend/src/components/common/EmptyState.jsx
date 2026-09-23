import { PackageOpenIcon } from "lucide-react";

function EmptyState({
  title = "No data yet",
  description,
  action,
  icon: Icon = PackageOpenIcon,
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-6 py-12 text-center">
      <div className="bg-muted text-muted-foreground flex size-12 items-center justify-center rounded-full">
        <Icon className="size-6" />
      </div>
      <h3 className="text-sm font-semibold">{title}</h3>
      {description && (
        <p className="text-muted-foreground max-w-sm text-sm">{description}</p>
      )}
      {action}
    </div>
  );
}

export { EmptyState };