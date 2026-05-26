import { useState, useEffect, useRef, useCallback } from 'react'
import { View, Text, Slider } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { Play } from '@nutui/icons-react-taro'

interface MusicPlayerProps {
  musicUrl: string
}

export default function MusicPlayer({ musicUrl }: MusicPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const audioRef = useRef<Taro.InnerAudioContext | null>(null)

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const initAudio = useCallback(() => {
    if (musicUrl && !audioRef.current) {
      audioRef.current = Taro.createInnerAudioContext()
      audioRef.current.src = musicUrl
      audioRef.current.loop = true
      audioRef.current.autoplay = false

      audioRef.current.onTimeUpdate(() => {
        if (audioRef.current) {
          setCurrentTime(audioRef.current.currentTime)
        }
      })

      audioRef.current.onCanplay(() => {
        if (audioRef.current) {
          setDuration(audioRef.current.duration)
        }
      })

      audioRef.current.onEnded(() => {
        setIsPlaying(false)
      })

      audioRef.current.onError(() => {
        setIsPlaying(false)
      })
    }
  }, [musicUrl])

  useEffect(() => {
    initAudio()
    return () => {
      if (audioRef.current) {
        audioRef.current.stop()
        audioRef.current.destroy()
        audioRef.current = null
      }
    }
  }, [initAudio])

  const toggleAudio = () => {
    if (!audioRef.current) {
      initAudio()
    }

    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause()
        setIsPlaying(false)
      } else {
        audioRef.current.play()
        setIsPlaying(true)
      }
    }
  }

  const handleSliderChange = (e: { detail: { value: number } }) => {
    if (audioRef.current) {
      const time = e.detail.value
      audioRef.current.seek(time)
      setCurrentTime(time)
    }
  }

  if (!musicUrl) return null

  return (
    <View
      style={{
        backgroundColor: '#f9fafb',
        borderRadius: '12px',
        padding: '16px',
      }}
    >
      <View style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <View
          style={{
            width: '44px',
            height: '44px',
            backgroundColor: '#fff7ed',
            borderRadius: '9999px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
          onClick={toggleAudio}
        >
          {isPlaying ? (
            <Text style={{ fontSize: '14px', color: '#ea580c', fontWeight: 'bold' }}>||</Text>
          ) : (
            <Play size={18} style={{ color: '#ea580c' }} />
          )}
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Slider
            min={0}
            max={duration || 100}
            value={currentTime}
            step={0.1}
            activeColor="#f97316"
            backgroundColor="#e5e7eb"
            blockSize={14}
            showValue={false}
            onChange={handleSliderChange}
            style={{ width: '100%' }}
          />
          <View
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginTop: '4px',
            }}
          >
            <Text style={{ fontSize: '14px', color: '#9ca3af' }}>{formatTime(currentTime)}</Text>
            <Text style={{ fontSize: '14px', color: '#9ca3af' }}>{formatTime(duration)}</Text>
          </View>
        </View>
      </View>
    </View>
  )
}
