import { Navigate, Route, Routes, useParams } from 'react-router-dom'
import { AuthProvider } from './data/auth.jsx'
import { StoreProvider } from './data/store.jsx'
import RequireRole from './components/RequireRole.jsx'

import Landing from './pages/Landing.jsx'
import Login from './pages/Login.jsx'
import Overview from './pages/teacher/Overview.jsx'
import Roster from './pages/teacher/Roster.jsx'
import Analytics from './pages/teacher/Analytics.jsx'
import StudentDetail from './pages/teacher/StudentDetail.jsx'
import Stickers from './pages/teacher/Stickers.jsx'
import ClassSweep from './pages/ClassSweep.jsx'
import ObservationForm from './pages/ObservationForm.jsx'
import ParentHome from './pages/parent/ParentHome.jsx'
import ParentProfile from './pages/ParentProfile.jsx'

const Teacher = ({ children }) => <RequireRole role="teacher">{children}</RequireRole>
const Parent = ({ children }) => <RequireRole role="parent">{children}</RequireRole>
const SignedIn = ({ children }) => <RequireRole>{children}</RequireRole>

export default function App() {
  return (
    <AuthProvider>
      <StoreProvider>
        <Routes>
          {/* Public */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />

          {/* Teacher */}
          <Route path="/teacher" element={<Teacher><Overview /></Teacher>} />
          <Route path="/teacher/roster" element={<Teacher><Roster /></Teacher>} />
          <Route path="/teacher/analytics" element={<Teacher><Analytics /></Teacher>} />
          <Route path="/teacher/sweep" element={<Teacher><ClassSweep /></Teacher>} />
          <Route path="/teacher/stickers" element={<Teacher><Stickers /></Teacher>} />
          <Route
            path="/teacher/student/:studentId"
            element={<Teacher><StudentDetail /></Teacher>}
          />
          <Route
            path="/teacher/student/:studentId/observe"
            element={<Teacher><ObservationForm /></Teacher>}
          />
          <Route
            path="/teacher/student/:studentId/observe/:observationId"
            element={<Teacher><ObservationForm /></Teacher>}
          />

          {/* Parent */}
          <Route path="/parent" element={<Parent><ParentHome /></Parent>} />

          {/* Either role — a teacher checks what the parent will see. */}
          <Route
            path="/profile/:studentId"
            element={<SignedIn><ParentProfile /></SignedIn>}
          />

          {/* Old links from v1 */}
          <Route path="/stickers" element={<Navigate to="/teacher/stickers" replace />} />
          <Route path="/teacher/:studentId" element={<LegacyStudentRedirect />} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </StoreProvider>
    </AuthProvider>
  )
}

// v1 shipped /teacher/:studentId as the observation form. Keep those links alive.
function LegacyStudentRedirect() {
  const { studentId } = useParams()
  return <Navigate to={`/teacher/student/${studentId}`} replace />
}
