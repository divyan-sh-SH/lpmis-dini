import { NavLink, Link } from 'react-router-dom';
import Logo from './Logo';

export default function NavBar() {
  return (
    <nav className="navbar">
      <Link to="/" className="nav-brand" aria-label="Go to HomeDash home">
        <Logo />
      </Link>

      <div className="nav-links">
        <NavLink to="/" end className="nav-link">
          Home
        </NavLink>
        <NavLink to="/expense" className="nav-link">
          Expense
        </NavLink>
        <NavLink to="/carts" className="nav-link">
          Carts
        </NavLink>
      </div>

      <div className="nav-right">
        <details className="user-menu">
          <summary className="user-summary">User</summary>
          <div className="user-dropdown">
            <button type="button" className="user-item">
              Profile
            </button>
            <button type="button" className="user-item">
              Settings
            </button>
            <button type="button" className="user-item user-logout">
              Logout
            </button>
          </div>
        </details>
      </div>
    </nav>
  );
}

