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
import RouteGuard from './auth/RouteGuard'
import Forbidden from './pages/Forbidden'
import ResetPassword from './pages/ResetPassword'
import SideNav from './components/SideNav'

const MainLayout = ({ children }) => {
  return (
    <div className="main-layout">
      <SideNav />
      <main className="main-content">
        {children}
      </main>
    </div>
  )
}

const Dashboard = () => (
  <div className="page-content">
    <h1>Dashboard</h1>
    <p>Welcome to the dashboard!</p>
  </div>
)





function App() {

  return (
    <>
      <BrowserRouter>
      <Routes>
        <Route path='/' element={<Navigate to="/register" replace />}></Route>
        <Route path='/register' element={<Register />}></Route>
        <Route path='/login' element={<Login />}></Route>
        <Route path='/forget-password' element={<ForgetPassword />}></Route>
        <Route path='/reset-password/:token' element={<ResetPassword />}></Route>
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

        <Route path='/newsletter' element={
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

        <Route path='/legislation' element={
          <RouteGuard requireAuth>
            <MainLayout>
              <Legislation />
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

        <Route path='/settings' element={
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
    </>
  )
}

export default App