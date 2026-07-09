export type Plan = 'FREE' | 'PREMIUM'
export type SubStatus = 'ACTIVE' | 'CANCELED' | 'PAST_DUE' | 'INCOMPLETE'
export type Difficulty = 'easy' | 'medium' | 'hard'

export interface ProblemStep {
  step: number
  explanation: string
  expression: string
  result: string
}

export interface CourseWithUnits {
  id: string
  slug: string
  title: string
  description: string
  area: string
  level: string
  isPremium: boolean
  order: number
  emoji: string
  units: UnitSummary[]
}

export interface UnitSummary {
  id: string
  slug: string
  title: string
  order: number
  isPremium: boolean
  _count?: { problems: number }
}

export interface UnitWithProblems {
  id: string
  slug: string
  title: string
  content: string
  order: number
  isPremium: boolean
  problems: ProblemDetail[]
}

export interface ProblemDetail {
  id: string
  title: string
  statement: string
  difficulty: string
  isPremium: boolean
  steps: ProblemStep[]
  answer: string
  hints: string[] | null
}

export interface UserProgress {
  courseId: string
  unitId: string | null
  completed: boolean
  score: number | null
  lastSeen: Date
}
