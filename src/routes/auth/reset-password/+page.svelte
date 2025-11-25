<script>
  import { supabase } from '$lib/supabaseClient';
  import { goto } from '$app/navigation';

  let password = '';
  let confirmPassword = '';
  let message = '';
  let error = '';
  let loading = false;

  async function handleReset() {
    error = '';
    message = '';

    if (password.length < 6) {
      error = 'Password must be at least 6 characters.';
      return;
    }
    if (password !== confirmPassword) {
      error = 'Passwords do not match.';
      return;
    }

    loading = true;
    const { data, error: updateError } = await supabase.auth.updateUser({ password });
    loading = false;

    if (updateError) {
      error = updateError.message;
    } else {
      message = 'Password updated successfully. Redirecting to login...';
      setTimeout(() => goto('/auth/login'), 1500);
    }
  }
</script>

<div style="min-height:100vh;display:flex;align-items:center;justify-content:center;">
  <form
    on:submit|preventDefault={handleReset}
    style="border:1px solid #ddd;padding:24px;border-radius:8px;width:320px;"
  >
    <h1 style="font-size:24px;margin-bottom:16px;text-align:center;">Reset Password</h1>

    {#if error}
      <p style="color:red;font-size:14px;margin-bottom:8px;">{error}</p>
    {/if}
    {#if message}
      <p style="color:green;font-size:14px;margin-bottom:8px;">{message}</p>
    {/if}

    <label>
      New password<br />
      <input
        type="password"
        bind:value={password}
        required
        style="width:100%;margin:4px 0 12px;padding:6px;"
      />
    </label>

    <label>
      Confirm password<br />
      <input
        type="password"
        bind:value={confirmPassword}
        required
        style="width:100%;margin:4px 0 16px;padding:6px;"
      />
    </label>

    <button
      type="submit"
      disabled={loading}
      style="width:100%;padding:8px;border:none;border-radius:4px;background:#2563eb;color:white;"
    >
      {#if loading}Saving...{/if}
      {#if !loading}Reset Password{/if}
    </button>
  </form>
</div>
