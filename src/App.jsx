import './styles/styles.scss'
import { Register } from './sections/login-register/Register'
import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom'
import { Login } from './sections/login-register/Login'
import { ForgetPassword } from './sections/login-register/ForgetPassword'
import { Events } from './sections/events/Events'
import { Notices } from './sections/notices/Notices'
import RouteGuard from './auth/RouteGuard'
import Forbidden from './pages/Forbidden'
import ResetPassword from './pages/ResetPassword'
import SideNav from './components/SideNav'

// Layout component for pages with SideNav
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

// Placeholder components for new routes
const Dashboard = () => (
  <div className="page-content">
    <h1>Dashboard</h1>
    <p>Welcome to the dashboard!</p>
  </div>
)

const Newsletter = () => (
  <div className="page-content">
    <h1>Newsletter</h1>
    <p>Manage newsletter subscriptions and content.</p>
  </div>
)

const Membership = () => (
  <div className="page-content">
    <h1>Membership</h1>
    <p>Manage membership information and benefits.</p>
  </div>
)

const Subscription = () => (
  <div className="page-content">
    <h1>Subscription</h1>
    <p>Manage subscription plans and billing.</p>
  </div>
)

const Legislation = () => (
  <div className="page-content">
    <h1>Legislation</h1>
    <p>View and manage legislative information.</p>
  </div>
)

const Reports = () => (
  <div className="page-content">
    <h1>Reports</h1>
    <p>Generate and view reports.</p>
  </div>
)

const Settings = () => (
  <div className="page-content">
    <h1>Settings</h1>
    <p>Configure application settings.</p>
  </div>
)

function App() {

  return (
    <>
      <BrowserRouter>
      <Routes>
        {/* Public routes without SideNav */}
        <Route path='/' element={<Navigate to="/login" replace />}></Route>
        <Route path='/register' element={<Register />}></Route>
        <Route path='/login' element={<Login />}></Route>
        <Route path='/forget-password' element={<ForgetPassword />}></Route>
        <Route path='/reset-password/:token' element={<ResetPassword />}></Route>
        <Route path='/forbidden' element={<Forbidden />}></Route>

        {/* Protected routes with SideNav */}
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
              <Newsletter />
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

        <Route path='/logout' element={
          <RouteGuard requireAuth>
            <MainLayout>
              <div className="page-content-centered">
                <h1>Logout</h1>
                <p>You have been logged out.</p>
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