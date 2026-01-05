import { Database } from 'sqlite'

// interfaces imbriquees

export interface playerGameStats 
{
    user_id?: number,
    alias: string,
    score: number
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
    tournament_name: string,
    winner: string,
    match_list: localMatchResult[],
    startedAt?: string
}

