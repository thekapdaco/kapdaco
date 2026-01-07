import { Link, useLocation } from 'react-router-dom';
import '../styles/admin.css';

export default function AdminNav() {
  const loc = useLocation();
  const isActive = (p) => loc.pathname.startsWith(p);
  const item = (to, label) => (
    <Link 
      to={to} 
      className={`admin-nav-item ${isActive(to) ? 'active' : ''}`}
    >
      {label}
    </Link>
  );
  return (
    <nav className="admin-nav">
      {item('/admin', 'Dashboard')}
      {item('/admin/users', 'Users')}
      {item('/admin/brands', 'Brands')}
      {item('/admin/products', 'Products')}
      {item('/admin/applications', 'Applications')}
      {item('/admin/orders', 'Orders')}
      {item('/admin/settings', 'Settings')}
    </nav>
  );
}


