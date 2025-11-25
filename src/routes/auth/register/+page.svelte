<script>
  import { supabase } from '$lib/supabaseClient';
  import { goto } from '$app/navigation';

  let email = '';
  let password = '';
  let error = '';
  let loading = false;

  async function handleSubmit() {
    error = '';

    if (!email.includes('@')) {
      error = 'Please enter a valid email.';
      return;
    }
    if (password.length < 6) {
      error = 'Password must be at least 6 characters.';
      return;
    }

    loading = true;
    const { error: signUpError } = await supabase.auth.signUp({ email, password });
    loading = false;

    if (signUpError) {
      error = signUpError.message;
    } else {
      goto('/auth/login');
    }
  }
</script>

<div style="min-height:100vh;display:flex;align-items:center;justify-content:center;">
  <form
    on:submit|preventDefault={handleSubmit}
    style="border:1px solid #ddd;padding:24px;border-radius:8px;width:320px;"
  >
    <h1 style="font-size:24px;margin-bottom:16px;text-align:center;">Sign Up</h1>

    {#if error}
      <p style="color:red;font-size:14px;margin-bottom:8px;">{error}</p>
    {/if}

    <label>
      Email<br />
      <input
        type="email"
        bind:value={email}
        required
        style="width:100%;margin:4px 0 12px;padding:6px;"
      />
    </label>

    <label>
      Password<br />
      <input
        type="password"
        bind:value={password}
        required
        style="width:100%;margin:4px 0 16px;padding:6px;"
      />
    </label>

    <button
      type="submit"
      disabled={loading}
      style="width:100%;padding:8px;border:none;border-radius:4px;background:#2563eb;color:white;"
    >
      {#if loading}Creating account...{/if}
      {#if !loading}Sign Up{/if}
    </button>

    <p style="margin-top:12px;font-size:14px;text-align:center;">
      Already have an account?
      <a href="/auth/login">Login</a>
    </p>
  </form>
</div>
