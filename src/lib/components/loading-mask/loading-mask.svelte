<script lang="ts">
  import type { Props } from "./loading-mask.types";

  let { size = "xl", text = "Loading..." }: Props = $props();
  const spinnerSizes = {
    xs: "size-3",
    sm: "size-4",
    md: "size-6",
    lg: "size-8",
    xl: "size-10",
  } as const;
</script>

<div
  class="fixed inset-0 z-50 flex h-dvh w-full flex-col items-center justify-center bg-white/10 backdrop-blur-xs"
>
  <span class={`${spinnerSizes[size]} animate-spin rounded-full border-2 border-emerald-700 border-r-transparent`} aria-hidden="true"></span>
  <p class="ml-3 text-lg font-medium text-zinc-900 dark:text-zinc-100">{text}</p>
</div>
