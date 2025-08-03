import './assets/main.css'

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import App from './app'
import Dashboard from './pages/dashboard/dashboard'
import Courses from './pages/courses/courses'
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
          </Route>
        </Routes>
      </BrowserRouter>
    </FolderProvider>
  </StrictMode>
)
