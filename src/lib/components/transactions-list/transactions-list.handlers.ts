import { CATEGORY_EMOJIS_EXPENSE, CATEGORY_EMOJIS_INCOME } from "@/constants";

export const getCategoryEmoji =(category?: string, type: "IN" | "OUT" = "OUT"): string => {
  if (!category) return type === "IN" ? "📥" : "📦";

  if (type === "IN") {
    return (
      CATEGORY_EMOJIS_INCOME[
        category as keyof typeof CATEGORY_EMOJIS_INCOME
      ] ?? "📥"
    );
  }

  return (
    CATEGORY_EMOJIS_EXPENSE[
      category as keyof typeof CATEGORY_EMOJIS_EXPENSE
    ] ?? "📦"
  );
}
