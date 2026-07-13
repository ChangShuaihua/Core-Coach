import { View, Text } from '@tarojs/components'

export interface Step {
  id: string | number
  label: string
  description?: string
}

export interface StepIndicatorProps {
  steps: Step[]
  currentStep: string | number
  onStepClick?: (stepId: string | number) => void
  clickable?: boolean
}

export default function StepIndicator({
  steps,
  currentStep,
  onStepClick,
  clickable = false,
}: StepIndicatorProps) {
  const currentStepIndex = steps.findIndex((step) => step.id === currentStep)

  const isStepCompleted = (index: number) => index < currentStepIndex
  const isStepActive = (index: number) => index === currentStepIndex

  const handleStepClick = (stepId: string | number) => {
    if (clickable && onStepClick) {
      onStepClick(stepId)
    }
  }

  // 固定尺寸（不依赖size，稳定）
  const circleSize = 32
  const fontSize = 12
  const labelFontSize = 12

  return (
    <View style={{ position: 'relative', width: '100%' }}>
      {/* 进度条背景线 */}
      <View
        style={{
          position: 'absolute',
          top: `${circleSize / 2 + 4}px`,
          left: `${100 / steps.length / 2}%`,
          right: `${100 / steps.length / 2}%`,
          height: '2px',
          backgroundColor: '#e5e6eb',
          zIndex: 1,
        }}
      >
        {/* 已完成进度条 */}
        <View
          style={{
            width: `${(currentStepIndex / (steps.length - 1)) * 100}%`,
            height: '100%',
            backgroundColor: '#ffa052',
            transition: 'width 0.3s ease',
          }}
        />
      </View>

      {/* 步骤节点 */}
      <View style={{ display: 'flex', width: '100%', position: 'relative', zIndex: 2 }}>
        {steps.map((step, index) => {
          const active = isStepActive(index)
          const completed = isStepCompleted(index)

          return (
            <View
              key={step.id}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
              }}
              onClick={() => handleStepClick(step.id)}
            >
              {/* 圆球 */}
              <View
                style={{
                  width: `${circleSize}px`,
                  height: `${circleSize}px`,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 'bold',
                  backgroundColor: active ? '#fe6601' : completed ? '#ffa052' : '#fff',
                  border: active || completed ? 'none' : '2px solid #e5e6eb',
                  color: active || completed ? '#fff' : '#86909c',
                }}
              >
                <Text style={{ fontSize: `${fontSize}px`, lineHeight: 1 }}>{index + 1}</Text>
              </View>

              {/* 文字 */}
              <Text
                style={{
                  marginTop: '6px',
                  fontSize: `${labelFontSize}px`,
                  color: active ? '#fe6601' : completed ? '#ffa052' : '#86909c',
                  fontWeight: active ? 'bold' : 'normal',
                }}
              >
                {step.label}
              </Text>
            </View>
          )
        })}
      </View>
    </View>
  )
}
