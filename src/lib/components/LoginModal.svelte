<script lang="ts">
  export let showModal = false;
  export let onClose;

  let identifier = '';
  let password = '';

  const handleLogin = async () => {
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password })
      });
      const result = await response.json();
      if (!response.ok) {
        alert('Login failed: Invalid credentials.');
      } else {
        alert('Login successful!');
        onClose();
      }
    } catch (error) {
      console.error('Login error:', error);
      alert('Failed to login.');
    }
  };
</script>

{#if showModal}
  <div class="modal">
    <h2>Login</h2>
    <form on:submit|preventDefault={handleLogin}>
      <label for="identifier">Username or Email:</label>
      <input type="text" id="identifier" bind:value={identifier} required />
      <label for="password">Password:</label>
      <input type="password" id="password" bind:value={password} required />
      <div class="button-container">
        <button type="submit">Login</button>
        <button type="button" on:click={onClose}>Close</button>
      </div>
    </form>
  </div>
{/if}

<style>
  .modal {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: white;
    padding: 32px;
    border-radius: 12px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
    width: 400px;
    max-width: 90%;
  }

  .modal h2 {
    text-align: center;
    margin-bottom: 24px;
    font-size: 24px;
    color: #333;
  }

  .modal form {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .modal label {
    font-weight: 500;
    color: #555;
  }

  .modal input {
    padding: 8px 12px;
    border: 1px solid #ddd;
    border-radius: 6px;
    font-size: 14px;
  }

  .modal button {
    padding: 10px 16px;
    border: none;
    border-radius: 6px;
    font-size: 14px;
    cursor: pointer;
    transition: background-color 0.2s;
  }

  .modal button[type="submit"] {
    background-color: #007bff;
    color: white;
  }

  .modal button[type="submit"]:hover {
    background-color: #0056b3;
  }

  .modal button[type="button"] {
    background-color: #f8f9fa;
    color: #333;
  }

  .modal button[type="button"]:hover {
    background-color: #e2e6ea;
  }
</style>
