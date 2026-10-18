import App from "@/components/app";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ area?: string; modulo?: string }>;
}) {
  const query = await searchParams;
  return (
    <App
      startInSettings={query.area === "ajustes"}
      initialModule={query.modulo === "laudos" ? "laudos" : "consultas"}
    />
  );
}
