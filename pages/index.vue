<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useTournament } from '~/composables/useTournament'
import { useThreeScene } from '~/composables/useThreeScene'
import gsap from 'gsap'

const { tournament, games } = useTournament()

const bgCanvas = ref<HTMLCanvasElement | null>(null)
const { init, addGamePlanes, flyToGame, flyToOverview } = useThreeScene(bgCanvas)

// UI State
const expandedGameId = ref<string | null>(null)
const expandP1Desc = ref(false)
const expandP2Desc = ref(false)

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
    gamesElements.forEach((el) => {
      ;(el as HTMLElement).style.pointerEvents = 'auto'
      gsap.to(el, { opacity: 1, scale: 1, height: 'auto', margin: 'auto', padding: '1.5rem', duration: 0.5, ease: 'power2.out' })
    })
    document.body.style.overflow = 'auto'
  } else {
    // Focus on specific game
    expandedGameId.value = gameId
    flyToGame(gameId)
    
    // Fade out header
    gsap.to('.header-ui', { opacity: 0, y: -20, duration: 0.5 })
    
    // Hide other games smoothly by collapsing height so the focused one slides nicely into view
    const gamesElements = document.querySelectorAll('.game-item')
    gamesElements.forEach((el) => {
      const elGameId = el.getAttribute('data-game-id')
      if (elGameId !== gameId) {
        gsap.to(el, { opacity: 0, scale: 0.8, height: 0, padding: 0, margin: 0, duration: 0.8, ease: 'power3.inOut' })
        ;(el as HTMLElement).style.pointerEvents = 'none'
      } else {
        gsap.to(el, { opacity: 1, scale: 1, height: 'auto', padding: '1.5rem', marginTop: '2rem', duration: 0.8, ease: 'power3.inOut' })
        ;(el as HTMLElement).style.pointerEvents = 'auto'
      }
    })

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

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
  window.removeEventListener('wheel', handleWheel)
})
</script>

<template>
  <div class="min-h-screen font-sans selection:bg-red-500/30 text-white pb-32 relative z-0">
    <canvas ref="bgCanvas" class="fixed inset-0 pointer-events-none -z-10"></canvas>

    <!-- Top Bar -->
    <div class="header-ui w-full border-b border-white/5 bg-[#0f0f11]/40 backdrop-blur-md sticky top-0 z-50 flex justify-between items-center px-8 py-4">
      <div class="flex items-center gap-4">
        <div class="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
        <span class="tracking-[0.3em] text-xs uppercase font-bold text-white/70">Sys_Tourney_Link</span>
      </div>
      <div class="tracking-widest text-[10px] uppercase text-white/50">{{ new Date().toISOString().split('T')[0] }} // ACTIVE</div>
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
              class="game-item sharp-panel cursor-pointer group relative overflow-hidden transition-all duration-500"
              :class="{ 'bg-black/80 backdrop-blur-xl border-white/30 scale-105 shadow-[0_0_30px_rgba(255,255,255,0.1)]': expandedGameId === game.id, 'bg-[#0f0f11]/60 hover:bg-[#1a1a1f]/80': expandedGameId !== game.id }"
              :style="expandedGameId === game.id ? `border-color: ${tournament.player1_color || '#ef4444'}` : ''"
              @click="toggleExpand(game.id)"
            >
              <div class="relative z-10">
                <div class="p-6 flex items-center justify-between">
                  <div class="flex items-center gap-6">
                    <div class="text-white/20 font-black text-2xl w-12 tracking-tighter">0{{ game.order_index }}</div>
                    <div class="w-px h-10 bg-white/10 hidden md:block"></div>
                    <div>
                      <h4 class="text-xl font-bold uppercase tracking-wider group-hover:text-white transition-colors drop-shadow-md"
                          :style="expandedGameId === game.id ? { color: tournament.player1_color || '#ef4444' } : {}">{{ game.name }}</h4>
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

                    <div class="w-8 h-8 flex items-center justify-center text-white/50 transition-transform duration-500"
                         :class="{ 'rotate-180 text-white': expandedGameId === game.id }">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="square" stroke-linejoin="miter" stroke-width="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>

                <!-- Expanded Details -->
                <transition
                  enter-active-class="transition-all duration-500 ease-out"
                  enter-from-class="opacity-0 max-h-0"
                  enter-to-class="opacity-100 max-h-[500px]"
                  leave-active-class="transition-all duration-300 ease-in"
                  leave-from-class="opacity-100 max-h-[500px]"
                  leave-to-class="opacity-0 max-h-0"
                >
                  <div v-show="expandedGameId === game.id" class="px-6 pb-6 pt-2 border-t border-white/10 space-y-8 bg-transparent">
                    <div class="flex items-center gap-4">
                      <div class="w-12 text-[10px] font-bold text-white/50 tracking-widest uppercase">P1</div>
                      <div class="flex-1 h-2 bg-white/10 flex relative rounded-full overflow-hidden shadow-inner">
                        <div class="absolute left-0 top-0 h-full transition-all duration-700 ease-out shadow-[0_0_10px_currentColor]" 
                             :style="{ width: `${(game.player1_wins / Math.ceil(game.best_of / 2)) * 50}%`, backgroundColor: tournament.player1_color || '#ef4444', color: tournament.player1_color || '#ef4444' }"></div>
                        <div class="absolute right-0 top-0 h-full transition-all duration-700 ease-out shadow-[0_0_10px_currentColor]" 
                             :style="{ width: `${(game.player2_wins / Math.ceil(game.best_of / 2)) * 50}%`, backgroundColor: tournament.player2_color || '#3b82f6', color: tournament.player2_color || '#3b82f6' }"></div>
                        <div class="absolute left-1/2 top-0 w-[2px] h-full bg-white z-10 shadow-[0_0_5px_white]"></div>
                      </div>
                      <div class="w-12 text-right text-[10px] font-bold text-white/50 tracking-widest uppercase">P2</div>
                    </div>

                    <div v-if="game.matches.length > 0">
                      <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div 
                          v-for="match in game.matches" 
                          :key="match.id"
                          class="p-3 border border-white/10 flex justify-between items-center bg-black/60 backdrop-blur-md rounded-lg shadow-lg hover:border-white/30 transition-colors"
                        >
                          <span class="text-[10px] uppercase font-bold text-white/60">R{{ match.match_number }}</span>
                          <span class="text-[10px] font-black tracking-wider uppercase px-2 py-0.5 rounded-sm shadow-[0_0_10px_currentColor] border border-current" 
                                :style="{ backgroundColor: (match.winner_index === 1 ? (tournament.player1_color || '#ef4444') : (tournament.player2_color || '#3b82f6')) + '22', color: match.winner_index === 1 ? (tournament.player1_color || '#ef4444') : (tournament.player2_color || '#3b82f6') }">
                            P{{ match.winner_index }} Win
                          </span>
                        </div>
                      </div>
                    </div>
                    <div v-else class="text-center py-6 border border-white/10 border-dashed bg-black/40 backdrop-blur-md rounded-lg">
                      <p class="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em]">No Data Found</p>
                    </div>
                  </div>
                </transition>
              </div>
            </div>
          </TransitionGroup>
        </div>
      </main>
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
                    <span class="text-[10px] uppercase font-bold tracking-wider text-white/70 truncate">{{ game.name }}</span>
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
