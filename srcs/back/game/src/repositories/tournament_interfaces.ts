import { Database } from 'sqlite'

// interfaces imbriquees

export interface playerGameStats 
{
    userId?: number,
    alias: string,
    score: number,
    isGuest: boolean
}

export interface localMatchResult 
{
    type: string, // LOCAL_TOURNAMENT , REMOTE_1V1, LOCAL_1V1
    round: 'semi_final_1' | 'semi_final_2' | 'final',
    winner: string,
    startDate?: string,
    endDate?: string,
    p1: playerGameStats,
    p2: playerGameStats
}

export interface localTournament 
{
    tournamentName: string,
    winner: string,
    matchList: localMatchResult[],
    startedAt?: string
}

