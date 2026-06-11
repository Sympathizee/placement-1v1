import { ref, computed } from 'vue'

export type TournamentStatus = 'draft' | 'in_progress' | 'completed'
export type GameStatus = 'pending' | 'in_progress' | 'completed'

export interface Match {
  id: string
  game_id: string
  match_number: number
  winner_index: 1 | 2
  created_at: string
}

export interface Game {
  id: string
  name: string
  image_url?: string
  best_of: number
  status: GameStatus
  player1_wins: number
  player2_wins: number
  winner_index: 1 | 2 | null
  order_index: number
  matches: Match[]
}

export interface Tournament {
  id: string
  name: string
  status: TournamentStatus
  player1_name: string
  player1_avatar: string
  player2_name: string
  player2_avatar: string
  player1_score: number
  player2_score: number
}

// Global state for mocking
const tournamentState = ref<Tournament>({
  id: 'mock-tourney-1',
  name: 'The Ultimate Showdown 2026',
  status: 'in_progress',
  player1_name: 'CyberNinja',
  player1_avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=CyberNinja',
  player2_name: 'NeoMatrix',
  player2_avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=NeoMatrix',
  player1_score: 1,
  player2_score: 0
})

const gamesState = ref<Game[]>([
  {
    id: 'game-1',
    name: 'Tekken 8',
    image_url: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=1000&auto=format&fit=crop',
    best_of: 5,
    status: 'completed',
    player1_wins: 3,
    player2_wins: 1,
    winner_index: 1,
    order_index: 1,
    matches: [
      { id: 'm1', game_id: 'game-1', match_number: 1, winner_index: 1, created_at: new Date().toISOString() },
      { id: 'm2', game_id: 'game-1', match_number: 2, winner_index: 2, created_at: new Date().toISOString() },
      { id: 'm3', game_id: 'game-1', match_number: 3, winner_index: 1, created_at: new Date().toISOString() },
      { id: 'm4', game_id: 'game-1', match_number: 4, winner_index: 1, created_at: new Date().toISOString() },
    ]
  },
  {
    id: 'game-2',
    name: 'Chess (Blitz)',
    image_url: 'https://images.unsplash.com/photo-1529699211952-734e80c4d42b?q=80&w=1000&auto=format&fit=crop',
    best_of: 3,
    status: 'in_progress',
    player1_wins: 1,
    player2_wins: 1,
    winner_index: null,
    order_index: 2,
    matches: [
      { id: 'm5', game_id: 'game-2', match_number: 1, winner_index: 2, created_at: new Date().toISOString() },
      { id: 'm6', game_id: 'game-2', match_number: 2, winner_index: 1, created_at: new Date().toISOString() },
    ]
  },
  {
    id: 'game-3',
    name: 'Rocket League',
    image_url: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=1000&auto=format&fit=crop',
    best_of: 7,
    status: 'pending',
    player1_wins: 0,
    player2_wins: 0,
    winner_index: null,
    order_index: 3,
    matches: []
  }
])

export const useTournament = () => {
  // TODO: Replace these with Supabase useAsyncData and real-time channel subscriptions
  
  const recordMatchWin = (gameId: string, winnerIndex: 1 | 2) => {
    const game = gamesState.value.find(g => g.id === gameId)
    if (!game || game.status === 'completed') return

    // Create match record
    game.matches.push({
      id: `match-${Date.now()}`,
      game_id: game.id,
      match_number: game.matches.length + 1,
      winner_index: winnerIndex,
      created_at: new Date().toISOString()
    })

    // Update game score
    if (winnerIndex === 1) game.player1_wins++
    else game.player2_wins++

    if (game.status === 'pending') game.status = 'in_progress'

    // Check if game is completed
    const winsNeeded = Math.ceil(game.best_of / 2)
    if (game.player1_wins >= winsNeeded || game.player2_wins >= winsNeeded) {
      game.status = 'completed'
      game.winner_index = game.player1_wins > game.player2_wins ? 1 : 2
      // Update overall tournament score
      if (game.winner_index === 1) tournamentState.value.player1_score++
      else tournamentState.value.player2_score++
    }
  }

  const addGame = (name: string, best_of: number, image_url?: string) => {
    const newOrderIndex = gamesState.value.length > 0 ? Math.max(...gamesState.value.map(g => g.order_index)) + 1 : 1
    gamesState.value.push({
      id: `game-${Date.now()}`,
      name,
      best_of,
      image_url: image_url || undefined,
      status: 'pending',
      player1_wins: 0,
      player2_wins: 0,
      winner_index: null,
      order_index: newOrderIndex,
      matches: []
    })
  }

  const deleteGame = (id: string) => {
    const index = gamesState.value.findIndex(g => g.id === id)
    if (index !== -1) {
      gamesState.value.splice(index, 1)
    }
  }

  const updateGame = (id: string, name: string, best_of: number, image_url?: string) => {
    const game = gamesState.value.find(g => g.id === id)
    if (!game) return

    // 1. If it was completed, temporarily revert its contribution to the tournament score
    if (game.status === 'completed' && game.winner_index) {
      if (game.winner_index === 1) {
        tournamentState.value.player1_score = Math.max(0, tournamentState.value.player1_score - 1)
      } else if (game.winner_index === 2) {
        tournamentState.value.player2_score = Math.max(0, tournamentState.value.player2_score - 1)
      }
    }

    // 2. Update properties
    game.name = name
    game.best_of = best_of
    game.image_url = image_url || undefined

    // 3. Re-evaluate wins and status
    game.player1_wins = game.matches.filter(m => m.winner_index === 1).length
    game.player2_wins = game.matches.filter(m => m.winner_index === 2).length

    const winsNeeded = Math.ceil(game.best_of / 2)
    if (game.player1_wins >= winsNeeded || game.player2_wins >= winsNeeded) {
      game.status = 'completed'
      game.winner_index = game.player1_wins > game.player2_wins ? 1 : 2
      // Re-apply to tournament score
      if (game.winner_index === 1) tournamentState.value.player1_score++
      else tournamentState.value.player2_score++
    } else {
      game.status = game.matches.length > 0 ? 'in_progress' : 'pending'
      game.winner_index = null
    }
  }

  const resetGameScores = (id: string) => {
    const game = gamesState.value.find(g => g.id === id)
    if (!game) return

    // Revert tournament score if the game was completed
    if (game.status === 'completed' && game.winner_index) {
      if (game.winner_index === 1) {
        tournamentState.value.player1_score = Math.max(0, tournamentState.value.player1_score - 1)
      } else if (game.winner_index === 2) {
        tournamentState.value.player2_score = Math.max(0, tournamentState.value.player2_score - 1)
      }
    }

    // Reset game state
    game.status = 'pending'
    game.player1_wins = 0
    game.player2_wins = 0
    game.winner_index = null
    game.matches = []
  }

  return {
    tournament: tournamentState,
    games: computed(() => [...gamesState.value].sort((a, b) => a.order_index - b.order_index)),
    recordMatchWin,
    addGame,
    deleteGame,
    updateGame,
    resetGameScores
  }
}
