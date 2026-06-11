<template>
  <div class="relative min-h-screen bg-[#030712] text-slate-50 font-sans selection:bg-primary/30 antialiased overflow-x-hidden">
    <!-- Animated Ambient Background Effect -->
    <div class="fixed inset-0 pointer-events-none overflow-hidden">
      <!-- Glow 1 (Top Left) -->
      <div class="absolute -top-[10%] -left-[10%] w-[50vw] h-[50vh] rounded-full bg-blue-600/15 blur-[120px] mix-blend-screen animate-aurora"></div>
      <!-- Glow 2 (Bottom Right) -->
      <div class="absolute -bottom-[10%] -right-[10%] w-[50vw] h-[50vh] rounded-full bg-indigo-600/15 blur-[120px] mix-blend-screen animate-aurora animation-delay-2000"></div>
      <!-- Glow 3 (Middle Right) -->
      <div class="absolute top-[20%] left-[50%] w-[40vw] h-[40vh] rounded-full bg-violet-600/15 blur-[120px] mix-blend-screen animate-aurora animation-delay-4000"></div>
    </div>
    
    <div class="relative z-10">
      <NuxtLayout>
        <NuxtPage />
      </NuxtLayout>
    </div>
  </div>
</template>

<style scoped>
@keyframes aurora {
  0% { transform: translate(0px, 0px) scale(1); }
  33% { transform: translate(4vw, -6vh) scale(1.1); }
  66% { transform: translate(-3vw, 4vh) scale(0.9); }
  100% { transform: translate(0px, 0px) scale(1); }
}

.animate-aurora {
  animation: aurora 20s infinite ease-in-out alternate;
  will-change: transform;
}

.animation-delay-2000 {
  animation-delay: -5s;
}

.animation-delay-4000 {
  animation-delay: -10s;
}
</style>
