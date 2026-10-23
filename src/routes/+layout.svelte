<script>
  import "../app.css";

  import { onMount } from "svelte";

  import { afterNavigate, beforeNavigate, goto } from "$app/navigation";
  import { page } from "$app/state";

  import { ToastContainer } from "../lib/components";
  import { checkAuth } from "../lib/services/auth";
  import { loadLanguage } from "../stores";

  let { children } = $props();
  let navigationCheck = 0;
  let authCheckPending = $state(true);

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

  beforeNavigate(({ to }) => {
    if (
      to &&
      (to.url.pathname === "/" ||
        to.url.pathname === "/login" ||
        to.url.pathname.startsWith("/dashboard"))
    ) {
      authCheckPending = true;
    }
  });

  afterNavigate(() => {
    void checkRouteAuth();
  });

  onMount(() => {
    loadLanguage();
  });
</script>

{#if authCheckPending}
  <main
    class="flex min-h-dvh items-center justify-center bg-zinc-100"
    role="status"
    aria-label="Checking authentication"
  >
    <span class="loading loading-spinner loading-lg text-zinc-700"></span>
  </main>
{:else}
  {@render children()}
{/if}
<ToastContainer />
