import QuickRegister from "@/components/quick-register";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ modulo?: string }>;
}) {
  const requested = (await searchParams).modulo;
  return <QuickRegister requestedModule={requested === "laudos" ? "laudos" : "consultas"} />;
}
