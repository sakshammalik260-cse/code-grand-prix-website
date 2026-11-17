import type { ContestPhase } from './arena'
import type { SessionStatus } from './monitoring'
export interface AdminHint { id:string; order:number; deductionPoints:number; content:string }
export interface HintMetadata { id:string; problemId:string; order:number; deductionPoints:number; status:'LOCKED'|'UNLOCKED' }
export interface LockedHint extends HintMetadata { status:'LOCKED' }
export interface UnlockedHint extends HintMetadata { status:'UNLOCKED'; content:string }
export type CandidateHint=LockedHint|UnlockedHint
export interface HintState {
 contestId:string; problemId:string; configurationRevision:number; maximumPoints:number
 hints:CandidateHint[]; totalHintPenalty:number; remainingPotentialScore:number
}
export interface HintUnlockRequest { operationId:string; sessionId:string; configurationRevision:number; expectedDeductionPoints:number }
export interface HintUnlockResult extends HintState {hint:UnlockedHint;deductionApplied:number;replayed:boolean}
export interface HintService {
 get(problemId:string,signal?:AbortSignal):Promise<HintState>
 unlock(problemId:string,hintId:string,request:HintUnlockRequest,signal?:AbortSignal):Promise<HintUnlockResult>
}
export interface AdminHintService {
 list(problemId:string,signal?:AbortSignal):Promise<AdminHint[]>
 create(problemId:string,hint:AdminHint,expectedRevision:number):Promise<AdminHint[]>
 update(hintId:string,hint:AdminHint,expectedRevision:number):Promise<AdminHint[]>
 remove(hintId:string,expectedRevision:number):Promise<AdminHint[]>
}
export interface HintReceipt {contestId:string;driverId:string;problemId:string;operationId:string;unlockedAt:string;hint:UnlockedHint}
export interface MockScoreRecord {contestId:string;driverId:string;attemptedProblemIds:string[];earnedByProblem:Record<string,number>}
export interface StandingRow {rank:number;driverId:string;problemsSolved:number;totalProblems:number;totalScore:number;totalHintPenalties:number;status:SessionStatus|'WAITING'}
export interface LeaderboardSnapshot {contestId:string;contestTitle:string;status:ContestPhase;visible:boolean;simulation:boolean;updatedAt:string;rows:StandingRow[]}
export interface LeaderboardService {get(signal?:AbortSignal):Promise<LeaderboardSnapshot>}
