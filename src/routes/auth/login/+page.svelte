<script>
  import { supabase } from '$lib/supabaseClient';
  import { goto } from '$app/navigation';

  let email = '';
  let password = '';
  let rememberMe = false;
  let error = '';
  let loading = false;

  async function handleSubmit() {
    error = '';
    loading = true;

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    loading = false;

    if (signInError) {
      error = signInError.message;
    } else {
      goto('/app');
    }
  }

  async function handleForgotPassword() {
    error = '';

    if (!email) {
      error = 'Please enter your email first.';
      return;
    }

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'http://localhost:5173/auth/reset-password'
    });

    if (resetError) {
      error = resetError.message;
    } else {
      error = 'Password reset email sent. Please check your inbox.';
    }
  }
</script>


<div style="min-height:100vh;display:flex;align-items:center;justify-content:center;">
  <form
    on:submit|preventDefault={handleSubmit}
    style="border:1px solid #ddd;padding:24px;border-radius:8px;width:320px;"
  >
    <h1 style="font-size:24px;margin-bottom:16px;text-align:center;">Login</h1>

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
        style="width:100%;margin:4px 0 8px;padding:6px;"
      />
    </label>

    <label style="font-size:14px;">
      <input type="checkbox" bind:checked={rememberMe} />
      Remember me
    </label>

    <div style="font-size:12px;margin:6px 0 12px;text-align:right;">
   <button
  type="button"
  on:click={handleForgotPassword}
  style="border:none;background:none;color:#2563eb;cursor:pointer;font-size:12px;padding:0;"
>
  Forgot password?
</button>

    </div>

    <button
      type="submit"
      disabled={loading}
      style="width:100%;padding:8px;border:none;border-radius:4px;background:#2563eb;color:white;"
    >
      {#if loading}Logging in...{/if}
      {#if !loading}Login{/if}
    </button>

    <p style="margin-top:12px;font-size:14px;text-align:center;">
      Don't have an account?
      <a href="/auth/register">Sign Up</a>
    </p>
  </form>
</div>
