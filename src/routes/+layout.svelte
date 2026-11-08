<script>
  import "../app.css";

  import { App } from "@capacitor/app";
  import { Capacitor } from "@capacitor/core";
  import { Keyboard, KeyboardResize } from "@capacitor/keyboard";
  import { StatusBar, Style } from "@capacitor/status-bar";
  import { onMount } from "svelte";

  import { afterNavigate, beforeNavigate, goto } from "$app/navigation";
  import { page } from "$app/state";

  import { ToastContainer } from "@/lib/components";
  import { checkAuth, setAuth } from "@/lib/services/auth";
  import { createSupabaseClient } from "@/lib/services/supabase";
  import {
    language,
    loadAutoCategorization,
    loadLanguage,
    loadTheme,
    t,
    theme,
  } from "@/stores";

  let { children } = $props();
  let navigationCheck = 0;
  let authCheckPending = $state(true);
  let pullDistance = $state(0);
  let isRefreshing = $state(false);
  let pullTracking = false;
  let pullStartX = 0;
  let pullStartY = 0;
  let handledDeepLink = "";
  /** @type {HTMLElement | null} */
  let pullScroller = null;

  /** @param {string} url */
  const handleAppUrl = async (url) => {
    if (url === handledDeepLink) return;

    try {
      const callbackUrl = new URL(url);
      const isNativeCallback =
        callbackUrl.protocol === "com.dompettracker.app:" &&
        callbackUrl.hostname === "login";
      const isWebCallback =
        !Capacitor.isNativePlatform() &&
        callbackUrl.origin === window.location.origin &&
        callbackUrl.pathname === "/login";
      if (!isNativeCallback && !isWebCallback) {
        return;
      }

      handledDeepLink = url;
      const auth = createSupabaseClient().auth;
      const code = callbackUrl.searchParams.get("code");
      /** @type {import("@supabase/supabase-js").Session | null} */
      let session = null;

      if (code) {
        const { data, error } = await auth.exchangeCodeForSession(code);
        if (error) throw error;
        session = data.session;
      } else {
        const callbackParams = new URLSearchParams(callbackUrl.hash.slice(1));
        const accessToken = callbackParams.get("access_token");
        const refreshToken = callbackParams.get("refresh_token");
        if (accessToken && refreshToken) {
          const { data, error } = await auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (error) throw error;
          session = data.session;
        }
      }

      if (!session?.user) {
        await goto("/login", { replaceState: true });
        return;
      }

      await setAuth({
        accessToken: session.access_token,
        refreshToken: session.refresh_token,
        expiresAt:
          session.expires_at ?? Math.floor(Date.now() / 1000) + session.expires_in,
        userId: session.user.id,
        email: session.user.email ?? "",
      });
      await goto("/dashboard", { replaceState: true });
    } catch (error) {
      console.error("Could not handle the authentication deep link", error);
      await goto("/login", { replaceState: true });
    }
  };

  const isPullRefreshDisabled = () =>
    authCheckPending ||
    isRefreshing ||
    page.url.pathname === "/dashboard/profile" ||
    Boolean(document.querySelector("dialog[open]"));

  /** @param {"light" | "dark"} mode */
  const syncStatusBarTheme = async (mode) => {
    try {
      await StatusBar.setOverlaysWebView({ overlay: true });
      await StatusBar.setBackgroundColor({
        color: mode === "dark" ? "#18181b" : "#ffffff",
      });
      await StatusBar.setStyle({
        style: mode === "dark" ? Style.Light : Style.Dark,
      });
    } catch (error) {
      console.error("Could not sync the status bar with the app theme", error);
    }
  };

  const handleKeyboardShow = () => {
    document.documentElement.dataset.keyboardOpen = "true";

    const focusedElement = document.activeElement;
    if (
      !(focusedElement instanceof HTMLElement) ||
      !focusedElement.matches("input, textarea, select, [contenteditable='true']")
    ) {
      return;
    }

    window.setTimeout(() => {
      if (focusedElement.isConnected) {
        focusedElement.scrollIntoView({
          behavior: "smooth",
          block: "center",
          inline: "nearest",
        });
      }
    }, 80);
  };

  const handleKeyboardHide = () => {
    delete document.documentElement.dataset.keyboardOpen;
  };

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

    const removeThemeListener =
      Capacitor.getPlatform() === "android"
        ? theme.subscribe((mode) => {
            void syncStatusBarTheme(mode);
          })
        : () => {};

    let active = true;
    /** @type {(() => void) | undefined} */
    let removeAppUrlListener;
    let removeKeyboardListeners = () => {};
    if (Capacitor.isNativePlatform()) {
      void App.addListener("appUrlOpen", ({ url }) => {
        void handleAppUrl(url);
      })
        .then((listener) => {
          if (!active) {
            void listener.remove();
            return;
          }
          removeAppUrlListener = () => void listener.remove();
        })
        .catch((error) => {
          console.error("Could not register the authentication deep-link listener", error);
        });

      void App.getLaunchUrl()
        .then((launch) => {
          if (launch?.url) return handleAppUrl(launch.url);
        })
        .catch((error) => {
          console.error("Could not read the app launch URL", error);
        });

      void Promise.all([
        Keyboard.addListener("keyboardDidShow", handleKeyboardShow),
        Keyboard.addListener("keyboardDidHide", handleKeyboardHide),
      ])
        .then((listeners) => {
          const removeListeners = () => {
            listeners.forEach((listener) => void listener.remove());
          };
          if (!active) {
            removeListeners();
            return;
          }
          removeKeyboardListeners = removeListeners;
        })
        .catch((error) => {
          console.error("Could not register keyboard listeners", error);
        });

      if (Capacitor.getPlatform() === "ios") {
        void Keyboard.setResizeMode({ mode: KeyboardResize.Native }).catch(
          (error) => {
            console.error("Could not configure keyboard resizing", error);
          },
        );
      }
    } else if (page.url.pathname === "/login") {
      void handleAppUrl(window.location.href);
    }

    document.addEventListener("touchstart", handleTouchStart, { passive: true });
    document.addEventListener("touchmove", handleTouchMove, { passive: false });
    document.addEventListener("touchend", handleTouchEnd, { passive: true });
    document.addEventListener("touchcancel", resetPullGesture, { passive: true });

    return () => {
      active = false;
      removeThemeListener();
      removeAppUrlListener?.();
      removeKeyboardListeners();
      handleKeyboardHide();
      document.removeEventListener("touchstart", handleTouchStart);
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleTouchEnd);
      document.removeEventListener("touchcancel", resetPullGesture);
    };
  });
</script>

<svelte:head>
  <meta
    name="theme-color"
    content={$theme === "dark" ? "#18181b" : "#ffffff"}
  />
</svelte:head>

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
