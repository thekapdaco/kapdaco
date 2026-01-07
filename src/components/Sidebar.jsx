import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';


export default function Sidebar() {
const { user, logout } = useAuth();
const { pathname } = useLocation();
const is = (p) => pathname.startsWith(p);
if (!user) return null;
return (
<aside style={{ width: 240, padding: 16, borderRight: '1px solid #eee', minHeight: '100vh' }}>
<h3>Kapda‑Co</h3>
<p style={{ opacity: .7 }}>Signed in as <b>{user.name}</b> · {user.role}</p>
{user.role === 'designer' ? (
<nav>
<Link to="/designer/dashboard" className={is('/designer/dashboard')?'active':''}>Dashboard</Link><br/>
<Link to="/designer/products" className={is('/designer/products')?'active':''}>Products</Link><br/>
<Link to="/designer/designs" className={is('/designer/designs')?'active':''}>Designs</Link><br/>
<Link to="/designer/orders" className={is('/designer/orders')?'active':''}>Orders</Link><br/>
<Link to="/designer/earnings" className={is('/designer/earnings')?'active':''}>Earnings</Link><br/>
</nav>
) : (
<nav>
<Link to="/admin/dashboard" className={is('/admin/dashboard')?'active':''}>Dashboard</Link><br/>
<Link to="/admin/users" className={is('/admin/users')?'active':''}>Users</Link><br/>
<Link to="/admin/products" className={is('/admin/products')?'active':''}>Products</Link><br/>
<Link to="/admin/orders" className={is('/admin/orders')?'active':''}>Orders</Link><br/>
</nav>
)}
<button onClick={logout} style={{ marginTop: 12 }}>Logout</button>
</aside>
);
}