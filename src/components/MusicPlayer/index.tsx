import { useState, useEffect, useRef, useCallback } from 'react'
import { View, Text, Slider } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { Play, Loading } from '@nutui/icons-react-taro'

interface MusicPlayerProps {
  musicUrl: string
  /** 点击"更换音乐"的回调，不传则菜单不显示该项 */
  onChangeMusicClick?: () => void
}

export default function MusicPlayer({ musicUrl, onChangeMusicClick }: MusicPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [menuOpen, setMenuOpen] = useState(false)
  const [showVolumeSlider, setShowVolumeSlider] = useState(false)
  const [loading, setLoading] = useState(false)
  const audioRef = useRef<Taro.InnerAudioContext | null>(null)

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const initAudio = useCallback(() => {
    if (musicUrl && !audioRef.current) {
      setLoading(true)
      const ctx = Taro.createInnerAudioContext()
      ctx.src = musicUrl
      ctx.loop = true
      ctx.autoplay = false
      ctx.volume = volume

      ctx.onTimeUpdate(() => {
        setCurrentTime(ctx.currentTime ?? 0)
      })
      ctx.onCanplay(() => {
        setDuration(ctx.duration ?? 0)
        setLoading(false)
      })
      ctx.onPlay(() => setLoading(false))
      ctx.onEnded(() => setIsPlaying(false))
      ctx.onError(() => {
        setIsPlaying(false)
        setLoading(false)
      })

      audioRef.current = ctx
    }
  }, [musicUrl]) // eslint-disable-line react-hooks/exhaustive-deps

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
    if (!audioRef.current) initAudio()
    const ctx = audioRef.current
    if (!ctx) return
    if (isPlaying) {
      ctx.pause()
      setIsPlaying(false)
    } else {
      ctx.play()
      setIsPlaying(true)
    }
  }

  const handleProgressChange = (e: { detail: { value: number } }) => {
    if (audioRef.current) {
      audioRef.current.seek(e.detail.value)
      setCurrentTime(e.detail.value)
    }
  }

  const handleVolumeChange = (e: { detail: { value: number } }) => {
    const v = e.detail.value / 100
    setVolume(v)
    if (audioRef.current) {
      audioRef.current.volume = v
    }
  }

  const handleDownload = () => {
    setMenuOpen(false)
    Taro.showLoading({ title: '下载中...' })
    Taro.downloadFile({
      url: musicUrl,
      success: (res) => {
        if (res.statusCode === 200) {
          Taro.saveFile({
            tempFilePath: res.tempFilePath,
            success: (file) => {
              Taro.hideLoading()
              Taro.openDocument({
                filePath: file.savedFilePath,
                showMenu: true,
                fail: () => Taro.showToast({ title: '已保存', icon: 'success' }),
              })
            },
            fail: () => {
              Taro.hideLoading()
              Taro.showToast({ title: '保存失败', icon: 'none' })
            },
          })
        } else {
          Taro.hideLoading()
          Taro.showToast({ title: '下载失败', icon: 'none' })
        }
      },
      fail: () => {
        Taro.hideLoading()
        Taro.showToast({ title: '下载失败', icon: 'none' })
      },
    })
  }

  const handleChangeMusic = () => {
    setMenuOpen(false)
    onChangeMusicClick?.()
  }

  if (!musicUrl) return null

  return (
    <View style={{ position: 'relative' }}>
      {/* 主播放条 */}
      <View
        style={{
          backgroundColor: '#fff7ed',
          borderRadius: '12px',
          padding: '12px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
        }}
      >
        {/* 播放/暂停按钮 */}
        <View
          style={{
            width: '32px',
            height: '32px',
            backgroundColor: '#f97316',
            borderRadius: '9999px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
          onClick={toggleAudio}
        >
          {loading ? (
            <Loading size={14} color="#fff" />
          ) : isPlaying ? (
            <Text
              style={{ fontSize: '11px', color: '#fff', fontWeight: 'bold', letterSpacing: '2px' }}
            >
              II
            </Text>
          ) : (
            <Play size={14} color="#fff" />
          )}
        </View>

        {/* 进度条区域 */}
        <View style={{ flex: 1, minWidth: 0, marginRight: '4px' }}>
          <Slider
            min={0}
            max={duration || 100}
            value={currentTime}
            step={0.1}
            activeColor="#f97316"
            backgroundColor="#fed7aa"
            blockSize={12}
            showValue={false}
            onChange={handleProgressChange}
            style={{ width: '100%', marginBottom: '2px' }}
          />
          <View style={{ display: 'flex', justifyContent: 'space-between' }}>
            <Text style={{ fontSize: '11px', color: '#9ca3af' }}>{formatTime(currentTime)}</Text>
            <Text style={{ fontSize: '11px', color: '#9ca3af' }}>{formatTime(duration)}</Text>
          </View>
        </View>

        {/* 菜单按钮 */}
        <View
          style={{
            width: '32px',
            height: '32px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '4px',
            flexShrink: 0,
          }}
          onClick={() => {
            setMenuOpen((v) => !v)
            setShowVolumeSlider(false)
          }}
        >
          {[0, 1, 2].map((i) => (
            <View
              key={i}
              style={{
                width: '16px',
                height: '2px',
                backgroundColor: '#f97316',
                borderRadius: '2px',
              }}
            />
          ))}
        </View>
      </View>

      {/* 音量展开条 */}
      {showVolumeSlider && (
        <View
          style={{
            backgroundColor: '#fff7ed',
            borderRadius: '8px',
            padding: '10px 14px',
            marginTop: '6px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <Text style={{ fontSize: '13px', color: '#9ca3af', flexShrink: 0 }}>🔈</Text>
          <Slider
            min={0}
            max={100}
            value={Math.round(volume * 100)}
            activeColor="#f97316"
            backgroundColor="#fed7aa"
            blockSize={12}
            showValue={false}
            onChange={handleVolumeChange}
            style={{ flex: 1 }}
          />
          <Text style={{ fontSize: '13px', color: '#9ca3af', flexShrink: 0 }}>🔊</Text>
        </View>
      )}

      {/* 下拉菜单 */}
      {menuOpen && (
        <View
          style={{
            position: 'absolute',
            right: '0px',
            bottom: '56px',
            backgroundColor: '#ffffff',
            borderRadius: '10px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
            overflow: 'hidden',
            zIndex: 100,
            minWidth: '140px',
          }}
        >
          {onChangeMusicClick && (
            <View
              style={{
                padding: '13px 18px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                borderBottom: '1px solid #f3f4f6',
              }}
              onClick={handleChangeMusic}
            >
              <Text style={{ fontSize: '16px' }}>🎵</Text>
              <Text style={{ fontSize: '14px', color: '#374151' }}>更换音乐</Text>
            </View>
          )}
          <View
            style={{
              padding: '13px 18px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              borderBottom: '1px solid #f3f4f6',
            }}
            onClick={() => {
              setShowVolumeSlider((v) => !v)
              setMenuOpen(false)
            }}
          >
            <Text style={{ fontSize: '16px' }}>🔊</Text>
            <Text style={{ fontSize: '14px', color: '#374151' }}>音量调节</Text>
          </View>
          <View
            style={{
              padding: '13px 18px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
            onClick={handleDownload}
          >
            <Text style={{ fontSize: '16px' }}>⬇️</Text>
            <Text style={{ fontSize: '14px', color: '#374151' }}>下载音乐</Text>
          </View>
        </View>
      )}
    </View>
  )
}
