import { requireAuth, requireFirstAccessChange } from "@/lib/route-guards";

export default async function SellerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAuth();
  await requireFirstAccessChange();
  return children;
}
