import { CheckCircle2, CircleSlash, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface PaymentStatusBadgeProps {
  /** `appointments.payment_received` — money actually landed. */
  paid?: boolean | null;
  /** `appointments.is_paid` — this session is a charged session (not free). */
  isPaidService?: boolean | null;
  /** What the session costs, if known — shown on the "due" badge. */
  priceAmount?: number | null;
  /** Stripe / External / Bank Transfer … shown in the tooltip when paid. */
  paymentMethod?: string | null;
  /** Appointment status — a cancelled session has no meaningful payment state. */
  status?: string | null;
  /** Hide the dollar figure even when the price is known. */
  showAmount?: boolean;
  size?: "sm" | "md";
  className?: string;
}

/**
 * One-glance answer to "has this session been paid for?".
 *
 * The CRM has two flags and they mean different things:
 *   is_paid          — the session was booked as a charged session (vs free)
 *   payment_received — the money actually arrived (Stripe webhook or manual tick)
 *
 * Only `payment_received` counts as paid (`appointmentRowIsPaid` in
 * `src/lib/calendarItems.ts` is the canonical rule). Cancelled sessions render
 * nothing — the status badge already tells that story.
 */
export function PaymentStatusBadge({
  paid,
  isPaidService,
  priceAmount,
  paymentMethod,
  status,
  showAmount = true,
  size = "md",
  className,
}: PaymentStatusBadgeProps) {
  if ((status || "").toLowerCase() === "cancelled") return null;

  const amount = typeof priceAmount === "number" && priceAmount > 0 ? priceAmount : null;
  const sizing = size === "sm" ? "text-[10px] px-1.5 py-0" : "";

  if (paid === true) {
    return (
      <Badge
        variant="success"
        className={cn("font-semibold", sizing, className)}
        title={`Payment received${amount ? ` — $${amount}` : ""}${paymentMethod ? ` (${paymentMethod})` : ""}`}
      >
        <CheckCircle2 size={size === "sm" ? 10 : 12} aria-hidden />
        Paid
      </Badge>
    );
  }

  const isFree = isPaidService === false || priceAmount === 0;
  if (isFree) {
    return (
      <Badge
        variant="secondary"
        className={cn("font-medium text-muted-foreground", sizing, className)}
        title="No charge for this session"
      >
        <CircleSlash size={size === "sm" ? 10 : 12} aria-hidden />
        Free
      </Badge>
    );
  }

  return (
    <Badge
      variant="warning"
      className={cn("font-semibold", sizing, className)}
      title={amount ? `$${amount} outstanding` : "No payment recorded yet"}
    >
      <Clock size={size === "sm" ? 10 : 12} aria-hidden />
      {amount && showAmount ? `Due $${amount}` : "Payment due"}
    </Badge>
  );
}

export default PaymentStatusBadge;
