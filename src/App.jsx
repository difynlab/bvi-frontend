import './styles/styles.scss'
import { Register } from './sections/login-register/Register'
import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom'
import { Login } from './sections/login-register/Login'
import { ForgetPassword } from './sections/login-register/ForgetPassword'
import { Events } from './sections/events/Events'
import { Notices } from './sections/notices/Notices'
import { Newsletters } from './sections/newsletters/Newsletters'
import Membership from './sections/membership/Membership'
import Settings from './sections/settings/Settings'
import Reports from './sections/reports/Reports'
import Subscription from './sections/subscription/Subscription'
import { Legislation } from './sections/legislation/Legislation'
import { CommunicationsPlaybook } from './sections/communications-playbook/CommunicationsPlaybook'
import { Gallery } from './sections/gallery/Gallery'
import FindExpert from './sections/find-expert/FindExpert'
import Dashboard from './sections/dashboard/Dashboard'
import RouteGuard from './auth/RouteGuard'
import Forbidden from './pages/Forbidden'
import ResetPassword from './pages/ResetPassword'
import SideNav from './components/SideNav'
import BottomNav from './components/BottomNav'
import MobileHeader from './components/MobileHeader'
import { AuthProvider } from './context/AuthContext.jsx'
import { NotificationProvider } from './context/NotificationContext'
import { ModalStateProvider } from './hooks/useModalState.jsx'
import SkeletonThemeProvider from './components/SkeletonSetup'

const MainLayout = ({ children }) => {
  return (
    <div className="main-layout">
      <MobileHeader />
      <SideNav />
      <main className="main-content">
        {children}
      </main>
      <BottomNav />
    </div>
  )
}

function App() {

  return (
    <AuthProvider>
      <NotificationProvider>
        <ModalStateProvider>
          <SkeletonThemeProvider>
            <BrowserRouter>
            <Routes>
          <Route path='/' element={<Navigate to="/login" replace />}></Route>
          <Route path='/register' element={<Register />}></Route>
          <Route path='/login' element={<Login />}></Route>
          <Route path='/forgot-password' element={<ForgetPassword />}></Route>
          <Route path='/reset-password' element={<ResetPassword />}></Route>
          <Route path='/forbidden' element={<Forbidden />}></Route>

          <Route path='/dashboard' element={
            <RouteGuard requireAuth>
              <MainLayout>
                <Dashboard />
              </MainLayout>
            </RouteGuard>
          }></Route>

          <Route path='/events' element={
            <RouteGuard requireAuth>
              <MainLayout>
                <Events />
              </MainLayout>
            </RouteGuard>
          }></Route>

          <Route path='/notices' element={
            <RouteGuard requireAuth>
              <MainLayout>
                <Notices />
              </MainLayout>
            </RouteGuard>
          }></Route>

          <Route path='/communications-playbook' element={
            <RouteGuard requireAuth>
              <MainLayout>
                <CommunicationsPlaybook />
              </MainLayout>
            </RouteGuard>
          }></Route>

          <Route path='/newsletters' element={
            <RouteGuard requireAuth>
              <MainLayout>
                <Newsletters />
              </MainLayout>
            </RouteGuard>
          }></Route>

          <Route path='/membership' element={
            <RouteGuard requireAuth>
              <MainLayout>
                <Membership />
              </MainLayout>
            </RouteGuard>
          }></Route>

          <Route path='/subscription' element={
            <RouteGuard requireAuth>
              <MainLayout>
                <Subscription />
              </MainLayout>
            </RouteGuard>
          }></Route>

          <Route path='/find-expert' element={
            <RouteGuard requireAuth>
              <MainLayout>
                <FindExpert />
              </MainLayout>
            </RouteGuard>
          }></Route>

          <Route path='/legislation' element={
            <RouteGuard requireAuth>
              <MainLayout>
                <Legislation />
              </MainLayout>
            </RouteGuard>
          }></Route>

          <Route path='/gallery' element={
            <RouteGuard requireAuth>
              <MainLayout>
                <Gallery />
              </MainLayout>
            </RouteGuard>
          }></Route>

          <Route path='/reports' element={
            <RouteGuard requireAuth>
              <MainLayout>
                <Reports />
              </MainLayout>
            </RouteGuard>
          }></Route>

          <Route path='/profile' element={
            <RouteGuard requireAuth>
              <MainLayout>
                <Settings />
              </MainLayout>
            </RouteGuard>
          }></Route>

          <Route path='/admin' element={
            <RouteGuard allowRoles={['admin']}>
              <MainLayout>
                <div className="page-content-centered">
                  <h1>Admin Panel</h1>
                  <p>Welcome to the admin panel!</p>
                </div>
              </MainLayout>
            </RouteGuard>
          }></Route>
            </Routes>
            </BrowserRouter>
          </SkeletonThemeProvider>
        </ModalStateProvider>
      </NotificationProvider>
    </AuthProvider>
  )
}

export default App