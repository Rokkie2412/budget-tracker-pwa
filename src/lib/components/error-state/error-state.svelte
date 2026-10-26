<script lang="ts">
  import { t } from "../../../stores";

  type ErrorVariant = "default" | "network" | "server" | "notFound" | "empty";

  interface Props {
    title?: string;
    description?: string;
    errorCode?: number | string;
    onRetry?: () => void;
    onSecondaryAction?: () => void;
    retryText?: string;
    secondaryText?: string;
    variant?: ErrorVariant;
    showIconBadge?: boolean;
  }

  let {
    title,
    description,
    errorCode,
    onRetry,
    onSecondaryAction,
    retryText,
    secondaryText,
    variant = "default",
    showIconBadge = true,
  }: Props = $props();

  const resolvedTitle = $derived(title ?? t("serverError"));
  const resolvedDescription = $derived(description ?? t("serverError"));
  const resolvedRetryText = $derived(
    retryText ?? t("loading").replace("...", ""),
  );
  const resolvedSecondaryText = $derived(secondaryText ?? "Go Back");

  const BASE_COLOR = "#18181b"; // zinc-900

  // Icon path data per variant
  const iconPath = $derived((): string => {
    switch (variant) {
      case "network":
        // wifi-off
        return "M1 6C5.4 1.6 12 1 17 4M5 10a7 7 0 0 1 9.5-1M10.7 13.4A3 3 0 0 1 13 16m-5.3-6.3L1 1m22 22-4.5-4.5M8.5 16.5 10 18l2-2.5";
      case "server":
        // server-crash
        return "M6 9h8M6 6h2m8 0h2M2 3h20v6H2zm0 12h20v6H2zM6 18h2m8 0h2M10 9l1.5 3L13 9";
      case "notFound":
      case "empty":
        // file-question
        return "M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2zM14 2v6h6M10 17h.01M10 11a2 2 0 0 1 2 2v1";
      default:
        // alert-triangle
        return "M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01";
    }
  });
</script>

<div class="flex w-full flex-1 flex-col items-center justify-center px-6 py-8">
  <!-- Illustration -->
  {#if showIconBadge}
    <div class="relative flex h-52 w-52 items-center justify-center">
      <!-- Background SVG decorations -->
      <svg
        width="208"
        height="208"
        viewBox="0 0 208 208"
        class="absolute inset-0"
        aria-hidden="true"
      >
        <circle
          cx="104"
          cy="104"
          r="58"
          fill={BASE_COLOR}
          fill-opacity="0.04"
        />
        <!-- Orbiting micro-elements -->
        <rect
          x="100"
          y="12"
          width="8"
          height="8"
          rx="2"
          fill={BASE_COLOR}
          fill-opacity="0.3"
          transform="rotate(45 104 16)"
        />
        <circle cx="188" cy="116" r="3.5" fill="#EF4444" fill-opacity="0.8" />
        <circle cx="24" cy="92" r="3" fill={BASE_COLOR} fill-opacity="0.35" />
        <circle
          cx="164"
          cy="50"
          r="2.5"
          fill={BASE_COLOR}
          fill-opacity="0.25"
        />
        <circle cx="44" cy="154" r="3" fill="#EF4444" fill-opacity="0.5" />
        <!-- Decorative cross -->
        <path
          d="M 148 160 L 156 160 M 152 156 L 152 164"
          stroke={BASE_COLOR}
          stroke-width="1.5"
          stroke-opacity="0.2"
          stroke-linecap="round"
        />
      </svg>

      <!-- Ambient glow -->
      <div
        class="absolute h-36 w-36 rounded-full blur-2xl"
        style="background-color: {BASE_COLOR}; opacity: 0.12;"
      ></div>

      <!-- Shield plate -->
      <div
        class="relative flex h-24 w-24 items-center justify-center rounded-3xl shadow-lg"
        style="background-color: {BASE_COLOR};"
      >
        <!-- Inner glass ring -->
        <div
          class="flex h-20 w-20 items-center justify-center rounded-2xl border border-white/20 bg-white/10"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="36"
            height="36"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <path d={iconPath()} />
          </svg>
        </div>

        <!-- Red accent dot -->
        <div
          class="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full border-2 border-white bg-red-500"
        >
          <div class="h-1.5 w-1.5 rounded-full bg-white"></div>
        </div>
      </div>
    </div>
  {/if}

  <!-- Error code badge -->
  {#if errorCode !== undefined}
    <div
      class="mb-2.5 flex flex-row items-center gap-1.5 rounded-full border border-zinc-900/15 bg-zinc-900/10 px-3 py-1"
    >
      <div class="h-2 w-2 rounded-full bg-red-500"></div>
      <span class="text-xs font-semibold tracking-wider text-zinc-900">
        {typeof errorCode === "number" ? `CODE ${errorCode}` : errorCode}
      </span>
    </div>
  {/if}

  <!-- Title -->
  <h2
    class="mb-2 mt-2 text-center text-2xl font-bold tracking-tight text-zinc-900"
  >
    {resolvedTitle}
  </h2>

  <!-- Description -->
  <p
    class="mb-6 max-w-xs text-center text-sm font-medium leading-relaxed text-zinc-500"
  >
    {resolvedDescription}
  </p>

  <!-- Action buttons -->
  <div class="flex w-full max-w-xs flex-col gap-3">
    {#if onRetry}
      <button
        type="button"
        onclick={onRetry}
        class="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-zinc-900 text-base font-semibold text-white transition-opacity hover:opacity-90 active:opacity-80"
      >
        <!-- RefreshCw icon -->
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2.2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
          <path d="M21 3v5h-5" />
          <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
          <path d="M8 16H3v5" />
        </svg>
        {resolvedRetryText}
      </button>
    {/if}

    {#if onSecondaryAction}
      <button
        type="button"
        onclick={onSecondaryAction}
        class="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-transparent text-sm font-semibold text-zinc-900 transition-opacity hover:bg-zinc-50 active:opacity-70"
      >
        <!-- ArrowLeft icon -->
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path d="m12 19-7-7 7-7" />
          <path d="M19 12H5" />
        </svg>
        {resolvedSecondaryText}
      </button>
    {/if}
  </div>
</div>
