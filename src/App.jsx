import './styles/styles.scss'
import { Register } from './sections/login-register/Register'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { Login } from './sections/login-register/Login'
import { ForgetPassword } from './sections/login-register/ForgetPassword'

function App() {

  return (
    <>
      <BrowserRouter>
      <Routes>
        <Route path='/register' element={<Register />}></Route>
        <Route path='/login' element={<Login />}></Route>
        <Route path='/forget-password' element={<ForgetPassword />}></Route>
      </Routes>
      </BrowserRouter>
    </>
  )
}

export default App