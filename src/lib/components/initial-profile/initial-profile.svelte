<script lang="ts">
  import type { Props } from "./initial-profile.types";

  let { name }: Props = $props();
  const initials = $derived.by(() => {
    const words = name.trim().split(/\s+/).filter(Boolean);

    if (words.length === 0) return "";
    if (words.length === 1) return words[0][0].toUpperCase();

    return `${words[0][0]}${words[words.length - 1][0]}`.toUpperCase();
  });
</script>

<div class="flex flex-col items-center gap-2">
  <div
    class="flex size-24 items-center justify-center rounded-full bg-amber-700 text-4xl font-semibold text-primary-content"
  >
    {initials}
  </div>
  <p class="text-lg font-medium text-base-content">{name}</p>
</div>
