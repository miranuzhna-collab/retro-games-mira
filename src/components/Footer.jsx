// Рік обчислюється один раз при завантаженні модуля, а не під час рендеру
const YEAR = new Date().getFullYear()

export default function Footer() {
  return (
    <footer className="border-t border-neon-cyan/30 bg-night-2 p-4 text-center text-sm text-white/60">
      Навчальний шкільний проєкт · {YEAR}
    </footer>
  )
}
