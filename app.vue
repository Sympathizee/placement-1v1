<template>
  <div class="relative min-h-screen bg-[#030712] text-slate-50 font-sans selection:bg-primary/30 antialiased overflow-x-hidden">
    <!-- Ambient Background Effect -->
    <div class="fixed inset-0 pointer-events-none">
      <div class="absolute -top-[25%] -left-[10%] w-[50vw] h-[50vh] rounded-full bg-primary/10 blur-[120px]"></div>
      <div class="absolute -bottom-[25%] -right-[10%] w-[50vw] h-[50vh] rounded-full bg-indigo-500/10 blur-[120px]"></div>
      <div class="absolute top-[20%] left-[60%] w-[30vw] h-[30vh] rounded-full bg-purple-500/5 blur-[100px]"></div>
    </div>
    
    <div class="relative z-10">
      <NuxtLayout>
        <NuxtPage />
      </NuxtLayout>
    </div>
  </div>
</template>
