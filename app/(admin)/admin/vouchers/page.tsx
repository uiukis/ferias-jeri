import { Card, CardContent } from "@/components/ui/card";
import Skeleton from "@/components/ui/skeleton";
import { Suspense } from "react";

export default function Page() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center p-8">
          <Card>
            <CardContent className="p-6 space-y-2">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-32" />
            </CardContent>
          </Card>
        </main>
      }
    >
      <main className="flex min-h-screen items-center justify-center p-8">
        <h1 className="text-2xl font-semibold">Admin · Vouchers</h1>
      </main>
    </Suspense>
  );
}
