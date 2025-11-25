<!-- src/routes/app/+layout.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { supabase } from '$lib/supabaseClient';

  let loading = true;
  let userEmail: string | null = null;

  async function checkAuth() {
    const { data, error } = await supabase.auth.getUser();

    if (error || !data.user) {
      goto('/auth/login');
      return;
    }

    userEmail = data.user.email ?? null;
    loading = false;
  }

  async function logout() {
    await supabase.auth.signOut();
    goto('/auth/login');
  }

  onMount(() => {
    checkAuth();
  });
</script>

{#if loading}
  <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;">
    <p>Checking session...</p>
  </div>
{:else}
  <div class="app-shell">
    <header class="topbar">
      <h1 class="topbar-title">Task Manager</h1>

      <div class="topbar-right">
        {#if userEmail}
          <span class="topbar-email">{userEmail}</span>
        {/if}
        <button type="button" class="btn btn-outline" on:click={logout}>
          Logout
        </button>
      </div>
    </header>

    <main class="app-main">
      <slot />
    </main>
  </div>
{/if}
