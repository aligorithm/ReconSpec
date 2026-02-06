import type { HttpMethod } from "@reconspec/shared";

interface MethodBadgeProps {
  method: HttpMethod;
  variant?: "normal" | "mini";
}

export function MethodBadge({ method, variant = "normal" }: MethodBadgeProps): JSX.Element {
  const className = `method-badge method-${method}${variant === "mini" ? " mini" : ""}`;

  return <span className={className}>{method.toUpperCase()}</span>;
}
