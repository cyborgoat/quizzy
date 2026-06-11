import * as React from "react";
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

const Pagination = ({ className, ...props }: React.ComponentProps<"nav">) => (
  <nav
    role="navigation"
    aria-label="pagination"
    className={cn("mx-auto flex w-full justify-center", className)}
    {...props}
  />
);

const PaginationContent = React.forwardRef<
  HTMLUListElement,
  React.ComponentProps<"ul">
>(({ className, ...props }, ref) => (
  <ul ref={ref} className={cn("flex flex-row items-center gap-0.5", className)} {...props} />
));
PaginationContent.displayName = "PaginationContent";

const PaginationItem = React.forwardRef<
  HTMLLIElement,
  React.ComponentProps<"li">
>(({ className, ...props }, ref) => (
  <li ref={ref} className={cn("", className)} {...props} />
));
PaginationItem.displayName = "PaginationItem";

type PaginationLinkProps = {
  isActive?: boolean;
} & React.ComponentProps<"button">;

const PaginationLink = ({ className, isActive, ...props }: PaginationLinkProps) => (
  <button
    type="button"
    aria-current={isActive ? "page" : undefined}
    className={cn(
      "inline-flex size-6 items-center justify-center rounded text-[11px] font-medium transition-colors",
      isActive
        ? "bg-zinc-100 text-zinc-950"
        : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-950",
      "disabled:pointer-events-none disabled:opacity-40",
      className,
    )}
    {...props}
  />
);

const PaginationPrevious = ({
  className,
  ...props
}: React.ComponentProps<typeof PaginationLink>) => (
  <PaginationLink aria-label="Go to previous page" className={cn("size-6 p-0", className)} {...props}>
    <ChevronLeft className="size-3" />
  </PaginationLink>
);

const PaginationNext = ({
  className,
  ...props
}: React.ComponentProps<typeof PaginationLink>) => (
  <PaginationLink aria-label="Go to next page" className={cn("size-6 p-0", className)} {...props}>
    <ChevronRight className="size-3" />
  </PaginationLink>
);

const PaginationEllipsis = ({ className, ...props }: React.ComponentProps<"span">) => (
  <span
    aria-hidden
    aria-disabled="true"
    className={cn("pointer-events-none flex size-6 select-none items-center justify-center text-zinc-400", className)}
    {...props}
  >
    <MoreHorizontal className="size-3.5" />
    <span className="sr-only">More pages</span>
  </span>
);

export {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
};
