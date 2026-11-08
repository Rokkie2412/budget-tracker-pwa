<script>
  import "../app.css";

  import { onMount } from "svelte";

  import { afterNavigate, beforeNavigate, goto } from "$app/navigation";
  import { page } from "$app/state";

  import { ToastContainer } from "@/lib/components";
  import { checkAuth } from "@/lib/services/auth";
  import {
    language,
    loadAutoCategorization,
    loadLanguage,
    loadTheme,
    theme,
    t,
  } from "@/stores";

  let { children } = $props();
  let navigationCheck = 0;
  let authCheckPending = $state(true);
  let pullDistance = $state(0);
  let isRefreshing = $state(false);
  let pullTracking = false;
  let pullStartX = 0;
  let pullStartY = 0;
  /** @type {HTMLElement | null} */
  let pullScroller = null;

  const isPullRefreshDisabled = () =>
    authCheckPending ||
    isRefreshing ||
    page.url.pathname === "/dashboard/profile" ||
    Boolean(document.querySelector("dialog[open]"));

  /** @param {EventTarget | null} target */
  const findScrollContainer = (target) => {
    let element = target instanceof Element ? target : null;

    while (element && element !== document.body) {
      const overflowY = window.getComputedStyle(element).overflowY;
      if (
        (overflowY === "auto" || overflowY === "scroll") &&
        element.scrollHeight > element.clientHeight
      ) {
        return /** @type {HTMLElement} */ (element);
      }
      element = element.parentElement;
    }

    return /** @type {HTMLElement} */ (
      document.scrollingElement ?? document.documentElement
    );
  };

  const resetPullGesture = () => {
    pullTracking = false;
    pullDistance = 0;
    pullScroller = null;
  };

  /** @param {TouchEvent} event */
  const handleTouchStart = (event) => {
    if (isPullRefreshDisabled() || event.touches.length !== 1) return;

    const target = event.target instanceof Element ? event.target : null;
    if (target?.closest("input, textarea, select, [contenteditable='true']")) return;

    const touch = event.touches[0];
    if (touch.clientY > window.innerHeight - 80) return;

    pullScroller = findScrollContainer(target);
    if (pullScroller.scrollTop > 0) return;

    pullStartX = touch.clientX;
    pullStartY = touch.clientY;
    pullTracking = true;
  };

  /** @param {TouchEvent} event */
  const handleTouchMove = (event) => {
    if (!pullTracking || isPullRefreshDisabled() || event.touches.length !== 1) return;

    const touch = event.touches[0];
    const deltaX = touch.clientX - pullStartX;
    const deltaY = touch.clientY - pullStartY;

    if (deltaY <= 0 || Math.abs(deltaX) > Math.abs(deltaY)) {
      resetPullGesture();
      return;
    }
    if (pullScroller && pullScroller.scrollTop > 0) {
      resetPullGesture();
      return;
    }

    if (deltaY > 4) event.preventDefault();
    pullDistance = Math.min(84, Math.max(0, (deltaY - 4) * 0.72));
  };

  const handleTouchEnd = () => {
    if (!pullTracking) return;

    pullTracking = false;
    pullScroller = null;
    if (pullDistance >= 64) {
      isRefreshing = true;
      pullDistance = 72;
      window.setTimeout(() => window.location.reload(), 280);
    } else {
      pullDistance = 0;
    }
  };

  const checkRouteAuth = async () => {
    const pathname = page.url.pathname;
    const checkId = ++navigationCheck;
    let hasAuth = false;
    try {
      const auth = await checkAuth();
      hasAuth = auth !== null;
    } catch (error) {
      console.error("Failed to check saved authentication", error);
      hasAuth = false;
    }

    if (checkId !== navigationCheck || page.url.pathname !== pathname) {
      return;
    }

    const isLoginOrHome = pathname === "/" || pathname === "/login";
    const loginRoute = pathname === "/" || pathname.startsWith("/dashboard");

    if (hasAuth && isLoginOrHome) {
      await goto("/dashboard", { replaceState: true });
    } else if (!hasAuth && loginRoute) {
      await goto("/login", { replaceState: true });
    } else {
      authCheckPending = false;
    }
  };

  beforeNavigate(({ from, to }) => {
    if (
      to &&
      (to.url.pathname === "/" ||
        to.url.pathname === "/login" ||
        to.url.pathname.startsWith("/dashboard"))
    ) {
      const movingWithinDashboard =
        from?.url.pathname.startsWith("/dashboard") &&
        to.url.pathname.startsWith("/dashboard");

      if (!movingWithinDashboard) {
        authCheckPending = true;
      }
    }
  });

  afterNavigate(() => {
    void checkRouteAuth();
  });

  onMount(() => {
    loadLanguage();
    loadTheme();
    loadAutoCategorization();

    document.addEventListener("touchstart", handleTouchStart, { passive: true });
    document.addEventListener("touchmove", handleTouchMove, { passive: false });
    document.addEventListener("touchend", handleTouchEnd, { passive: true });
    document.addEventListener("touchcancel", resetPullGesture, { passive: true });

    return () => {
      document.removeEventListener("touchstart", handleTouchStart);
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleTouchEnd);
      document.removeEventListener("touchcancel", resetPullGesture);
    };
  });
</script>

<div data-theme={$theme} class="min-h-dvh bg-white text-zinc-900 dark:bg-zinc-900 dark:text-zinc-100">
  {#if authCheckPending}
    <main
      class="flex min-h-dvh items-center justify-center bg-zinc-100 dark:bg-zinc-800"
      role="status"
      aria-label="Checking authentication"
    >
      <span class="size-8 animate-spin rounded-full border-2 border-zinc-700 border-r-transparent dark:border-zinc-300" aria-hidden="true"></span>
    </main>
  {:else}
    {@render children()}
  {/if}
  {#if isRefreshing || pullDistance > 4}
    <div
      class="pull-refresh-indicator"
      style={`--pull-offset: ${isRefreshing ? 72 : pullDistance}px; --pull-angle: ${Math.min(pullDistance / 64, 1) * 180}deg`}
      role={isRefreshing ? "status" : undefined}
      aria-label={isRefreshing ? t("loading", $language) : undefined}
      aria-hidden={isRefreshing ? undefined : "true"}
    >
      <svg
        aria-hidden="true"
        class="pull-refresh-icon size-5"
        class:is-refreshing={isRefreshing}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="M20 11a8 8 0 0 0-14.8-3L4 10" />
        <path d="M4 5v5h5" />
        <path d="M4 13a8 8 0 0 0 14.8 3L20 14" />
        <path d="M20 19v-5h-5" />
      </svg>
    </div>
  {/if}
  <ToastContainer />
</div>
