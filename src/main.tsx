import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Layout from './components/Layout'
import Spinner from './components/Spinner'
import './index.css'

import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import QuickEntry from './pages/QuickEntry'
import Students from './pages/Students'
import Batches from './pages/Batches'
import ClassUpdates from './pages/ClassUpdates'
import Announcements from './pages/Announcements'
import ParentPortal from './pages/ParentPortal'

function Protected({ children }: { children: React.ReactElement }) {
  const { session, loading } = useAuth()
  if (loading) return <Spinner />
  if (!session) return <Navigate to="/login" replace />
  return <Layout>{children}</Layout>
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/portal/:token" element={<ParentPortal />} />
          <Route path="/" element={<Protected><Dashboard /></Protected>} />
          <Route path="/quick" element={<Protected><QuickEntry /></Protected>} />
          <Route path="/students" element={<Protected><Students /></Protected>} />
          <Route path="/batches" element={<Protected><Batches /></Protected>} />
          <Route path="/updates" element={<Protected><ClassUpdates /></Protected>} />
          <Route path="/announcements" element={<Protected><Announcements /></Protected>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  </React.StrictMode>
)
