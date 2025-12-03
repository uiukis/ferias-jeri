import { cn } from "@/lib/utils";

export function PageContainer({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("mx-auto w-[95%] max-w-5xl", className)} {...props} />
  );
}

export function PageHeader({
  title,
  right,
}: {
  title: string;
  right?: React.ReactNode;
}) {
  return (
    <PageContainer className="flex items-center justify-between">
      <h1 className="text-3xl font-bold tracking-tight text-foreground">
        {title}
      </h1>
      {right}
    </PageContainer>
  );
}
