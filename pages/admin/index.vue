<template>
  <div class="min-h-screen bg-[#0f0f11] font-sans selection:bg-red-500/30 text-white pb-32">
    <!-- Admin Top Bar -->
    <div class="w-full border-b border-red-500/50 bg-[#0f0f11]/90 backdrop-blur-md sticky top-0 z-50 flex justify-between items-center px-8 py-4">
      <div class="flex items-center gap-4">
        <div class="w-3 h-3 bg-red-500 animate-pulse"></div>
        <span class="tracking-[0.3em] text-xs uppercase font-black text-red-500">SYS_ADMIN_TERMINAL</span>
      </div>
      <div class="flex items-center gap-6">
        <button v-if="isLoggedIn" @click="handleLogout" class="text-[10px] tracking-widest uppercase text-red-500/70 hover:text-red-500 hover:bg-red-500/10 border border-red-500/20 hover:border-red-500 px-3 py-1 clip-slant transition-colors">
          LOGOUT // EXIT
        </button>
        <div class="tracking-widest text-[10px] uppercase text-white/50 bg-white/5 px-3 py-1 clip-slant">
          Auth Level: MASTER
        </div>
      </div>
    </div>

    <!-- Restricted Access Terminal (Login Screen) -->
    <div v-if="!isLoggedIn" class="max-w-md mx-auto px-6 py-24 sm:py-32 space-y-8 relative z-10">
      <div class="sharp-panel p-8 border-red-500 bg-[#151518] shadow-[0_0_30px_rgba(239,68,68,0.05)] relative overflow-hidden">
        <!-- Technical scanlines or grid effect in background -->
        <div class="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.01)_50%,rgba(0,0,0,0.2)_50%)] bg-[size:100%_4px] pointer-events-none"></div>

        <!-- Warning Accent Line -->
        <div class="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-600 via-red-500 to-red-600"></div>

        <div class="text-center space-y-4 mb-8">
          <div class="w-12 h-12 border border-red-500/40 flex items-center justify-center mx-auto clip-diagonal bg-red-500/5 text-red-500 animate-pulse">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square" stroke-linejoin="miter"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
          </div>
          <h2 class="text-sm font-black uppercase tracking-[0.3em] text-red-500">RESTRICTED_ACCESS</h2>
          <p class="text-[10px] text-white/40 uppercase tracking-widest font-mono">SYS_AUTH_VERIFICATION_REQUIRED</p>
        </div>

        <form @submit.prevent="handleLogin" class="space-y-6">
          <div class="space-y-2">
            <label class="block text-[8px] text-white/50 uppercase tracking-widest font-bold">User Identifier</label>
            <input 
              v-model="username" 
              type="text" 
              required
              @input="hasError = false"
              class="w-full bg-[#0f0f11] border border-white/10 px-4 py-3 text-sm text-white focus:outline-none focus:border-red-500 snappy clip-slant" 
              placeholder="ENTER USERNAME" 
            />
          </div>

          <div class="space-y-2">
            <label class="block text-[8px] text-white/50 uppercase tracking-widest font-bold">Security Key / Password</label>
            <input 
              v-model="password" 
              type="password" 
              required
              @input="hasError = false"
              class="w-full bg-[#0f0f11] border border-white/10 px-4 py-3 text-sm text-white focus:outline-none focus:border-red-500 snappy clip-slant" 
              placeholder="ENTER SECURITY KEY" 
            />
          </div>

          <!-- Error Message -->
          <div v-if="hasError" class="p-3 border border-red-500/30 bg-red-500/5 text-red-500 text-[10px] uppercase font-mono tracking-widest clip-slant text-center">
            [! ERROR] INVALID CREDENTIALS // ACCESS DENIED
          </div>

          <button 
            type="submit" 
            class="w-full bg-red-500 text-white font-black uppercase tracking-widest py-4 hover:bg-red-600 transition-colors snappy clip-diagonal text-xs flex items-center justify-center gap-3"
          >
            DECRYPT & AUTHENTICATE
          </button>
        </form>
      </div>

      <div class="text-center">
        <a href="/" class="text-[9px] uppercase tracking-widest text-white/30 hover:text-white transition-colors underline decoration-white/15">
          &lt; Return to Bracket Dashboard
        </a>
      </div>
    </div>

    <!-- Admin Tournament Control Dashboard -->
    <div v-else class="max-w-4xl mx-auto p-6 sm:p-12 space-y-12 relative z-10">
      <!-- Terminal Header -->
      <header class="flex flex-col md:flex-row items-end justify-between gap-6 border-b border-white/10 pb-8 relative">
        <div class="absolute left-0 bottom-0 w-32 h-px bg-red-500"></div>
        <div>
          <h1 class="text-4xl font-black tracking-wider uppercase mb-2">Tournament Control</h1>
          <p class="text-[10px] text-white/40 uppercase tracking-[0.2em] font-bold">Mocked Admin View — Backend integration pending</p>
        </div>
        <div class="bg-[#151518] border border-white/10 px-6 py-3 clip-diagonal">
          <span class="text-[10px] uppercase tracking-widest text-white/50 block mb-1">Live Status</span>
          <span class="font-black tracking-widest" :class="tournament.status === 'in_progress' ? 'text-green-500' : 'text-white'">
            {{ tournament.status.replace('_', ' ').toUpperCase() }}
          </span>
        </div>
      </header>

      <!-- Player Configuration -->
      <div class="sharp-panel p-6 md:p-8 border-dashed border-white/20">
        <div class="flex justify-between items-center mb-6">
          <h3 class="text-xl font-bold uppercase tracking-wider flex items-center gap-3">
            <span class="w-2 h-2 bg-red-500 animate-pulse"></span> Configure Players
          </h3>
          <button @click="handleSavePlayers" class="bg-red-500 text-white font-black uppercase tracking-widest py-2 px-6 hover:bg-red-600 transition-colors snappy clip-diagonal text-xs">
            SAVE PLAYERS
          </button>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
          <!-- Player 1 Config -->
          <div class="space-y-4 border border-white/5 bg-[#151518] p-6 clip-slant relative group">
            <div class="absolute top-0 left-0 w-1 h-full bg-red-500/50 group-hover:bg-red-500 transition-colors"></div>
            <h4 class="text-sm font-black uppercase tracking-widest text-red-500 mb-4">Player 01</h4>
            
            <div class="space-y-2">
              <label class="block text-[10px] text-white/50 uppercase tracking-widest font-bold">Display Name</label>
              <input v-model="editP1Name" type="text" class="w-full bg-[#0f0f11] border border-white/10 px-4 py-3 text-white focus:outline-none focus:border-red-500 snappy clip-slant text-sm" />
            </div>

            <div class="space-y-2">
              <label class="block text-[10px] text-white/50 uppercase tracking-widest font-bold">Short Description</label>
              <input v-model="editP1Desc" type="text" placeholder="e.g. Master of the digital realm" class="w-full bg-[#0f0f11] border border-white/10 px-4 py-3 text-white focus:outline-none focus:border-red-500 snappy clip-slant text-sm" />
            </div>

            <div class="space-y-2">
              <label class="block text-[10px] text-white/50 uppercase tracking-widest font-bold">Select Icon</label>
              <div class="flex flex-wrap gap-2">
                <button v-for="avatar in predefinedAvatars" :key="avatar" @click="editP1Avatar = avatar" 
                        class="w-10 h-10 border snappy overflow-hidden" 
                        :class="editP1Avatar === avatar ? 'border-red-500' : 'border-white/10 hover:border-white/30'">
                  <img :src="avatar" class="w-full h-full object-cover" />
                </button>
              </div>
            </div>

            <div class="space-y-2">
              <label class="block text-[10px] text-white/50 uppercase tracking-widest font-bold">Or Paste Custom Image URL (e.g. Discord CDN)</label>
              <input v-model="editP1Avatar" type="text" placeholder="https://..." class="w-full bg-[#0f0f11] border border-white/10 px-4 py-3 text-white focus:outline-none focus:border-red-500 snappy clip-slant text-sm" />
            </div>
            
            <!-- Live Preview -->
            <div class="flex items-center gap-4 mt-4">
              <div class="w-16 h-16 border border-white/10 bg-[#0f0f11] overflow-hidden flex-shrink-0">
                <img v-if="editP1Avatar" :src="editP1Avatar" class="w-full h-full object-cover" />
              </div>
              <span class="text-[10px] uppercase text-white/30 tracking-widest">Icon Preview</span>
            </div>
          </div>

          <!-- Player 2 Config -->
          <div class="space-y-4 border border-white/5 bg-[#151518] p-6 clip-slant relative group">
            <div class="absolute top-0 right-0 w-1 h-full bg-blue-500/50 group-hover:bg-blue-500 transition-colors"></div>
            <h4 class="text-sm font-black uppercase tracking-widest text-blue-500 mb-4">Player 02</h4>
            
            <div class="space-y-2">
              <label class="block text-[10px] text-white/50 uppercase tracking-widest font-bold">Display Name</label>
              <input v-model="editP2Name" type="text" class="w-full bg-[#0f0f11] border border-white/10 px-4 py-3 text-white focus:outline-none focus:border-blue-500 snappy clip-slant text-sm" />
            </div>

            <div class="space-y-2">
              <label class="block text-[10px] text-white/50 uppercase tracking-widest font-bold">Short Description</label>
              <input v-model="editP2Desc" type="text" placeholder="e.g. The chosen one" class="w-full bg-[#0f0f11] border border-white/10 px-4 py-3 text-white focus:outline-none focus:border-blue-500 snappy clip-slant text-sm" />
            </div>

            <div class="space-y-2">
              <label class="block text-[10px] text-white/50 uppercase tracking-widest font-bold">Select Icon</label>
              <div class="flex flex-wrap gap-2">
                <button v-for="avatar in predefinedAvatars" :key="avatar" @click="editP2Avatar = avatar" 
                        class="w-10 h-10 border snappy overflow-hidden" 
                        :class="editP2Avatar === avatar ? 'border-blue-500' : 'border-white/10 hover:border-white/30'">
                  <img :src="avatar" class="w-full h-full object-cover" />
                </button>
              </div>
            </div>

            <div class="space-y-2">
              <label class="block text-[10px] text-white/50 uppercase tracking-widest font-bold">Or Paste Custom Image URL (e.g. Discord CDN)</label>
              <input v-model="editP2Avatar" type="text" placeholder="https://..." class="w-full bg-[#0f0f11] border border-white/10 px-4 py-3 text-white focus:outline-none focus:border-blue-500 snappy clip-slant text-sm" />
            </div>
            
            <!-- Live Preview -->
            <div class="flex items-center gap-4 mt-4">
              <div class="w-16 h-16 border border-white/10 bg-[#0f0f11] overflow-hidden flex-shrink-0">
                <img v-if="editP2Avatar" :src="editP2Avatar" class="w-full h-full object-cover" />
              </div>
              <span class="text-[10px] uppercase text-white/30 tracking-widest">Icon Preview</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Initialize New Stage -->
      <div class="sharp-panel p-6 md:p-8 border-dashed border-white/20">
        <h3 class="text-xl font-bold uppercase tracking-wider mb-6 flex items-center gap-3">
          <span class="w-2 h-2 bg-white"></span> Initialize New Stage
        </h3>
        <div class="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
          <div class="md:col-span-5">
            <label class="block text-[10px] text-white/50 uppercase tracking-widest mb-2 font-bold">Game Name</label>
            <input v-model="newGameName" type="text" class="w-full bg-[#0f0f11] border border-white/10 px-4 py-3 text-white focus:outline-none focus:border-red-500 snappy clip-slant" placeholder="e.g. Street Fighter 6" />
          </div>
          <div class="md:col-span-2">
            <label class="block text-[10px] text-white/50 uppercase tracking-widest mb-2 font-bold">Best Of</label>
            <input v-model="newGameBestOf" type="number" min="1" max="99" class="w-full bg-[#0f0f11] border border-white/10 px-4 py-3 text-white focus:outline-none focus:border-red-500 snappy clip-slant" />
          </div>
          <div class="md:col-span-3 relative">
            <label class="block text-[10px] text-white/50 uppercase tracking-widest mb-2 font-bold flex justify-between">
              <span>Background</span>
              <span :class="inputTypeColor" class="transition-colors">{{ inputTypeLabel }}</span>
            </label>
            <input v-model="newGameImageUrl" type="text" 
              class="w-full bg-[#0f0f11] border px-4 py-3 text-white focus:outline-none snappy clip-slant transition-colors" 
              :class="inputBorderColor"
              placeholder="Unsplash ID, URL, or CSS bg class" />
          </div>
          <div class="md:col-span-2">
            <button @click="handleAddGame" class="w-full bg-white text-black font-black uppercase tracking-widest py-3 px-4 hover:bg-red-500 hover:text-white snappy clip-diagonal">
              ADD
            </button>
          </div>
        </div>

        <!-- Live Preview -->
        <div v-if="newGameImageUrl" class="mt-6 p-4 border border-white/5 bg-[#151518] flex flex-col sm:flex-row items-center gap-6 clip-slant">
          <div class="w-48 h-16 relative overflow-hidden bg-[#0f0f11] border border-white/10 group flex-shrink-0">
            <img v-if="inputTypeLabel === 'DIRECT URL' || inputTypeLabel === 'UNSPLASH ID'" 
                 :src="inputTypeLabel === 'UNSPLASH ID' ? `https://images.unsplash.com/photo-${newGameImageUrl.trim()}?q=80&w=1000&auto=format&fit=crop` : newGameImageUrl.trim()" 
                 class="w-full h-full object-cover opacity-50 grayscale group-hover:grayscale-0 group-hover:opacity-100 transition-all snappy" />
            <div v-else class="w-full h-full opacity-50 group-hover:opacity-100 transition-all snappy" 
                 :class="newGameImageUrl.trim()" 
                 :style="newGameImageUrl.trim().startsWith('#') || newGameImageUrl.trim().startsWith('rgb') ? `background: ${newGameImageUrl.trim()}` : ''"></div>
          </div>
          <div>
            <p class="text-[10px] text-white/50 uppercase tracking-[0.2em] font-bold mb-1">Background Preview</p>
            <p class="text-[10px] tracking-widest font-bold" :class="inputTypeColor">{{ inputTypeLabel }} DETECTED</p>
          </div>
        </div>

        <div class="mt-6 pt-5 border-t border-white/10 text-xs text-white/50 space-y-2">
          <p class="font-bold text-white/80 tracking-widest uppercase text-[10px] flex items-center gap-2">
            <span class="w-1.5 h-1.5 bg-blue-500"></span> Unsplash Image Protocol
          </p>
          <ol class="list-decimal pl-5 space-y-1 font-mono text-[10px]">
            <li>Find an image on <a href="https://unsplash.com" target="_blank" class="text-blue-400 hover:text-blue-300 underline decoration-blue-500/30">unsplash.com</a>.</li>
            <li>Copy the ID at the end of its URL (e.g., <code class="bg-black px-1.5 py-0.5 text-white/70">abc123xyz</code>).</li>
            <li>Format it: <code class="bg-black px-1.5 py-0.5 text-green-400">https://images.unsplash.com/photo-[ID]?q=80&w=1000&auto=format&fit=crop</code></li>
            <li>Paste the formatted URL above.</li>
          </ol>
        </div>
      </div>

      <!-- Control Grid -->
      <div class="grid grid-cols-1 gap-6">
        <div 
          v-for="game in games" 
          :key="game.id"
          class="sharp-panel relative overflow-hidden group"
          :class="{ 'border-red-500 bg-[#1a1a1f] shadow-[0_0_20px_rgba(239,68,68,0.1)]': game.status === 'in_progress' && editingGameId !== game.id }"
        >
          <!-- Active Game indicator line -->
          <div v-if="game.status === 'in_progress' && editingGameId !== game.id" class="absolute left-0 top-0 w-1 h-full bg-red-500"></div>

          <!-- Background Image / CSS (Only shown when not editing) -->
          <div v-if="game.image_url && editingGameId !== game.id" class="absolute inset-0 z-0 transition-all duration-500 pointer-events-none mix-blend-lighten opacity-[0.1] grayscale group-hover:opacity-[0.18]">
            <!-- If it's a direct URL, render an img -->
            <img v-if="game.image_url.startsWith('http')" :src="game.image_url" class="w-full h-full object-cover transform snappy scale-105 group-hover:scale-100" />
            <!-- If it's CSS, render a div with that class or style -->
            <div v-else class="w-full h-full transform snappy scale-105 group-hover:scale-100"
                 :class="game.image_url"
                 :style="game.image_url.startsWith('#') || game.image_url.startsWith('rgb') ? `background: ${game.image_url}` : ''"></div>
            
            <div class="absolute inset-0 bg-gradient-to-r from-[#0f0f11] via-[#0f0f11]/85 to-transparent"></div>
            <div class="absolute inset-0 bg-gradient-to-t from-[#0f0f11] via-transparent to-transparent"></div>
          </div>

          <div class="p-6 md:p-8 relative z-10">
            <!-- Inline Edit Mode -->
            <div v-if="editingGameId === game.id" class="space-y-6">
              <h3 class="text-xl font-bold uppercase tracking-wider flex items-center gap-3">
                <span class="w-2.5 h-2.5 bg-red-500 animate-pulse"></span> Edit Stage Details
              </h3>
              
              <div class="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                <div class="md:col-span-5">
                  <label class="block text-[10px] text-white/50 uppercase tracking-widest mb-2 font-bold">Game Name</label>
                  <input v-model="editGameName" type="text" class="w-full bg-[#0f0f11] border border-white/10 px-4 py-3 text-white focus:outline-none focus:border-red-500 snappy clip-slant" />
                </div>
                <div class="md:col-span-2">
                  <label class="block text-[10px] text-white/50 uppercase tracking-widest mb-2 font-bold">Best Of</label>
                  <input v-model="editGameBestOf" type="number" min="1" max="99" class="w-full bg-[#0f0f11] border border-white/10 px-4 py-3 text-white focus:outline-none focus:border-red-500 snappy clip-slant" />
                </div>
                <div class="md:col-span-5 relative">
                  <label class="block text-[10px] text-white/50 uppercase tracking-widest mb-2 font-bold flex justify-between">
                    <span>Background</span>
                    <span :class="editInputTypeColor" class="transition-colors">{{ editInputTypeLabel }}</span>
                  </label>
                  <input v-model="editGameImageUrl" type="text" 
                    class="w-full bg-[#0f0f11] border px-4 py-3 text-white focus:outline-none snappy clip-slant transition-colors" 
                    :class="editInputBorderColor"
                    placeholder="Unsplash ID, URL, or CSS bg class" />
                </div>
              </div>

              <!-- Live Preview for Editing -->
              <div v-if="editGameImageUrl" class="p-4 border border-white/5 bg-[#151518] flex flex-col sm:flex-row items-center gap-6 clip-slant">
                <div class="w-48 h-16 relative overflow-hidden bg-[#0f0f11] border border-white/10 group flex-shrink-0">
                  <img v-if="editInputTypeLabel === 'DIRECT URL' || editInputTypeLabel === 'UNSPLASH ID'" 
                       :src="editInputTypeLabel === 'UNSPLASH ID' ? `https://images.unsplash.com/photo-${editGameImageUrl.trim()}?q=80&w=1000&auto=format&fit=crop` : editGameImageUrl.trim()" 
                       class="w-full h-full object-cover opacity-50 grayscale group-hover:grayscale-0 group-hover:opacity-100 transition-all snappy" />
                  <div v-else class="w-full h-full opacity-50 group-hover:opacity-100 transition-all snappy" 
                       :class="editGameImageUrl.trim()" 
                       :style="editGameImageUrl.trim().startsWith('#') || editGameImageUrl.trim().startsWith('rgb') ? `background: ${editGameImageUrl.trim()}` : ''"></div>
                </div>
                <div>
                  <p class="text-[10px] text-white/50 uppercase tracking-[0.2em] font-bold mb-1">Background Preview</p>
                  <p class="text-[10px] tracking-widest font-bold" :class="editInputTypeColor">{{ editInputTypeLabel }} DETECTED</p>
                </div>
              </div>

              <!-- Edit Actions -->
              <div class="flex flex-col sm:flex-row gap-4">
                <button @click="handleSaveEdit(game.id)" class="flex-1 bg-white text-black font-black uppercase tracking-widest py-3 hover:bg-red-500 hover:text-white snappy clip-diagonal text-sm">
                  SAVE CHANGES
                </button>
                <button @click="cancelEditing" class="flex-1 bg-[#151518] border border-white/10 text-white/60 hover:text-white hover:bg-white/5 font-black uppercase tracking-widest py-3 snappy clip-diagonal text-sm">
                  CANCEL
                </button>
              </div>
            </div>

            <!-- Standard Display Mode -->
            <div v-else>
              <div class="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-6">
                <div class="flex items-center gap-6">
                  <div class="text-white/20 font-black text-3xl w-12 tracking-tighter">0{{ game.order_index }}</div>
                  <div class="w-px h-12 bg-white/10 hidden md:block"></div>
                  <div>
                    <h3 class="text-2xl font-bold uppercase tracking-wider">{{ game.name }}</h3>
                    <div class="flex items-center gap-3 mt-1">
                      <span class="text-[10px] text-white/40 uppercase tracking-[0.2em] font-bold">BO{{ game.best_of }}</span>
                      <span class="w-1 h-1 bg-white/20"></span>
                      <span class="text-[10px] uppercase tracking-[0.2em] font-black" :class="game.status === 'completed' ? 'text-white/30' : 'text-green-500'">{{ game.status }}</span>
                    </div>
                  </div>
                </div>
                
                <!-- Current Score Display & Stage Actions -->
                <div class="flex items-center gap-4">
                  <div class="bg-[#0f0f11]/85 px-6 py-2 border border-white/5 clip-slant flex items-center gap-6 backdrop-blur-sm">
                    <div class="text-center">
                      <span class="block text-[8px] text-red-500 uppercase tracking-widest mb-1">P1</span>
                      <span class="text-3xl font-black">{{ game.player1_wins }}</span>
                    </div>
                    <span class="text-white/20 text-xl font-light">X</span>
                    <div class="text-center">
                      <span class="block text-[8px] text-blue-500 uppercase tracking-widest mb-1">P2</span>
                      <span class="text-3xl font-black">{{ game.player2_wins }}</span>
                    </div>
                  </div>

                  <!-- Edit Stage Button -->
                  <button @click="startEditing(game)" class="text-white/20 hover:text-green-500 transition-colors p-3 bg-green-500/0 hover:bg-green-500/10 clip-diagonal" title="Edit Stage Details">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square" stroke-linejoin="miter"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
                  </button>

                  <!-- Delete Stage Button -->
                  <button @click="deleteGame(game.id)" class="text-white/20 hover:text-red-500 transition-colors p-3 bg-red-500/0 hover:bg-red-500/10 clip-diagonal" title="Terminate Stage">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square" stroke-linejoin="miter"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                  </button>
                </div>
              </div>

              <!-- Controls -->
              <div v-if="game.status !== 'completed'" class="flex flex-col sm:flex-row gap-4">
                <button 
                  @click="recordMatchWin(game.id, 1)"
                  class="flex-1 bg-red-500/10 border border-red-500/30 hover:bg-red-500 hover:text-white text-red-500 font-black uppercase tracking-widest py-4 px-6 snappy clip-diagonal text-sm flex items-center justify-center gap-3 group/btn"
                >
                  <span class="w-2 h-2 bg-red-500 group-hover/btn:bg-white snappy"></span>
                  Record P1 Win
                </button>
                <button 
                  @click="recordMatchWin(game.id, 2)"
                  class="flex-1 bg-blue-500/10 border border-blue-500/30 hover:bg-blue-500 hover:text-white text-blue-500 font-black uppercase tracking-widest py-4 px-6 snappy clip-diagonal text-sm flex items-center justify-center gap-3 group/btn"
                >
                  <span class="w-2 h-2 bg-blue-500 group-hover/btn:bg-white snappy"></span>
                  Record P2 Win
                </button>
              </div>
              
              <div v-else class="bg-[#0f0f11]/60 border border-white/5 p-4 flex items-center justify-center gap-4 clip-diagonal backdrop-blur-sm">
                <span class="text-[10px] text-white/40 uppercase tracking-widest font-bold">Status: Terminated // Victor:</span>
                <span class="font-black tracking-widest uppercase" :class="game.winner_index === 1 ? 'text-red-500' : 'text-blue-500'">
                  Player 0{{ game.winner_index }}
                </span>
              </div>

              <!-- Reset Score Control -->
              <div class="flex justify-between items-center mt-6 pt-4 border-t border-white/5">
                <span class="text-[8px] text-white/30 uppercase tracking-[0.2em] font-mono">Stage ID: {{ game.id }}</span>
                <button 
                  v-if="game.player1_wins > 0 || game.player2_wins > 0 || game.status !== 'pending'"
                  @click="handleResetScore(game.id)"
                  class="text-[10px] font-black uppercase tracking-widest py-1.5 px-3 border transition-colors snappy clip-slant animate-none"
                  :class="resetConfirmGameId === game.id ? 'border-red-500 bg-red-500 text-white animate-pulse' : 'border-white/10 hover:border-red-500 text-white/40 hover:text-red-500 bg-transparent'"
                >
                  {{ resetConfirmGameId === game.id ? 'CONFIRM RESET?' : 'RESET SCORES' }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onBeforeUnmount, onMounted } from 'vue'
import { useTournament } from '~/composables/useTournament'

const { tournament, games, recordMatchWin, addGame, deleteGame, updateGame, resetGameScores, updatePlayers } = useTournament()

const predefinedAvatars = [
  'https://api.dicebear.com/7.x/bottts/svg?seed=CyberNinja',
  'https://api.dicebear.com/7.x/bottts/svg?seed=NeoMatrix',
  'https://api.dicebear.com/7.x/bottts/svg?seed=Ghost',
  'https://api.dicebear.com/7.x/bottts/svg?seed=Phantom',
  'https://api.dicebear.com/7.x/bottts/svg?seed=Viper',
  'https://api.dicebear.com/7.x/bottts/svg?seed=Wraith',
  'https://api.dicebear.com/7.x/bottts/svg?seed=Specter',
  'https://api.dicebear.com/7.x/bottts/svg?seed=Banshee'
]

const editP1Name = ref(tournament.value.player1_name)
const editP1Desc = ref(tournament.value.player1_description || '')
const editP1Avatar = ref(tournament.value.player1_avatar)

const editP2Name = ref(tournament.value.player2_name)
const editP2Desc = ref(tournament.value.player2_description || '')
const editP2Avatar = ref(tournament.value.player2_avatar)

const handleSavePlayers = () => {
  updatePlayers(
    editP1Name.value, editP1Avatar.value, editP1Desc.value,
    editP2Name.value, editP2Avatar.value, editP2Desc.value
  )
}

const newGameName = ref('')
const newGameBestOf = ref(3)
const newGameImageUrl = ref('')

const inputTypeLabel = computed(() => {
  const val = newGameImageUrl.value.trim()
  if (!val) return ''
  if (val.startsWith('http')) return 'DIRECT URL'
  if (val.includes(' ') || val.startsWith('bg-') || val.startsWith('#')) return 'CSS STYLE'
  return 'UNSPLASH ID'
})

const inputTypeColor = computed(() => {
  if (inputTypeLabel.value === 'DIRECT URL') return 'text-blue-500'
  if (inputTypeLabel.value === 'CSS STYLE') return 'text-purple-500'
  if (inputTypeLabel.value === 'UNSPLASH ID') return 'text-green-500'
  return 'text-white/20'
})

const inputBorderColor = computed(() => {
  if (inputTypeLabel.value === 'DIRECT URL') return 'border-blue-500/50 focus:border-blue-500 text-blue-400'
  if (inputTypeLabel.value === 'CSS STYLE') return 'border-purple-500/50 focus:border-purple-500 text-purple-400'
  if (inputTypeLabel.value === 'UNSPLASH ID') return 'border-green-500/50 focus:border-green-500 text-green-400'
  return 'border-white/10 focus:border-red-500 text-white'
})

const handleAddGame = () => {
  if (!newGameName.value.trim()) return
  
  let finalBg = newGameImageUrl.value.trim()
  if (inputTypeLabel.value === 'UNSPLASH ID') {
    finalBg = `https://images.unsplash.com/photo-${finalBg}?q=80&w=1000&auto=format&fit=crop`
  }

  addGame(newGameName.value, newGameBestOf.value, finalBg)
  newGameName.value = ''
  newGameBestOf.value = 3
  newGameImageUrl.value = ''
}

// Authentication States
const isLoggedIn = ref(false)
const username = ref('')
const password = ref('')
const hasError = ref(false)

onMounted(() => {
  if (localStorage.getItem('admin_logged_in') === 'true') {
    isLoggedIn.value = true
  }
})

const handleLogin = () => {
  hasError.value = false
  if (username.value.trim() === 'kraken765' && password.value === 'javierganteng7') {
    isLoggedIn.value = true
    localStorage.setItem('admin_logged_in', 'true')
    username.value = ''
    password.value = ''
  } else {
    hasError.value = true
  }
}

const handleLogout = () => {
  isLoggedIn.value = false
  localStorage.removeItem('admin_logged_in')
}

// Inline editing states
const editingGameId = ref<string | null>(null)
const editGameName = ref('')
const editGameBestOf = ref(3)
const editGameImageUrl = ref('')

const editInputTypeLabel = computed(() => {
  const val = editGameImageUrl.value.trim()
  if (!val) return ''
  if (val.startsWith('http')) return 'DIRECT URL'
  if (val.includes(' ') || val.startsWith('bg-') || val.startsWith('#')) return 'CSS STYLE'
  return 'UNSPLASH ID'
})

const editInputTypeColor = computed(() => {
  if (editInputTypeLabel.value === 'DIRECT URL') return 'text-blue-500'
  if (editInputTypeLabel.value === 'CSS STYLE') return 'text-purple-500'
  if (editInputTypeLabel.value === 'UNSPLASH ID') return 'text-green-500'
  return 'text-white/20'
})

const editInputBorderColor = computed(() => {
  if (editInputTypeLabel.value === 'DIRECT URL') return 'border-blue-500/50 focus:border-blue-500 text-blue-400'
  if (editInputTypeLabel.value === 'CSS STYLE') return 'border-purple-500/50 focus:border-purple-500 text-purple-400'
  if (editInputTypeLabel.value === 'UNSPLASH ID') return 'border-green-500/50 focus:border-green-500 text-green-400'
  return 'border-white/10 focus:border-red-500 text-white'
})

const startEditing = (game: any) => {
  editingGameId.value = game.id
  editGameName.value = game.name
  editGameBestOf.value = game.best_of
  
  // Try to reverse unsplash ID format
  const unsplashPattern = /^https:\/\/images\.unsplash\.com\/photo-([^?]+)/
  const match = game.image_url?.match(unsplashPattern)
  if (match && match[1]) {
    editGameImageUrl.value = match[1]
  } else {
    editGameImageUrl.value = game.image_url || ''
  }
}

const cancelEditing = () => {
  editingGameId.value = null
  editGameName.value = ''
  editGameBestOf.value = 3
  editGameImageUrl.value = ''
}

const handleSaveEdit = (gameId: string) => {
  if (!editGameName.value.trim()) return

  let finalBg = editGameImageUrl.value.trim()
  if (editInputTypeLabel.value === 'UNSPLASH ID') {
    finalBg = `https://images.unsplash.com/photo-${finalBg}?q=80&w=1000&auto=format&fit=crop`
  }

  updateGame(gameId, editGameName.value.trim(), editGameBestOf.value, finalBg)
  cancelEditing()
}

// Reset Score functionality with 2-step confirmation
const resetConfirmGameId = ref<string | null>(null)
const resetConfirmTimeout = ref<any>(null)

const handleResetScore = (gameId: string) => {
  if (resetConfirmGameId.value === gameId) {
    resetGameScores(gameId)
    clearResetConfirm()
  } else {
    if (resetConfirmTimeout.value) {
      clearTimeout(resetConfirmTimeout.value)
    }
    resetConfirmGameId.value = gameId
    resetConfirmTimeout.value = setTimeout(() => {
      clearResetConfirm()
    }, 3000)
  }
}

const clearResetConfirm = () => {
  resetConfirmGameId.value = null
  if (resetConfirmTimeout.value) {
    clearTimeout(resetConfirmTimeout.value)
    resetConfirmTimeout.value = null
  }
}

onBeforeUnmount(() => {
  if (resetConfirmTimeout.value) {
    clearTimeout(resetConfirmTimeout.value)
  }
})
</script>
