import React from 'react'
import { Link } from 'react-router-dom'

const Forbidden = () => {
  return (
    <div className="forbidden-page">
      <h1 className="forbidden-code">
        403
      </h1>
      <h2 className="forbidden-title">
        Forbidden
      </h2>
      <p className="forbidden-message">
        You don't have permission to access this resource.
      </p>
      <Link 
        to="/login" 
        className="forbidden-link"
      >
        Back to Login
      </Link>
    </div>
  )
}

export default Forbidden
