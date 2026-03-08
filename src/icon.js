import { ImageResponse } from 'next/og'

// Настройки иконки
export const size = {
  width: 32,
  height: 32,
}
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    (
      // STRATUM.ai logo
      <div
        style={{
          fontSize: 24,
          background: '#4f46e5', // Твой основной синий цвет
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          borderRadius: '8px',
          fontWeight: 'black',
        }}
      >
        B
      </div>
    ),
    {
      ...size,
    }
  )
}
