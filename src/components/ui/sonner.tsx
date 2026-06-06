import { Toaster as Sonner, type ToasterProps } from "sonner";

export function Toaster(props: ToasterProps) {
  return (
    <Sonner
      className="toaster group"
      style={{ "--width": "360px" } as React.CSSProperties}
      {...props}
    />
  );
}
