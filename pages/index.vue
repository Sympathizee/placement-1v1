<template>
  <div class="min-h-screen font-sans selection:bg-red-500/30 text-white pb-32">
    <!-- Top Bar / Modern anime HUD feel -->
    <div class="w-full border-b border-white/10 bg-[#0f0f11]/80 backdrop-blur-md sticky top-0 z-50 flex justify-between items-center px-8 py-4">
      <div class="flex items-center gap-4">
        <div class="w-2 h-2 bg-red-500"></div>
        <span class="tracking-[0.3em] text-xs uppercase font-bold text-white/50">Sys_Tourney_Link</span>
      </div>
      <div class="tracking-widest text-[10px] uppercase text-white/30">{{ new Date().toISOString().split('T')[0] }} // ACTIVE</div>
    </div>

    <div class="max-w-6xl mx-auto p-6 sm:p-12 space-y-16">
      
      <!-- Minimal Anime Clash Header -->
      <header class="w-full flex flex-col md:flex-row items-center justify-between gap-8 mt-12 relative">
        
        <!-- Background decorative line -->
        <div class="absolute left-0 top-1/2 -translate-y-1/2 w-full h-px bg-white/10 z-0 hidden md:block"></div>
        
        <!-- P1 -->
        <div class="flex items-center gap-6 z-10 bg-[#0f0f11] pr-8">
          <div class="w-24 h-24 clip-diagonal bg-[#151518] p-1 border border-white/20">
            <img :src="tournament.player1_avatar" class="w-full h-full object-cover clip-diagonal grayscale hover:grayscale-0 snappy" />
          </div>
          <div class="flex flex-col">
            <span class="text-[10px] text-red-500 uppercase tracking-widest font-bold mb-1">Player_01</span>
            <h2 class="text-3xl font-black tracking-wider uppercase">{{ tournament.player1_name }}</h2>
            <p v-if="tournament.player1_description" 
               @click="expandP1Desc = !expandP1Desc"
               class="text-[10px] text-white/50 uppercase tracking-widest mt-1 max-w-[200px] cursor-pointer hover:text-white/80 transition-colors" 
               :class="expandP1Desc ? '' : 'truncate'"
               :title="expandP1Desc ? '' : tournament.player1_description">
              {{ tournament.player1_description }}
            </p>
          </div>
        </div>

        <!-- Center Score -->
        <div class="z-10 bg-[#0f0f11] px-8 flex flex-col items-center">
          <div class="flex items-center gap-6">
            <span class="text-5xl font-black">{{ tournament.player1_score }}</span>
            <span class="text-white/20 text-3xl font-light">X</span>
            <span class="text-5xl font-black">{{ tournament.player2_score }}</span>
          </div>
          <div class="mt-4 px-4 py-1 bg-white text-black text-xs font-black uppercase tracking-[0.2em] clip-slant">
            {{ tournament.status.replace('_', ' ') }}
          </div>
        </div>

        <!-- P2 -->
        <div class="flex items-center gap-6 z-10 bg-[#0f0f11] pl-8 flex-row-reverse md:flex-row text-right md:text-left">
          <div class="flex flex-col items-end md:items-start">
            <span class="text-[10px] text-blue-500 uppercase tracking-widest font-bold mb-1">Player_02</span>
            <h2 class="text-3xl font-black tracking-wider uppercase">{{ tournament.player2_name }}</h2>
            <p v-if="tournament.player2_description" 
               @click="expandP2Desc = !expandP2Desc"
               class="text-[10px] text-white/50 uppercase tracking-widest mt-1 max-w-[200px] cursor-pointer hover:text-white/80 transition-colors" 
               :class="expandP2Desc ? '' : 'truncate'"
               :title="expandP2Desc ? '' : tournament.player2_description">
              {{ tournament.player2_description }}
            </p>
          </div>
          <div class="w-24 h-24 clip-diagonal bg-[#151518] p-1 border border-white/20">
            <img :src="tournament.player2_avatar" class="w-full h-full object-cover clip-diagonal grayscale hover:grayscale-0 snappy" />
          </div>
        </div>
      </header>

      <!-- Stage Selection (Games) -->
      <main class="space-y-6 pt-12">
        <div class="flex items-center justify-between mb-8">
          <h3 class="text-xl font-bold uppercase tracking-widest flex items-center gap-3">
            <span class="w-3 h-3 bg-white"></span>
            Battle Stages
          </h3>
          <div class="h-px bg-white/10 flex-1 ml-8"></div>
        </div>

        <div class="grid grid-cols-1 gap-4">
          <TransitionGroup name="list">
            <div 
              v-for="game in games" 
              :key="game.id"
              class="sharp-panel cursor-pointer group relative overflow-hidden"
              :class="{ 'border-red-500 bg-[#1a1a1f]': expandedGameId === game.id }"
              @click="toggleExpand(game.id)"
            >
              <!-- Background Image / CSS -->
              <div v-if="game.image_url" class="absolute inset-0 z-0 transition-all duration-500 pointer-events-none mix-blend-lighten"
                   :class="expandedGameId === game.id ? 'opacity-30 grayscale-0' : 'opacity-[0.15] grayscale group-hover:opacity-30 group-hover:grayscale-0'">
                <!-- If it's a direct URL, render an img -->
                <img v-if="game.image_url.startsWith('http')" :src="game.image_url" class="w-full h-full object-cover transform snappy"
                     :class="expandedGameId === game.id ? 'scale-100' : 'scale-105 group-hover:scale-100'" />
                <!-- If it's CSS, render a div with that class or style -->
                <div v-else class="w-full h-full transform snappy"
                     :class="[game.image_url, expandedGameId === game.id ? 'scale-100' : 'scale-105 group-hover:scale-100']"
                     :style="game.image_url.startsWith('#') || game.image_url.startsWith('rgb') ? `background: ${game.image_url}` : ''"></div>
                
                <div class="absolute inset-0 bg-gradient-to-r from-[#0f0f11] via-[#0f0f11]/80 to-transparent"></div>
                <div class="absolute inset-0 bg-gradient-to-t from-[#0f0f11] via-transparent to-transparent"></div>
              </div>

              <!-- Relative Wrapper for Content -->
              <div class="relative z-10">
                <!-- Game Header Row -->
                <div class="p-6 flex items-center justify-between">
                <div class="flex items-center gap-6">
                  <div class="text-white/20 font-black text-2xl w-12 tracking-tighter">0{{ game.order_index }}</div>
                  <div class="w-px h-10 bg-white/10 hidden md:block"></div>
                  <div>
                    <h4 class="text-xl font-bold uppercase tracking-wider group-hover:text-red-500 snappy">{{ game.name }}</h4>
                    <p class="text-[10px] text-white/40 uppercase tracking-[0.2em] mt-1 font-bold">BO{{ game.best_of }} Format</p>
                  </div>
                </div>

                <!-- Game Score -->
                <div class="flex items-center gap-8">
                  <div v-if="game.status !== 'pending'" class="flex items-center gap-4 text-2xl font-black">
                    <span :class="game.player1_wins > game.player2_wins ? 'text-white' : 'text-white/30'">{{ game.player1_wins }}</span>
                    <span class="text-white/10">-</span>
                    <span :class="game.player2_wins > game.player1_wins ? 'text-white' : 'text-white/30'">{{ game.player2_wins }}</span>
                  </div>
                  <div v-else class="text-white/30 font-bold tracking-[0.2em] uppercase text-[10px] border border-white/10 px-3 py-1 clip-slant">PENDING</div>

                  <!-- Expand Icon -->
                  <div class="w-8 h-8 flex items-center justify-center text-white/50 snappy"
                       :class="{ 'rotate-180 text-white': expandedGameId === game.id }">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="square" stroke-linejoin="miter" stroke-width="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              <!-- Expanded Details -->
              <transition
                enter-active-class="transition-all duration-300 ease-out"
                enter-from-class="opacity-0 max-h-0"
                enter-to-class="opacity-100 max-h-[500px]"
                leave-active-class="transition-all duration-200 ease-in"
                leave-from-class="opacity-100 max-h-[500px]"
                leave-to-class="opacity-0 max-h-0"
              >
                <div v-show="expandedGameId === game.id" class="px-6 pb-6 pt-2 border-t border-white/5 space-y-8 bg-black/20 overflow-hidden">
                  
                  <!-- Health/Progress Bar (Minimal HUD style) -->
                  <div class="flex items-center gap-4">
                    <div class="w-12 text-[10px] font-bold text-white/50 tracking-widest uppercase">P1</div>
                    <div class="flex-1 h-2 bg-white/5 flex relative">
                      <div class="absolute left-0 top-0 h-full bg-red-500 transition-all duration-500 ease-out" 
                           :style="{ width: `${(game.player1_wins / Math.ceil(game.best_of / 2)) * 50}%` }"></div>
                      <div class="absolute right-0 top-0 h-full bg-blue-500 transition-all duration-500 ease-out" 
                           :style="{ width: `${(game.player2_wins / Math.ceil(game.best_of / 2)) * 50}%` }"></div>
                      <!-- Center Divider -->
                      <div class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-4 bg-white z-10"></div>
                    </div>
                    <div class="w-12 text-right text-[10px] font-bold text-white/50 tracking-widest uppercase">P2</div>
                  </div>

                  <!-- Matches -->
                  <div v-if="game.matches.length > 0">
                    <div class="grid grid-cols-2 md:grid-cols-4 gap-2">
                      <div 
                        v-for="match in game.matches" 
                        :key="match.id"
                        class="p-3 border border-white/10 flex justify-between items-center bg-[#0f0f11]"
                      >
                        <span class="text-[10px] uppercase font-bold text-white/40">R{{ match.match_number }}</span>
                        <span class="text-[10px] font-black tracking-wider uppercase px-2 py-0.5" 
                              :class="match.winner_index === 1 ? 'bg-red-500/20 text-red-500' : 'bg-blue-500/20 text-blue-500'">
                          P{{ match.winner_index }} Win
                        </span>
                      </div>
                    </div>
                  </div>
                  <div v-else class="text-center py-4 border border-white/5 border-dashed bg-black/40 backdrop-blur-sm">
                    <p class="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em]">No Data Found</p>
                  </div>
                </div>
              </transition>
              </div> <!-- End relative wrapper -->
            </div>
          </TransitionGroup>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useTournament } from '~/composables/useTournament'

const { tournament, games } = useTournament()

// UI State
const expandedGameId = ref<string | null>(null)
const expandP1Desc = ref(false)
const expandP2Desc = ref(false)

const toggleExpand = (gameId: string) => {
  expandedGameId.value = expandedGameId.value === gameId ? null : gameId
}
</script>
