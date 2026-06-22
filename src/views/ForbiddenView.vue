<template>
  <main class="error-page min-h-screen px-6 text-stone-100">
    <section class="error-page-inner">
      <p class="forbidden-message">Unfortunately, you are not authorized to view this page.</p>
      <RouterLink class="forbidden-home-button" :to="{ name: 'home' }" aria-label="Return to home page">
        Home
      </RouterLink>
    </section>
  </main>
</template>
