import { it, expect } from "vitest";
import { feedbackHref, feedbackKinds } from "../src/lib/feedback";
it("gera somente categoria permitida, sem conta, finanças ou texto livre anexado", () => {
  for (const kind of feedbackKinds) {
    const url = new URL(feedbackHref(kind));
    expect(url.protocol).toBe("mailto:");
    expect([...url.searchParams.keys()].sort()).toEqual(["body", "subject"]);
    expect(url.searchParams.get("body")).toContain(kind);
    expect(url.searchParams.get("body")).toContain("sem incluir valores");
  }
  expect(() => feedbackHref("valor=999;local=Hospital")).toThrow();
});
