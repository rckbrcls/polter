import type { ComponentProps, JSX, ReactNode } from "react";
import { CircleDotIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { OUTPUT_HEIGHT } from "./constants.js";

type CardProps = ComponentProps<typeof Card>;

export function SurfaceCard({ className, ...props }: CardProps): JSX.Element {
  return (
    <Card
      className={cn("border border-border/60 bg-card/90 shadow-none backdrop-blur-sm", className)}
      {...props}
    />
  );
}

export function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}): JSX.Element {
  return (
    <Empty className="min-h-[14rem] rounded-4xl border-border/60 bg-muted/10">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <CircleDotIcon className="size-4" />
        </EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription>{description}</EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}

export function OutputPanel({
  label,
  value,
  placeholder,
  className,
}: {
  label: string;
  value: string;
  placeholder: string;
  className?: string;
}): JSX.Element {
  return (
    <div className="grid gap-2">
      <Label className="text-xs font-medium uppercase tracking-[0.22em] text-muted-foreground">
        {label}
      </Label>
      <ScrollArea
        className={cn(
          "rounded-3xl border border-border/60 bg-muted/20",
          OUTPUT_HEIGHT,
          className,
        )}
      >
        <pre className="p-4 font-mono text-xs leading-6 whitespace-pre-wrap text-foreground/90">
          {value || placeholder}
        </pre>
      </ScrollArea>
    </div>
  );
}

export function AppField({
  id,
  label,
  description,
  children,
  className,
}: {
  id: string;
  label: string;
  description?: string;
  children: ReactNode;
  className?: string;
}): JSX.Element {
  return (
    <Field className={className}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      {description ? <FieldDescription>{description}</FieldDescription> : null}
      {children}
    </Field>
  );
}
