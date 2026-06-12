<template>
  <header class="fixed inset-x-0 top-0 z-30">
    <div class="mx-auto grid h-10 max-w-[1120px] grid-cols-[1fr_auto_1fr] items-start px-3">
      <nav
        class="header-wing justify-end rounded-bl-sm border-b border-[#4fc3ff]/70 bg-gradient-to-b from-[#182533]/95 to-[#091018]/95 pr-7"
      >
        <RouterLink class="header-link header-link-red" to="/Gamemaster">Gamemaster Info</RouterLink>
        <RouterLink class="header-link header-link-blue" to="/Characters">CH</RouterLink>
        <RouterLink class="header-link header-link-blue" to="/Planets">PL</RouterLink>
        <RouterLink class="header-link header-link-blue" to="/Factions">FA</RouterLink>
      </nav>

      <RouterLink to="/" class="relative -mx-5 block px-8 pt-3">
        <span class="sr-only">Dead Empire</span>
        <span class="logo-text">Dead</span>
        <span class="logo-sub">Empire</span>
      </RouterLink>

      <nav
        class="header-wing justify-start rounded-br-sm border-b border-[#4fc3ff]/70 bg-gradient-to-b from-[#182533]/95 to-[#091018]/95 pl-7"
      >
        <RouterLink class="header-link header-link-red" to="/Rules">Rules Reference</RouterLink>
        <RouterLink class="header-link header-link-red" to="/Game-Log">Game Log</RouterLink>
      </nav>
    </div>
  </header>
</template>
