// Універсальний каркас гри (ТЗ, розділ 4.2): табло, екран з оверлеєм і віртуальні кнопки.
// Сам нічого не знає про конкретну гру: рушій передає рахунок, статус і отримує натискання.
//
// Пропси:
//   title      — назва гри
//   score      — поточний рахунок
//   highScore  — рекорд
//   status     — 'idle' | 'running' | 'paused' | 'over' | 'soon' (рушія ще немає)
//   overlayTitle — необов'язковий власний заголовок оверлея (напр. «ПЕРЕМОГА!»)
//   onStart    — кнопка «Старт» / «Ще раз»
//   onResume   — кнопка «Продовжити» (з паузи)
//   onPause    — кнопка паузи на табло (видима, поки йде гра; потрібна на смартфонах без клавіші P)
//   onInput    — (назва, натиснуто?) => void; викликається віртуальними кнопками
//   controls   — які кнопки показувати: 'dpad' (4 напрямки), 'vertical' (лише ▲▼), 'horizontal' (лише ◀▶), 'fire', 'rotate'
//   children   — <canvas> гри

const OVERLAY_TEXT = {
  idle: { title: 'ГОТОВИЙ?', button: 'СТАРТ' },
  paused: { title: 'ПАУЗА', button: 'ПРОДОВЖИТИ' },
  over: { title: 'GAME OVER', button: 'ЩЕ РАЗ' },
  soon: { title: 'СКОРО', button: null },
}

// Кнопка, що відстежує і натискання, і відпускання (потрібно для утримання напрямку)
function PadButton({ name, label, onInput, className = '' }) {
  const press = (down) => (e) => {
    e.preventDefault()
    onInput?.(name, down)
  }
  return (
    <button
      type="button"
      aria-label={label}
      onPointerDown={press(true)}
      onPointerUp={press(false)}
      onPointerLeave={press(false)}
      onPointerCancel={press(false)}
      onContextMenu={(e) => e.preventDefault()}
      className={`touch-none select-none border-2 border-neon-cyan bg-night font-pixel text-neon-cyan active:bg-neon-cyan active:text-night ${className}`}
    >
      {label}
    </button>
  )
}

export default function ArcadeCabinet({
  title,
  score = 0,
  highScore = 0,
  status = 'idle',
  onStart,
  onResume,
  onPause,
  onInput,
  controls = ['dpad'],
  overlayTitle,
  children,
}) {
  const overlay = OVERLAY_TEXT[status]
  const action = status === 'paused' ? onResume : onStart

  return (
    <div className="arcade-cabinet mx-auto w-full max-w-xl border-4 border-neon-pink bg-night-2 p-3 shadow-[0_0_24px_#ff2a85] [clip-path:polygon(16px_0,calc(100%-16px)_0,100%_16px,100%_calc(100%-16px),calc(100%-16px)_100%,16px_100%,0_calc(100%-16px),0_16px)]">
      {/* Верхнє табло */}
      <div className="mb-3 flex items-center justify-between font-pixel text-[10px] sm:text-xs" role="group" aria-label="Табло">
        <span className="whitespace-nowrap text-neon-amber">РАХУНОК {String(score).padStart(5, '0')}</span>
        {status === 'running' && onPause ? (
          <button
            type="button"
            onClick={onPause}
            aria-label="Пауза"
            className="whitespace-nowrap border border-neon-pink px-2 py-1 text-neon-pink hover:bg-neon-pink hover:text-night"
          >
            <span aria-hidden="true">II</span>
            <span className="hidden sm:inline"> ПАУЗА</span>
          </button>
        ) : (
          <span className="hidden text-neon-pink sm:inline">{title}</span>
        )}
        <span className="whitespace-nowrap text-terminal">РЕКОРД {String(highScore).padStart(5, '0')}</span>
      </div>

      {/* Екран */}
      <div className="relative border-2 border-neon-cyan bg-black">
        {children}
        {overlay && (
          <div role="status" className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/75">
            <p className="font-pixel text-lg text-neon-pink">{overlayTitle ?? overlay.title}</p>
            {overlay.button && (
            <button
              type="button"
              onClick={action}
              className="border-2 border-neon-amber px-4 py-2 font-pixel text-xs text-neon-amber hover:bg-neon-amber hover:text-night"
            >
              {overlay.button}
            </button>
            )}
          </div>
        )}
      </div>

      {/* Віртуальні кнопки для смартфонів (на великих екранах приховані) */}
      <div className="touch-pad mt-4 items-center justify-between gap-4" role="group" aria-label="Екранні кнопки керування">
        {controls.includes('vertical') && (
          <div className="flex flex-col gap-2">
            <PadButton name="up" label="▲" onInput={onInput} className="h-14 w-20" />
            <PadButton name="down" label="▼" onInput={onInput} className="h-14 w-20" />
          </div>
        )}
        {controls.includes('horizontal') && (
          <div className="flex gap-2">
            <PadButton name="left" label="◀" onInput={onInput} className="h-16 w-20" />
            <PadButton name="right" label="▶" onInput={onInput} className="h-16 w-20" />
          </div>
        )}
        {controls.includes('dpad') && (
          <div className="grid grid-cols-3 grid-rows-3 gap-1">
            <PadButton name="up" label="▲" onInput={onInput} className="col-start-2 row-start-1 h-12 w-12" />
            <PadButton name="left" label="◀" onInput={onInput} className="col-start-1 row-start-2 h-12 w-12" />
            <PadButton name="right" label="▶" onInput={onInput} className="col-start-3 row-start-2 h-12 w-12" />
            <PadButton name="down" label="▼" onInput={onInput} className="col-start-2 row-start-3 h-12 w-12" />
          </div>
        )}
        <div className="flex gap-3">
          {controls.includes('rotate') && (
            <PadButton name="rotate" label="⟳" onInput={onInput} className="h-16 w-16 rounded-full border-neon-amber text-neon-amber" />
          )}
          {controls.includes('fire') && (
            <PadButton name="fire" label="ВОГОНЬ" onInput={onInput} className="h-16 w-24 rounded-full border-neon-pink text-[10px] text-neon-pink" />
          )}
        </div>
      </div>
    </div>
  )
}
