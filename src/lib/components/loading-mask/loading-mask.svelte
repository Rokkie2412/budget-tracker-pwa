<script lang="ts">
  import type { Props } from "./loading-mask.types";

  let { size = "xl", text = "Loading..." }: Props = $props();
</script>

<div
  class="flex flex-col items-center justify-center w-full h-screen bg-base-100/10 backdrop-blur-xs z-50 fixed top-0 left-0"
>
  <span class={`loading loading-spinner loading-${size}`}></span>
  <p class="ml-3 text-lg font-medium text-base-content">{text}</p>
</div>
