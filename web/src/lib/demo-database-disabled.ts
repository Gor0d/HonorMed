export const physician = "11111111-1111-4111-8111-111111111111";
export const database: typeof import("../../scripts/database.mjs").database =
  async () => {
    throw new Error("Banco demonstrativo indisponível em produção.");
  };
