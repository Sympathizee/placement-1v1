<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useTournament } from '~/composables/useTournament'
import { useThreeScene } from '~/composables/useThreeScene'
import gsap from 'gsap'

const { tournament, games } = useTournament()

const bgCanvas = ref<HTMLCanvasElement | null>(null)
const { init, addGamePlanes, flyToGame, flyToOverview } = useThreeScene(bgCanvas)

// UI State
const expandedGameId = ref<string | null>(null)
const expandedGameObj = computed(() => games.value.find(g => g.id === expandedGameId.value))

const selectedPlayer = ref<1 | 2 | null>(null)
const mainUIContainer = ref<HTMLElement | null>(null)

// Scroll Lock state
let isAnimatingScroll = false

const openPlayer = (player: 1 | 2) => {
  selectedPlayer.value = player
}

const closePlayerModal = () => {
  selectedPlayer.value = null
}

const toggleExpand = (gameId: string, forceSwitch = false) => {
  if (expandedGameId.value === gameId && !forceSwitch) {
    // Go back to overview
    expandedGameId.value = null
    flyToOverview()
    
    // Restore normal UI
    gsap.to('.header-ui', { opacity: 1, y: 0, duration: 1, ease: 'power2.out' })
    const gamesElements = document.querySelectorAll('.game-item')
    gsap.to(gamesElements, { opacity: 1, y: 0, scale: 1, duration: 0.8, stagger: 0.05, ease: 'power3.out', onComplete: () => {
      gamesElements.forEach(el => { (el as HTMLElement).style.pointerEvents = 'auto' })
    }})
    document.body.style.overflow = 'auto'
  } else {
    // Focus on specific game
    const previousGameId = expandedGameId.value
    expandedGameId.value = gameId
    flyToGame(gameId)
    
    if (!previousGameId) {
      // Fade out header and list
      gsap.to('.header-ui', { opacity: 0, y: -20, duration: 0.5 })
      const gamesElements = document.querySelectorAll('.game-item')
      gamesElements.forEach(el => { (el as HTMLElement).style.pointerEvents = 'none' })
      gsap.to(gamesElements, { opacity: 0, y: 50, scale: 0.95, duration: 0.6, stagger: 0.05, ease: 'power3.in' })
    }

    // Lock body scroll to hijack wheel events
    document.body.style.overflow = 'hidden'
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}

// Intercept scroll when expanded
const handleWheel = (e: WheelEvent) => {
  if (expandedGameId.value !== null) {
    e.preventDefault()
    
    if (isAnimatingScroll) return

    // Scroll threshold
    if (Math.abs(e.deltaY) > 40) {
      const currentIndex = games.value.findIndex(g => g.id === expandedGameId.value)
      
      if (e.deltaY > 0 && currentIndex < games.value.length - 1) {
        // Scroll Down -> Next
        isAnimatingScroll = true
        toggleExpand(games.value[currentIndex + 1].id, true)
        setTimeout(() => { isAnimatingScroll = false }, 1800) // wait for fly animation
      } else if (e.deltaY < 0 && currentIndex > 0) {
        // Scroll Up -> Prev
        isAnimatingScroll = true
        toggleExpand(games.value[currentIndex - 1].id, true)
        setTimeout(() => { isAnimatingScroll = false }, 1800)
      } else if (e.deltaY < 0 && currentIndex === 0) {
        // Scroll Up at the top -> Go back to overview
        isAnimatingScroll = true
        toggleExpand(games.value[0].id) // this will collapse because it matches current id
        setTimeout(() => { isAnimatingScroll = false }, 1000)
      }
    }
  }
}

watch(games, (newGames) => {
  if (newGames && newGames.length > 0) {
    addGamePlanes(newGames)
  }
}, { deep: true, immediate: true })

onMounted(() => {
  if (bgCanvas.value) {
    init()
  }
  window.addEventListener('keydown', handleKeydown)
  window.addEventListener('wheel', handleWheel, { passive: false })
  
  // Initial GSAP animation
  gsap.from('.header-ui', { opacity: 0, y: 30, duration: 1.5, ease: 'power3.out', delay: 0.5 })
  gsap.from('.game-item', { opacity: 0, x: -30, duration: 1, stagger: 0.1, ease: 'power2.out', delay: 1 })
})

const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Escape') {
    if (selectedPlayer.value !== null) closePlayerModal()
    else if (expandedGameId.value !== null) toggleExpand(expandedGameId.value)
  }
}

const onEnterModal = (el: Element, done: () => void) => {
  const backdrop = el.querySelector('.player-modal-backdrop')
  const content = el.querySelector('.modal-content')
  const left = el.querySelector('.modal-left')
  const image = el.querySelector('.profile-image')
  const titleBlock = el.querySelector('.profile-title-block')
  const descBlock = el.querySelector('.desc-block')
  const statItems = el.querySelectorAll('.stat-item')
  
  const tl = gsap.timeline({ onComplete: done })
  
  tl.from(backdrop, { opacity: 0, duration: 0.4, ease: 'power2.out' })
    .from(content, { opacity: 0, y: 40, scale: 0.95, duration: 0.6, ease: 'power3.out' }, '-=0.2')
    .from(left, { x: -30, opacity: 0, duration: 0.6, ease: 'power3.out' }, '-=0.4')
    .from(image, { scale: 1.15, filter: 'grayscale(100%)', duration: 1, ease: 'power2.out' }, '-=0.6')
    .from(titleBlock, { x: -20, opacity: 0, duration: 0.5, ease: 'power2.out' }, '-=0.8')
    .from(descBlock, { y: 20, opacity: 0, duration: 0.5, ease: 'power2.out' }, '-=0.6')
    .from(statItems, { y: 20, opacity: 0, stagger: 0.1, duration: 0.5, ease: 'back.out(1.2)' }, '-=0.4')
}

const onLeaveModal = (el: Element, done: () => void) => {
  const backdrop = el.querySelector('.player-modal-backdrop')
  const content = el.querySelector('.modal-content')
  
  const tl = gsap.timeline({ onComplete: done })
  tl.to(content, { opacity: 0, y: 20, scale: 0.95, duration: 0.3, ease: 'power2.in' })
    .to(backdrop, { opacity: 0, duration: 0.3, ease: 'power2.in' }, '-=0.1')
}

const onEnterStageOverlay = (el: Element, done: () => void) => {
  const content = el.querySelector('.stage-overlay-content')
  const progressTrack = el.querySelector('.progress-track')
  const matchCards = el.querySelectorAll('.match-card')
  const noData = el.querySelector('.no-data')
  
  const tl = gsap.timeline({ onComplete: done })
  
  tl.fromTo(content, { opacity: 0, y: 50, scale: 0.95 }, { opacity: 1, y: 0, scale: 1, duration: 0.6, ease: 'power3.out' })
  if (progressTrack) {
    tl.fromTo(progressTrack, { scaleX: 0, opacity: 0 }, { scaleX: 1, opacity: 1, duration: 0.6, ease: 'power3.out' }, '-=0.3')
  }
  if (matchCards.length) {
    tl.fromTo(matchCards, { y: 20, opacity: 0, scale: 0.9 }, { y: 0, opacity: 1, scale: 1, stagger: 0.1, duration: 0.4, ease: 'back.out(1.5)' }, '-=0.4')
  }
  if (noData) {
    tl.fromTo(noData, { opacity: 0, scale: 0.9 }, { opacity: 1, scale: 1, duration: 0.4 }, '-=0.2')
  }
}

const onLeaveStageOverlay = (el: Element, done: () => void) => {
  const content = el.querySelector('.stage-overlay-content')
  gsap.to(content, { opacity: 0, y: 20, scale: 0.95, duration: 0.3, ease: 'power2.in', onComplete: done })
}

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
  window.removeEventListener('wheel', handleWheel)
})
</script>

<template>
  <div class="min-h-screen font-sans selection:bg-red-500/30 text-white pb-32 relative z-0">
    <canvas ref="bgCanvas" class="fixed inset-0 pointer-events-none -z-10" style="transform: translateZ(0); will-change: transform;"></canvas>

    <!-- Top Bar -->
    <div class="header-ui w-full border-b border-white/5 bg-[#0f0f11]/40 backdrop-blur-md sticky top-0 z-50 flex justify-between items-center px-8 py-4">
      <div class="flex items-center gap-4">
        <div class="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
        <span class="tracking-[0.3em] text-xs uppercase font-bold text-white/70">Sys_Tourney_Link</span>
      </div>
      <div class="flex items-center gap-4">
        <a href="/proposal/" target="_blank" class="tracking-widest text-[10px] uppercase text-[#ff00ff] hover:text-[#ff88ff] font-bold border border-[#ff00ff]/30 px-3 py-1 rounded bg-black/50 transition-colors">GTA 6 Proposal</a>
        <div class="tracking-widest text-[10px] uppercase text-white/50">{{ new Date().toISOString().split('T')[0] }} // ACTIVE</div>
      </div>
    </div>

    <div ref="mainUIContainer" class="max-w-6xl mx-auto p-6 sm:p-12 space-y-16">
      
      <!-- Minimal Anime Clash Header -->
      <header class="header-ui w-full flex flex-col md:flex-row items-center justify-between gap-8 mt-12 relative">
        <div class="absolute left-0 top-1/2 -translate-y-1/2 w-full h-px bg-gradient-to-r from-transparent via-white/20 to-transparent z-0 hidden md:block"></div>
        
        <!-- P1 -->
        <div class="flex items-center gap-6 z-10 bg-transparent backdrop-blur-sm pr-8 rounded-2xl p-4 border border-white/5 shadow-2xl">
          <div class="w-24 h-24 clip-diagonal bg-[#151518] p-1 border border-white/20 cursor-pointer shadow-[0_0_20px_rgba(239,68,68,0.1)] transition-transform hover:scale-105" @click="openPlayer(1)">
            <img :src="tournament.player1_avatar" class="w-full h-full object-cover clip-diagonal grayscale hover:grayscale-0 snappy" />
          </div>
          <div class="flex flex-col">
            <span class="text-[10px] uppercase tracking-widest font-bold mb-1" :style="{ color: tournament.player1_color || '#ef4444' }">Player_01</span>
            <h2 class="text-3xl font-black tracking-wider uppercase text-white drop-shadow-lg">{{ tournament.player1_name }}</h2>
          </div>
        </div>

        <!-- Center Score -->
        <div class="header-ui z-10 px-8 flex flex-col items-center">
          <div class="flex items-center gap-6 drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">
            <span class="text-6xl font-black">{{ tournament.player1_score }}</span>
            <span class="text-white/30 text-3xl font-light">X</span>
            <span class="text-6xl font-black">{{ tournament.player2_score }}</span>
          </div>
          <div class="mt-4 px-4 py-1 bg-white/10 backdrop-blur-md text-white text-xs font-black uppercase tracking-[0.2em] clip-slant border border-white/20">
            {{ tournament.status.replace('_', ' ') }}
          </div>
        </div>

        <!-- P2 -->
        <div class="flex items-center gap-6 z-10 bg-transparent backdrop-blur-sm pl-8 rounded-2xl p-4 border border-white/5 shadow-2xl flex-row-reverse md:flex-row text-right md:text-left">
          <div class="flex flex-col items-end md:items-start">
            <span class="text-[10px] uppercase tracking-widest font-bold mb-1" :style="{ color: tournament.player2_color || '#3b82f6' }">Player_02</span>
            <h2 class="text-3xl font-black tracking-wider uppercase text-white drop-shadow-lg">{{ tournament.player2_name }}</h2>
          </div>
          <div class="w-24 h-24 clip-diagonal bg-[#151518] p-1 border border-white/20 cursor-pointer shadow-[0_0_20px_rgba(59,130,246,0.1)] transition-transform hover:scale-105" @click="openPlayer(2)">
            <img :src="tournament.player2_avatar" class="w-full h-full object-cover clip-diagonal grayscale hover:grayscale-0 snappy" />
          </div>
        </div>
      </header>

      <!-- Stage Selection (Games) -->
      <main class="space-y-6 pt-12 relative z-20">
        <div class="header-ui flex items-center justify-between mb-8">
          <h3 class="text-xl font-bold uppercase tracking-widest flex items-center gap-3">
            <span class="w-3 h-3 bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)]"></span>
            Battle Stages
          </h3>
          <div class="h-px bg-gradient-to-r from-white/20 to-transparent flex-1 ml-8"></div>
        </div>

        <div class="grid grid-cols-1 gap-4">
          <TransitionGroup name="list">
            <div 
              v-for="game in games" 
              :key="game.id"
              :data-game-id="game.id"
              class="game-item sharp-panel cursor-pointer group relative overflow-hidden bg-[#0f0f11]/60 hover:bg-[#1a1a1f]/80 transition-all duration-500"
              @click="toggleExpand(game.id)"
            >
              <div class="relative z-10">
                <div class="p-6 flex items-center justify-between">
                  <div class="flex items-center gap-6">
                    <div class="text-white/20 font-black text-2xl w-12 tracking-tighter">0{{ game.order_index }}</div>
                    <div class="w-px h-10 bg-white/10 hidden md:block"></div>
                    <div>
                      <h4 class="text-xl font-bold uppercase tracking-wider group-hover:text-white transition-colors drop-shadow-md">{{ game.name }}</h4>
                      <p class="text-[10px] text-white/50 uppercase tracking-[0.2em] mt-1 font-bold">BO{{ game.best_of }} Format</p>
                    </div>
                  </div>

                  <div class="flex items-center gap-8">
                    <div v-if="game.status !== 'pending'" class="flex items-center gap-4 text-2xl font-black drop-shadow-lg">
                      <span :class="game.player1_wins > game.player2_wins ? 'text-white' : 'text-white/30'">{{ game.player1_wins }}</span>
                      <span class="text-white/20">-</span>
                      <span :class="game.player2_wins > game.player1_wins ? 'text-white' : 'text-white/30'">{{ game.player2_wins }}</span>
                    </div>
                    <div v-else class="text-white/40 font-bold tracking-[0.2em] uppercase text-[10px] border border-white/20 px-3 py-1 clip-slant bg-black/40 backdrop-blur-sm">PENDING</div>

                    <div class="w-8 h-8 flex items-center justify-center text-white/50 transition-transform duration-500 group-hover:translate-x-2">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="square" stroke-linejoin="miter" stroke-width="2" d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TransitionGroup>
        </div>
      </main>

      <!-- Stage Details Overlay -->
      <Transition @enter="onEnterStageOverlay" @leave="onLeaveStageOverlay" :css="false">
        <div v-if="expandedGameId && expandedGameObj" class="fixed inset-0 z-[80] flex flex-col items-center justify-end p-4 sm:p-12 pointer-events-none stage-overlay-wrapper">
          <div class="pointer-events-auto w-full max-w-5xl bg-black/60 border border-white/10 shadow-[0_0_100px_rgba(255,255,255,0.05)] rounded-2xl backdrop-blur-3xl overflow-hidden stage-overlay-content relative mb-12 flex-shrink-0">
            <!-- Background effects -->
            <div class="absolute inset-0 bg-gradient-to-t from-white/5 to-transparent pointer-events-none"></div>
            <div class="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/40 to-transparent"></div>

            <button @click="toggleExpand(expandedGameId)" class="absolute top-4 right-4 text-white/50 hover:text-white transition-colors z-20 bg-white/5 backdrop-blur-md border border-white/10 p-2 rounded-full hover:bg-white/10 close-btn">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div class="p-8 md:p-12">
               <h2 class="text-4xl font-black uppercase tracking-widest text-white drop-shadow-md mb-2 flex items-center gap-4">
                  <span class="w-4 h-4 bg-white shadow-[0_0_15px_white]"></span>
                  {{ expandedGameObj.name }}
               </h2>
               <p class="text-xs text-white/50 uppercase tracking-[0.3em] font-bold mb-12">Best of {{ expandedGameObj.best_of }} Format</p>

               <div class="flex items-center gap-6 progress-track relative z-10 origin-left">
                 <div class="w-12 text-[10px] font-bold text-white/50 tracking-widest uppercase">P1</div>
                 <div class="flex-1 h-3 bg-black/50 border border-white/10 flex relative rounded-full overflow-hidden shadow-inner">
                   <div class="absolute left-0 top-0 h-full transition-all duration-1000 ease-out shadow-[0_0_15px_currentColor]" 
                        :style="{ width: `${(expandedGameObj.player1_wins / Math.ceil(expandedGameObj.best_of / 2)) * 50}%`, backgroundColor: tournament.player1_color || '#ef4444', color: tournament.player1_color || '#ef4444' }"></div>
                   <div class="absolute right-0 top-0 h-full transition-all duration-1000 ease-out shadow-[0_0_15px_currentColor]" 
                        :style="{ width: `${(expandedGameObj.player2_wins / Math.ceil(expandedGameObj.best_of / 2)) * 50}%`, backgroundColor: tournament.player2_color || '#3b82f6', color: tournament.player2_color || '#3b82f6' }"></div>
                   <!-- Glowing middle divider -->
                   <div class="absolute left-1/2 top-0 w-[2px] h-full bg-white z-10 shadow-[0_0_10px_white]"></div>
                 </div>
                 <div class="w-12 text-right text-[10px] font-bold text-white/50 tracking-widest uppercase">P2</div>
               </div>

               <div v-if="expandedGameObj.matches.length > 0" class="relative z-10 mt-12">
                 <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                   <div 
                     v-for="match in expandedGameObj.matches" 
                     :key="match.id"
                     class="match-card p-4 border border-white/10 flex flex-col justify-center items-center gap-2 bg-[#0a0a0c]/80 backdrop-blur-md rounded-xl shadow-[0_0_20px_rgba(0,0,0,0.5)] hover:border-white/30 hover:-translate-y-1 transition-all duration-300 group relative overflow-hidden cursor-default text-center"
                   >
                     <div class="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-300" :style="{ backgroundColor: match.winner_index === 1 ? (tournament.player1_color || '#ef4444') : (tournament.player2_color || '#3b82f6') }"></div>
                     <span class="text-[10px] uppercase font-bold text-white/40 tracking-[0.2em] text-center w-full">Match {{ match.match_number }}</span>
                     <div class="w-full h-px bg-gradient-to-r from-transparent via-white/20 to-transparent my-1 relative"></div>
                     <span class="text-sm font-black tracking-widest uppercase text-white drop-shadow-[0_0_5px_currentColor] text-center w-full" 
                           :style="{ color: match.winner_index === 1 ? (tournament.player1_color || '#ef4444') : (tournament.player2_color || '#3b82f6') }">
                       {{ match.winner_index === 1 ? tournament.player1_name : tournament.player2_name }} WON
                     </span>
                   </div>
                 </div>
               </div>
               <div v-else class="no-data text-center py-12 mt-12 border border-white/5 border-dashed bg-black/20 backdrop-blur-md rounded-xl relative z-10">
                 <div class="w-12 h-12 border border-white/10 rounded-full flex items-center justify-center mx-auto mb-3 text-white/20">
                   <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                     <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                   </svg>
                 </div>
                 <p class="text-[10px] font-bold text-white/40 uppercase tracking-[0.3em]">Awaiting Combat Data</p>
               </div>
            </div>
          </div>
        </div>
      </Transition>
    </div>

    <!-- Player Profile Modal -->
    <Transition @enter="onEnterModal" @leave="onLeaveModal" :css="false">
      <div v-if="selectedPlayer !== null" class="fixed inset-0 z-[100] flex items-center justify-center p-4 player-modal-wrapper">
        <div class="absolute inset-0 bg-black/80 backdrop-blur-md cursor-pointer player-modal-backdrop" @click="closePlayerModal"></div>
        
        <div class="modal-content relative w-full max-w-4xl bg-[#0f0f11]/90 border border-white/10 p-0 shadow-[0_0_100px_rgba(255,255,255,0.05)] flex flex-col md:flex-row overflow-hidden z-10 rounded-2xl backdrop-blur-2xl">
          
          <button @click="closePlayerModal" class="absolute top-4 right-4 text-white/50 hover:text-white transition-colors z-20 bg-black/50 backdrop-blur-md border border-white/10 p-2 rounded-full hover:bg-white/10 close-btn">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <!-- Left Side: Large Portrait -->
          <div class="md:w-5/12 relative h-64 md:h-auto modal-left overflow-hidden bg-[#050505]">
            <!-- Background glow -->
            <div class="absolute inset-0 opacity-20" :style="{ backgroundColor: selectedPlayer === 1 ? (tournament.player1_color || '#ef4444') : (tournament.player2_color || '#3b82f6') }"></div>
            
            <!-- Glitchy / Sharp Image -->
            <img :src="selectedPlayer === 1 ? tournament.player1_avatar : tournament.player2_avatar" class="w-full h-full object-cover object-top grayscale-[30%] contrast-125 mix-blend-screen profile-image" />
            
            <!-- Overlay Text -->
            <div class="absolute bottom-6 left-6 z-10 profile-title-block">
              <div class="text-[10px] uppercase font-bold tracking-[0.4em] mb-1 drop-shadow-md" :style="{ color: selectedPlayer === 1 ? (tournament.player1_color || '#ef4444') : (tournament.player2_color || '#3b82f6') }">Unit_0{{ selectedPlayer }}</div>
              <h3 class="text-4xl md:text-5xl font-black uppercase tracking-widest text-white drop-shadow-lg leading-none">{{ selectedPlayer === 1 ? tournament.player1_name : tournament.player2_name }}</h3>
            </div>
            
            <!-- Overlay gradient to blend into right side -->
            <div class="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-[#0f0f11] via-[#0f0f11]/30 to-transparent"></div>
          </div>

          <!-- Right Side: Stats & Info -->
          <div class="md:w-7/12 p-8 md:p-12 flex flex-col gap-8 relative z-10 modal-right">
            
            <div class="desc-block">
              <h4 class="text-[10px] uppercase font-bold tracking-[0.2em] text-white/40 mb-3 flex items-center gap-2">
                <span class="w-1 h-4" :style="{ backgroundColor: selectedPlayer === 1 ? (tournament.player1_color || '#ef4444') : (tournament.player2_color || '#3b82f6') }"></span> Background Data
              </h4>
              <p class="text-sm text-white/80 leading-relaxed font-light">
                {{ selectedPlayer === 1 ? tournament.player1_description : tournament.player2_description || 'No data available for this unit. Classification: Unknown.' }}
              </p>
            </div>

            <div class="mt-auto stats-block">
              <h4 class="text-[10px] uppercase font-bold tracking-[0.2em] text-white/40 mb-4 flex items-center gap-2">
                <span class="w-1 h-4" :style="{ backgroundColor: selectedPlayer === 1 ? (tournament.player1_color || '#ef4444') : (tournament.player2_color || '#3b82f6') }"></span> Combat Metrics
              </h4>
              
              <!-- Grid stats -->
              <div class="grid grid-cols-2 gap-4">
                <div v-for="game in games" :key="game.id" class="p-4 border border-white/5 bg-white/[0.02] rounded-xl relative overflow-hidden group hover:border-white/10 transition-colors stat-item">
                  <div class="absolute inset-0 opacity-10 transition-opacity duration-500 group-hover:opacity-20" :style="{ backgroundColor: selectedPlayer === 1 ? (tournament.player1_color || '#ef4444') : (tournament.player2_color || '#3b82f6') }"></div>
                  
                  <div class="relative z-10 flex flex-col justify-between h-full gap-2">
                    <div class="flex justify-between items-start gap-2">
                      <span class="text-[10px] uppercase font-bold tracking-wider text-white/70 truncate">{{ game.name }}</span>
                      <span class="text-[8px] uppercase font-black tracking-widest px-1.5 py-0.5 rounded shadow-[0_0_5px_currentColor] shrink-0"
                            :style="{ 
                              color: (game.player1_wins < Math.ceil(game.best_of / 2) && game.player2_wins < Math.ceil(game.best_of / 2)) ? '#a1a1aa' : 
                                     (selectedPlayer === 1 && game.player1_wins >= Math.ceil(game.best_of / 2)) || (selectedPlayer === 2 && game.player2_wins >= Math.ceil(game.best_of / 2)) ? (selectedPlayer === 1 ? (tournament.player1_color || '#ef4444') : (tournament.player2_color || '#3b82f6')) : '#ef4444',
                              backgroundColor: (game.player1_wins < Math.ceil(game.best_of / 2) && game.player2_wins < Math.ceil(game.best_of / 2)) ? 'rgba(161, 161, 170, 0.1)' : 
                                     (selectedPlayer === 1 && game.player1_wins >= Math.ceil(game.best_of / 2)) || (selectedPlayer === 2 && game.player2_wins >= Math.ceil(game.best_of / 2)) ? (selectedPlayer === 1 ? (tournament.player1_color || '#ef4444') : (tournament.player2_color || '#3b82f6')) + '20' : 'rgba(239, 68, 68, 0.1)'
                            }">
                        {{ (game.player1_wins < Math.ceil(game.best_of / 2) && game.player2_wins < Math.ceil(game.best_of / 2)) ? 'ON GOING' : 
                           ((selectedPlayer === 1 && game.player1_wins >= Math.ceil(game.best_of / 2)) || (selectedPlayer === 2 && game.player2_wins >= Math.ceil(game.best_of / 2)) ? 'WIN' : 'LOSE') }}
                      </span>
                    </div>
                    <div class="flex items-end gap-2">
                      <span class="text-3xl font-black leading-none text-white drop-shadow-md">{{ selectedPlayer === 1 ? game.player1_wins : game.player2_wins }}</span>
                      <span class="text-xs text-white/40 font-bold mb-1">/ {{ Math.ceil(game.best_of / 2) }}</span>
                    </div>
                  </div>
                  
                  <!-- Miniature progress bar at bottom -->
                  <div class="absolute bottom-0 left-0 h-1 bg-white/5 w-full">
                    <div class="h-full shadow-[0_0_10px_currentColor] transition-all duration-1000 ease-out" :style="{ width: `${((selectedPlayer === 1 ? game.player1_wins : game.player2_wins) / Math.ceil(game.best_of / 2)) * 100}%`, backgroundColor: selectedPlayer === 1 ? (tournament.player1_color || '#ef4444') : (tournament.player2_color || '#3b82f6'), color: selectedPlayer === 1 ? (tournament.player1_color || '#ef4444') : (tournament.player2_color || '#3b82f6') }"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </Transition>
  </div>
</template>
