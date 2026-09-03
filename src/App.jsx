import { Route, Routes } from 'react-router-dom'
import { StoreProvider } from './data/store.jsx'
import Landing from './pages/Landing.jsx'
import TeacherDashboard from './pages/TeacherDashboard.jsx'
import ObservationForm from './pages/ObservationForm.jsx'
import ParentProfile from './pages/ParentProfile.jsx'
import ReportCardSticker from './pages/ReportCardSticker.jsx'
import ClassSweep from './pages/ClassSweep.jsx'

export default function App() {
  return (
    <StoreProvider>
      <div className="min-h-dvh bg-paper">
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/teacher" element={<TeacherDashboard />} />
          <Route path="/teacher/sweep" element={<ClassSweep />} />
          <Route path="/teacher/:studentId" element={<ObservationForm />} />
          <Route path="/profile/:studentId" element={<ParentProfile />} />
          <Route path="/stickers" element={<ReportCardSticker />} />
          <Route path="*" element={<Landing />} />
        </Routes>
      </div>
    </StoreProvider>
  )
}
