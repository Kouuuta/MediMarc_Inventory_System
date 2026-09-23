import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

function StatCard({ icon: Icon, label, value, className, iconClassName }) {
  return (
    <Card className={cn("gap-0 py-5", className)}>
      <CardContent className="flex items-center gap-4 px-5 py-0">
        <div
          className={cn(
            "flex size-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary",
            iconClassName
          )}
        >
          <Icon className="size-5" />
        </div>
        <div className="min-w-0">
          <p className="text-muted-foreground truncate text-sm">{label}</p>
          <p className="text-foreground text-2xl font-semibold tabular-nums">
            {value}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export { StatCard };