import { CheckCircle2Icon, ClockIcon, XCircleIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const SALE_STATUS = {
  Pending: { variant: "warning", icon: ClockIcon },
  Delivered: { variant: "success", icon: CheckCircle2Icon },
  Cancelled: { variant: "destructive", icon: XCircleIcon },
};

function SaleStatusBadge({ status }) {
  const config = SALE_STATUS[status] ?? { variant: "secondary", icon: ClockIcon };
  const Icon = config.icon;
  return (
    <Badge variant={config.variant}>
      <Icon />
      {status}
    </Badge>
  );
}

export { SaleStatusBadge };