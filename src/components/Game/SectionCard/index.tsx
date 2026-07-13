import { View, Text } from '@tarojs/components'

type Variant = 'default' | 'prepare' | 'safety' | 'script'

const VARIANT_STYLES: Record<Variant, { bg: string; border: string; titleColor: string }> = {
  default: { bg: '#ffffff', border: '#f3f4f6', titleColor: '#111827' },
  prepare: { bg: '#fffbeb', border: '#fef3c7', titleColor: '#92400e' },
  safety: { bg: 'rgba(255,247,237,0.7)', border: '#ffedd5', titleColor: '#ea580c' },
  script: { bg: '#fffbeb', border: '#fef3c7', titleColor: '#92400e' },
}

interface SectionCardProps {
  title: string
  icon?: string
  variant?: Variant
  children: React.ReactNode
}

export default function SectionCard({
  title,
  icon,
  variant = 'default',
  children,
}: SectionCardProps) {
  const style = VARIANT_STYLES[variant]

  return (
    <View
      style={{
        backgroundColor: style.bg,
        borderRadius: '12px',
        padding: '12px 0px',
        border: `1px solid ${style.border}`,
        marginBottom: '24px',
      }}
    >
      <Text
        style={{
          fontSize: '16px',
          fontWeight: 'bold',
          color: style.titleColor,
          marginBottom: '12px',
          display: 'block',
        }}
      >
        {icon ? `${icon} ${title}` : title}
      </Text>
      {children}
    </View>
  )
}
