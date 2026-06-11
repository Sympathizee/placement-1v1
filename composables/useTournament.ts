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
  tournament_id: string
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
  player1_description?: string
  player1_color?: string
  player2_name: string
  player2_avatar: string
  player2_description?: string
  player2_color?: string
  player1_score: number
  player2_score: number
}

// Global state
const tournamentState = ref<Tournament>({
  id: '',
  name: 'Loading...',
  status: 'draft',
  player1_name: 'Loading...',
  player1_avatar: '',
  player1_description: '',
  player1_color: '#ef4444',
  player2_name: 'Loading...',
  player2_avatar: '',
  player2_description: '',
  player2_color: '#3b82f6',
  player1_score: 0,
  player2_score: 0
})

const gamesState = ref<Game[]>([])
const isLoaded = ref(false)

export const useTournament = () => {
  const supabase = useSupabaseClient()

  const loadData = async () => {
    // Fetch first tournament
    const { data: tourneys, error: tErr } = await supabase.from('tournaments').select('*').order('created_at', { ascending: true }).limit(1)
    if (tErr) console.error('Error fetching tournament', tErr)
    
    if (tourneys && tourneys.length > 0) {
      Object.assign(tournamentState.value, tourneys[0])
      
      // Fetch games
      const { data: gData, error: gErr } = await supabase.from('games').select('*').eq('tournament_id', tournamentState.value.id)
      if (gErr) console.error('Error fetching games', gErr)
      
      // Fetch matches
      const { data: mData, error: mErr } = await supabase.from('matches').select('*, games!inner(tournament_id)').eq('games.tournament_id', tournamentState.value.id)
      if (mErr) console.error('Error fetching matches', mErr)

      if (gData) {
        gamesState.value = gData.map(g => {
          return {
            ...g,
            matches: mData ? mData.filter(m => m.game_id === g.id).sort((a,b) => a.match_number - b.match_number) : []
          }
        })
      }
    }
    isLoaded.value = true
  }

  const setupRealtime = () => {
    supabase.channel('public:tournaments')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tournaments' }, payload => {
        if (payload.new && payload.new.id === tournamentState.value.id) {
          Object.assign(tournamentState.value, payload.new)
        }
      })
      .subscribe()

    supabase.channel('public:games')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'games' }, payload => {
        if (!tournamentState.value || payload.new?.tournament_id !== tournamentState.value.id) return
        
        if (payload.eventType === 'INSERT') {
          gamesState.value.push({ ...payload.new, matches: [] } as Game)
        } else if (payload.eventType === 'UPDATE') {
          const idx = gamesState.value.findIndex(g => g.id === payload.new.id)
          if (idx !== -1) {
             const oldMatches = gamesState.value[idx].matches
             gamesState.value[idx] = { ...payload.new, matches: oldMatches } as Game
          }
        } else if (payload.eventType === 'DELETE') {
          gamesState.value = gamesState.value.filter(g => g.id !== payload.old.id)
        }
      })
      .subscribe()

    supabase.channel('public:matches')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'matches' }, payload => {
        if (payload.eventType === 'INSERT') {
          const game = gamesState.value.find(g => g.id === payload.new.game_id)
          if (game) {
            game.matches.push(payload.new as Match)
            game.matches.sort((a,b) => a.match_number - b.match_number)
          }
        } else if (payload.eventType === 'DELETE') {
           gamesState.value.forEach(g => {
             g.matches = g.matches.filter(m => m.id !== payload.old.id)
           })
        }
      })
      .subscribe()
  }

  // Load immediately when composable is first used (if not loaded)
  if (!isLoaded.value) {
    loadData().then(setupRealtime)
  }

  const recordMatchWin = async (gameId: string, winnerIndex: 1 | 2) => {
    const game = gamesState.value.find(g => g.id === gameId)
    if (!game || game.status === 'completed' || !tournamentState.value.id) return

    const match_number = game.matches.length + 1
    const { error: mErr } = await supabase.from('matches').insert({
      game_id: game.id,
      match_number,
      winner_index
    })
    if (mErr) { console.error(mErr); return; }

    const player1_wins = winnerIndex === 1 ? game.player1_wins + 1 : game.player1_wins
    const player2_wins = winnerIndex === 2 ? game.player2_wins + 1 : game.player2_wins
    
    let newStatus = game.status === 'pending' ? 'in_progress' : game.status
    let newWinnerIndex = null

    const winsNeeded = Math.ceil(game.best_of / 2)
    if (player1_wins >= winsNeeded || player2_wins >= winsNeeded) {
      newStatus = 'completed'
      newWinnerIndex = player1_wins > player2_wins ? 1 : 2
    }

    const { error: gErr } = await supabase.from('games').update({
      player1_wins,
      player2_wins,
      status: newStatus,
      winner_index: newWinnerIndex
    }).eq('id', game.id)

    if (gErr) console.error(gErr)

    if (newWinnerIndex !== null) {
      const p1Score = newWinnerIndex === 1 ? tournamentState.value.player1_score + 1 : tournamentState.value.player1_score
      const p2Score = newWinnerIndex === 2 ? tournamentState.value.player2_score + 1 : tournamentState.value.player2_score
      await supabase.from('tournaments').update({
         player1_score: p1Score,
         player2_score: p2Score
      }).eq('id', tournamentState.value.id)
    }
  }

  const addGame = async (name: string, best_of: number, image_url?: string) => {
    if (!tournamentState.value.id) return
    const newOrderIndex = gamesState.value.length > 0 ? Math.max(...gamesState.value.map(g => g.order_index)) + 1 : 1
    await supabase.from('games').insert({
      tournament_id: tournamentState.value.id,
      name,
      best_of,
      image_url: image_url || null,
      order_index: newOrderIndex
    })
  }

  const deleteGame = async (id: string) => {
    await supabase.from('games').delete().eq('id', id)
  }

  const updateGame = async (id: string, name: string, best_of: number, image_url?: string) => {
    const game = gamesState.value.find(g => g.id === id)
    if (!game || !tournamentState.value.id) return

    let p1ScoreDiff = 0
    let p2ScoreDiff = 0
    if (game.status === 'completed' && game.winner_index) {
       if (game.winner_index === 1) p1ScoreDiff = -1
       else if (game.winner_index === 2) p2ScoreDiff = -1
    }

    const winsNeeded = Math.ceil(best_of / 2)
    let newStatus: GameStatus = game.matches.length > 0 ? 'in_progress' : 'pending'
    let newWinnerIndex = null

    if (game.player1_wins >= winsNeeded || game.player2_wins >= winsNeeded) {
      newStatus = 'completed'
      newWinnerIndex = game.player1_wins > game.player2_wins ? 1 : 2
      if (newWinnerIndex === 1) p1ScoreDiff += 1
      else if (newWinnerIndex === 2) p2ScoreDiff += 1
    }

    await supabase.from('games').update({
       name, best_of, image_url: image_url || null, status: newStatus, winner_index: newWinnerIndex
    }).eq('id', id)

    if (p1ScoreDiff !== 0 || p2ScoreDiff !== 0) {
       await supabase.from('tournaments').update({
          player1_score: tournamentState.value.player1_score + p1ScoreDiff,
          player2_score: tournamentState.value.player2_score + p2ScoreDiff
       }).eq('id', tournamentState.value.id)
    }
  }

  const resetGameScores = async (id: string) => {
    const game = gamesState.value.find(g => g.id === id)
    if (!game || !tournamentState.value.id) return

    let p1ScoreDiff = 0
    let p2ScoreDiff = 0
    if (game.status === 'completed' && game.winner_index) {
       if (game.winner_index === 1) p1ScoreDiff = -1
       else if (game.winner_index === 2) p2ScoreDiff = -1
    }

    await supabase.from('matches').delete().eq('game_id', id)
    
    await supabase.from('games').update({
       status: 'pending', player1_wins: 0, player2_wins: 0, winner_index: null
    }).eq('id', id)

    if (p1ScoreDiff !== 0 || p2ScoreDiff !== 0) {
       await supabase.from('tournaments').update({
          player1_score: tournamentState.value.player1_score + p1ScoreDiff,
          player2_score: tournamentState.value.player2_score + p2ScoreDiff
       }).eq('id', tournamentState.value.id)
    }
  }

  const updatePlayers = async (
    p1Name: string, p1Avatar: string, p1Desc: string, p1Color: string,
    p2Name: string, p2Avatar: string, p2Desc: string, p2Color: string
  ) => {
    if (!tournamentState.value.id) return
    await supabase.from('tournaments').update({
      player1_name: p1Name,
      player1_avatar: p1Avatar,
      player1_description: p1Desc,
      player1_color: p1Color,
      player2_name: p2Name,
      player2_avatar: p2Avatar,
      player2_description: p2Desc,
      player2_color: p2Color
    }).eq('id', tournamentState.value.id)
  }

  return {
    tournament: tournamentState,
    games: computed(() => {
       return [...gamesState.value].sort((a, b) => a.order_index - b.order_index)
    }),
    recordMatchWin,
    addGame,
    deleteGame,
    updateGame,
    resetGameScores,
    updatePlayers
  }
}
