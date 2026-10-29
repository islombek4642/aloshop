import { redirect } from "next/navigation";

interface InventoryRedirectPageProps {
  params: Promise<{ locale: string }>;
}

export default async function AdminInventoryRedirectPage({
  params,
}: InventoryRedirectPageProps) {
  const { locale } = await params;
  redirect(`/${locale}/admin/branches`);
}
