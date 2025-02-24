<script>
  import LoginModal from '../lib/components/LoginModal.svelte';
  import RegisterModal from '../lib/components/RegisterModal.svelte';
</script>

<h1>Welcome to MagicPods</h1>

<div class="container">
  <div class="form-container">
    <RegisterModal showModal={true} onClose={() => { /* handle close */ }} />
  </div>
  <div class="separator"></div>
  <div class="form-container">
    <LoginModal showModal={true} onClose={() => { /* handle close */ }} />
  </div>
</div>

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

  .container {
    display: flex;
    justify-content: center;
    align-items: flex-start;
    margin-top: 20px;
  }

  .form-container {
    background-color: rgba(255, 255, 255, 0.9);
    padding: 20px;
    border-radius: 10px;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    width: 45%;
    margin: 0 10px;
  }

  .separator {
    width: 1px;
    background-color: rgba(0, 0, 0, 0.1);
    height: auto;
    margin: 0 20px;
  }
</style>

<p>This application allows you to manage your deck and perform various actions.</p>
