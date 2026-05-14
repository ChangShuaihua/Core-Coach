import type { Step } from '../../../components/Step'
import type { TemplateSelectorProps } from '../components/game/TemplateSelector'

export type { Step, TemplateSelectorProps }

export interface CreationStep extends Step {
  id: 'props' | 'template' | 'params' | 'preview' | 'music'
  label: string
  description?: string
}

export interface GameProp {
  id: string
  name: string
  icon: string
  category: string
}

export interface CreationState {
  currentStep: CreationStep['id']
  selectedProps: string[]
  templateId?: string
  template?: TemplateSelectorProps
  params?: {
    gameType?: string
    playerCount?: number
    duration?: number
    difficulty?: 'easy' | 'medium' | 'hard'
    gameName?: string
  }
  previewData?: any
  musicSettings?: {
    bgm?: string
    soundEffects?: string[]
  }
}

export interface TemplateFeatures {
  difficulty: 'easy' | 'medium' | 'hard'
  duration: string
  players: string
  ageGroup: string
}
