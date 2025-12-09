import './assets/main.css'

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import App from './App'
import Dashboard from './pages/dashboard/dashboard'
import Courses from './pages/courses/courses'
import CourseModules from './pages/courses/course-modules'
import VideoPlayer from './pages/courses/video-player'
import LoginPage from './pages/auth/login'
import AppLayout from './templates/app-layout'
import RootLayout from './templates/root-layout'
import { FolderProvider } from './context/folder-context'
import ProtectedCourseRoute from './routes/protected-course-route'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <FolderProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<RootLayout />}>
            <Route path="/" element={<App />} />
            {/* Auth Routes */}
            <Route path="/auth/login" element={<LoginPage />} />
          </Route>

          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route
              path="/courses"
              element={
                <ProtectedCourseRoute>
                  <Courses />
                </ProtectedCourseRoute>
              }
            />
            <Route
              path="/courses/:coursePath"
              element={
                <ProtectedCourseRoute>
                  <CourseModules />
                </ProtectedCourseRoute>
              }
            />
            <Route
              path="/courses/:coursePath/video/:videoPath"
              element={
                <ProtectedCourseRoute>
                  <VideoPlayer />
                </ProtectedCourseRoute>
              }
            />
          </Route>
        </Routes>
      </BrowserRouter>
    </FolderProvider>
  </StrictMode>
)
