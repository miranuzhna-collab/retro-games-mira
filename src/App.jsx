import { Route, Routes } from 'react-router-dom'
import Navbar from './components/Navbar.jsx'
import Footer from './components/Footer.jsx'
import HomePage from './pages/HomePage.jsx'
import GamePage from './pages/GamePage.jsx'
import AboutPage from './pages/AboutPage.jsx'
import CrtOverlay from './components/CrtOverlay.jsx'
import ScrollToTop from './components/ScrollToTop.jsx'
import NotFoundPage from './pages/NotFoundPage.jsx'

// Карта маршрутів з ТЗ (розділ 3)
export default function App() {
  return (
    <div className="flex min-h-screen flex-col">
      <ScrollToTop />
      <CrtOverlay />
      <Navbar />
      <main className="mx-auto w-full max-w-6xl flex-1 p-4">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/games/:slug" element={<GamePage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
      <Footer />
    </div>
  )
}
