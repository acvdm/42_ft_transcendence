import { Database } from 'sqlite'

// interfaces imbriquees

export interface playerGameStats 
{
    userId?: number,
    alias: string,
    score: number
}

export interface localMatchResult 
{
    type: string, // LOCAL_TOURNAMENT , REMOTE_1V1, LOCAL_1V1
    round: 'semi_final_1' | 'semi_final_2' | 'final',
    winner: string,
    player1: playerGameStats,
    player2: playerGameStats
}

export interface localTournament 
{
    tournament_name: string,
    winner: string,
    matchList: localMatchResult[]
}

