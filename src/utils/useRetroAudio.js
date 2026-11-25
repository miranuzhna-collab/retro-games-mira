import { playSound } from './audioService.js'

// Хук для ігор: const { play } = useRetroAudio(); play('shoot').
// Стан звуку (увімк/вимк) синхронізує SettingsProvider, тому
// гра не мусить перевіряти його сама.
export function useRetroAudio() {
  return { play: playSound }
}
