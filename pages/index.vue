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

const openPlayer = (player: 1 | 2) => {
  selectedPlayer.value = player
}

const closePlayerModal = () => {
  selectedPlayer.value = null
}

const toggleExpand = (gameId: string) => {
  if (expandedGameId.value === gameId) {
    // Go back to overview
    expandedGameId.value = null
    flyToOverview()
    
    // Animate UI back to normal
    gsap.to('.header-ui', { opacity: 1, y: 0, duration: 1, ease: 'power2.out' })
    gsap.to('.game-item', { opacity: 1, scale: 1, duration: 0.5, stagger: 0.05 })
    const gamesElements = document.querySelectorAll('.game-item')
    gamesElements.forEach((el) => {
      ;(el as HTMLElement).style.pointerEvents = 'auto'
    })
  } else {
    // Focus on specific game
    expandedGameId.value = gameId
    flyToGame(gameId)
    
    // Fade out irrelevant UI
    gsap.to('.header-ui', { opacity: 0, y: -20, duration: 0.5 })
    
    // Hide other games
    const gamesElements = document.querySelectorAll('.game-item')
    gamesElements.forEach((el) => {
      const elGameId = el.getAttribute('data-game-id')
      if (elGameId !== gameId) {
        gsap.to(el, { opacity: 0, scale: 0.9, duration: 0.5 })
        ;(el as HTMLElement).style.pointerEvents = 'none'
      } else {
        gsap.to(el, { opacity: 1, scale: 1, duration: 0.5 })
        ;(el as HTMLElement).style.pointerEvents = 'auto'
      }
    })
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

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
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
    <Transition name="modal-snappy">
      <div v-if="selectedPlayer !== null" class="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/90 backdrop-blur-xl cursor-pointer transition-opacity duration-300" @click="closePlayerModal"></div>
        
        <div class="modal-content relative w-full max-w-2xl bg-[#0f0f11]/90 border border-white/10 p-8 shadow-[0_0_100px_rgba(255,255,255,0.05)] flex flex-col md:flex-row gap-8 overflow-hidden z-10 rounded-2xl backdrop-blur-2xl">
          
          <button @click="closePlayerModal" class="absolute top-4 right-4 text-white/50 hover:text-white transition-colors z-20 bg-white/5 p-2 rounded-full hover:bg-white/10">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <div class="flex-shrink-0 flex flex-col items-center gap-4 relative z-10">
            <div class="w-48 h-48 clip-diagonal bg-[#151518] p-1 border border-white/20 shadow-[0_0_30px_currentColor]" :style="{ color: selectedPlayer === 1 ? (tournament.player1_color || '#ef4444') : (tournament.player2_color || '#3b82f6') }">
              <img :src="selectedPlayer === 1 ? tournament.player1_avatar : tournament.player2_avatar" class="w-full h-full object-cover clip-diagonal" />
            </div>
            <div class="text-center">
              <div class="text-[10px] uppercase font-bold tracking-[0.3em] mb-1" :style="{ color: selectedPlayer === 1 ? (tournament.player1_color || '#ef4444') : (tournament.player2_color || '#3b82f6') }">Player_0{{ selectedPlayer }}</div>
              <h3 class="text-3xl font-black uppercase tracking-wider text-white drop-shadow-md">{{ selectedPlayer === 1 ? tournament.player1_name : tournament.player2_name }}</h3>
            </div>
          </div>

          <div class="flex-1 flex flex-col gap-6 relative z-10">
            <p class="text-sm text-white/80 leading-relaxed italic border-l-2 pl-4" :style="{ borderColor: selectedPlayer === 1 ? (tournament.player1_color || '#ef4444') + '80' : (tournament.player2_color || '#3b82f6') + '80' }">
              {{ selectedPlayer === 1 ? tournament.player1_description : tournament.player2_description || 'No data available for this unit.' }}
            </p>

            <div class="mt-auto">
              <h4 class="text-xs uppercase font-bold tracking-[0.2em] text-white/50 mb-4 flex items-center gap-2">
                <span class="w-2 h-2 bg-white/60 rounded-full"></span> Stage Performance
              </h4>
              <div class="space-y-4">
                <div v-for="game in games" :key="game.id" class="space-y-1">
                  <div class="flex justify-between text-[10px] uppercase font-bold tracking-wider">
                    <span class="text-white/90">{{ game.name }}</span>
                    <span class="text-white/60">{{ selectedPlayer === 1 ? game.player1_wins : game.player2_wins }} / {{ Math.ceil(game.best_of / 2) }} WINS</span>
                  </div>
                  <div class="h-1.5 w-full bg-white/10 relative overflow-hidden rounded-full">
                    <div class="absolute top-0 left-0 h-full transition-all duration-700 ease-out shadow-[0_0_10px_currentColor]"
                         :style="{ backgroundColor: selectedPlayer === 1 ? (tournament.player1_color || '#ef4444') : (tournament.player2_color || '#3b82f6'), color: selectedPlayer === 1 ? (tournament.player1_color || '#ef4444') : (tournament.player2_color || '#3b82f6'), width: `${((selectedPlayer === 1 ? game.player1_wins : game.player2_wins) / Math.ceil(game.best_of / 2)) * 100}%` }">
                    </div>
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
