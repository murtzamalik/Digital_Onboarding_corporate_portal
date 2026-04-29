import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { MainLayout } from './layouts/MainLayout'
import { ProtectedLayout } from './layouts/ProtectedLayout'
import { BatchDetailPage } from './pages/BatchDetailPage'
import { BatchEmployeeDetailPage } from './pages/BatchEmployeeDetailPage'
import { DashboardPage } from './pages/DashboardPage'
import { ForgotPasswordPage } from './pages/ForgotPasswordPage'
import { InviteManagementPage } from './pages/InviteManagementPage'
import { LoginPage } from './pages/LoginPage'
import { MyBatchesPage } from './pages/MyBatchesPage'
import { ResetPasswordPage } from './pages/ResetPasswordPage'
import { ReportsPage } from './pages/ReportsPage'
import { UploadBatchPage } from './pages/UploadBatchPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route element={<ProtectedLayout />}>
          <Route element={<MainLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/batches/upload" element={<UploadBatchPage />} />
            <Route path="/batches" element={<MyBatchesPage />} />
            <Route path="/batches/:ref/employees/:employeeRef" element={<BatchEmployeeDetailPage />} />
            <Route path="/batches/:ref" element={<BatchDetailPage />} />
            <Route path="/invites" element={<InviteManagementPage />} />
            <Route path="/reports" element={<ReportsPage />} />
          </Route>
        </Route>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
