export default function AboutPage() {
  return (
    <article className="mx-auto max-w-3xl">
      <h1 className="font-pixel text-xl text-neon-pink">Про проєкт</h1>

      <section className="mt-6">
        <h2 className="font-pixel text-sm text-neon-cyan">Що це</h2>
        <p className="mt-3 text-lg leading-relaxed text-white/80">
          «Ретро-Аркади XX століття» — навчальний шкільний проєкт: інтерактивний музей п’яти класичних
          відеоігор (Pong, Space Invaders, Pac-Man, Tetris і Snake). До кожної гри додано історичну довідку
          про її створення й технічні особливості.
        </p>
      </section>

      <section className="mt-6">
        <h2 className="font-pixel text-sm text-neon-cyan">Як це зроблено</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-lg text-white/80">
          <li>React і клієнтська маршрутизація: сторінки перемикаються без перезавантаження.</li>
          <li>Tailwind CSS для неонового ретро-стилю.</li>
          <li>HTML5 Canvas і requestAnimationFrame для самих ігор.</li>
          <li>Web Audio API: звуки синтезуються кодом, без аудіофайлів.</li>
          <li>localStorage зберігає рекорди та налаштування звуку й CRT-фільтра.</li>
        </ul>
      </section>

      <section className="mt-6">
        <h2 className="font-pixel text-sm text-neon-cyan">Автор та інструменти</h2>
        <p className="mt-3 text-lg leading-relaxed text-white/80">
          Автор проєкту: <span className="text-neon-amber">[ім’я автора]</span>, школа/клас:{' '}
          <span className="text-neon-amber">[вказати]</span>. Під час роботи використано ШІ-асистента Claude
          від Anthropic, який допомагав писати код і тексти. Історичні факти варто перевіряти за
          першоджерелами.
        </p>
      </section>
    </article>
  )
}
