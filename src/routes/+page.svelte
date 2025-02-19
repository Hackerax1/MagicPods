<script>
  import LoginModal from '../lib/components/LoginModal.svelte';
  import RegisterModal from '../lib/components/RegisterModal.svelte';
  import { onMount } from 'svelte';
  
  let showLoginModal = false;
  let showRegisterModal = false;

  function toggleLoginModal() {
    showLoginModal = !showLoginModal;
  }

  function toggleRegisterModal() {
    showRegisterModal = !showRegisterModal;
  }
</script>

<h1>Welcome to My Svelte App</h1>

<nav>
  <ul style="display: flex; justify-content: center; list-style-type: none; padding: 0;">
    <li style="margin: 0 10px;"><button class="nav-button" on:click={toggleRegisterModal}>Register</button></li>
    <li style="margin: 0 10px;"><button class="nav-button" on:click={toggleLoginModal}>Login</button></li>
  </ul>
</nav>

<LoginModal onClose={toggleLoginModal} showModal={showLoginModal} />
<RegisterModal onClose={toggleRegisterModal} showModal={showRegisterModal} />

<style>
  :global(body) {
    margin: 0;
    font-family: Arial, sans-serif;
    background: url('/path/to/your/background-image.jpg') no-repeat center center fixed;
    background-size: cover;
  }

  h1 {
    text-align: center;
    color: #fff;
    margin-top: 50px;
    font-size: 3em;
    text-shadow: 2px 2px 4px #000;
  }

  nav {
    margin-top: 20px;
  }

  .nav-button {
    padding: 10px 20px;
    font-size: 16px;
    background-color: rgba(0, 123, 255, 0.8);
    color: white;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    transition: background-color 0.3s, transform 0.3s;
  }

  .nav-button:hover {
    background-color: rgba(0, 86, 179, 0.8);
    transform: scale(1.05);
  }

  p {
    text-align: center;
    color: #fff;
    font-size: 1.2em;
    text-shadow: 1px 1px 2px #000;
    margin-top: 30px;
  }
</style>

<p>This application allows you to manage your deck and perform various actions.</p>
