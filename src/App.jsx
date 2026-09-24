import { Suspense, lazy } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { AccountProvider } from './context/AccountContext';
import { CartProvider } from './context/CartContext';
import { ToastProvider } from './context/ToastContext';
import { GuestOnly, RequireAuth, RequirePermission, RequireStaff, ScrollToTop } from './components/layout/RouteGuards';
import AppLayout from './components/layout/AppLayout';
import RevealObserver from './components/fx/RevealObserver';

import Landing from './pages/public/Landing';
import Login from './pages/auth/Login';
import SignUp from './pages/auth/SignUp';
import ForgotPassword from './pages/auth/ForgotPassword';
import Dashboard from './pages/app/Dashboard';
import Shop from './pages/app/Shop';
import ProductDetail from './pages/app/ProductDetail';
import Cart from './pages/app/Cart';
import Checkout from './pages/app/Checkout';
import DigitalServices from './pages/app/DigitalServices';
import CommissionRequest from './pages/app/CommissionRequest';
import MyOrders from './pages/app/MyOrders';
import MyProjects from './pages/app/MyProjects';
import TrackOrder from './pages/app/TrackOrder';
import TrackDetail from './pages/app/TrackDetail';
import Notifications from './pages/app/Notifications';
import Profile from './pages/app/Profile';
import NotFound from './pages/NotFound';

// The admin panel is only for staff, so it loads as a separate chunk.
const AdminLayout = lazy(() => import('./components/layout/AdminLayout'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminOrders = lazy(() => import('./pages/admin/AdminOrders'));
const AdminOrderDetail = lazy(() => import('./pages/admin/AdminOrderDetail'));
const AdminProjects = lazy(() => import('./pages/admin/AdminProjects'));
const AdminProjectDetail = lazy(() => import('./pages/admin/AdminProjectDetail'));
const AdminProducts = lazy(() => import('./pages/admin/AdminProducts'));
const AdminCustomers = lazy(() => import('./pages/admin/AdminCustomers'));
const AdminCustomerDetail = lazy(() => import('./pages/admin/AdminCustomerDetail'));
const AdminTeam = lazy(() => import('./pages/admin/AdminTeam'));

const Loading = () => <div className="route-loading" aria-busy="true" aria-label="Loading" />;

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <AccountProvider>
            <CartProvider>
              <ScrollToTop />
              <RevealObserver />
              <Suspense fallback={<Loading />}>
              <Routes>
                <Route path="/" element={<Landing />} />

                <Route element={<GuestOnly />}>
                  <Route path="/login" element={<Login />} />
                  <Route path="/signup" element={<SignUp />} />
                  <Route path="/forgot-password" element={<ForgotPassword />} />
                </Route>
                <Route element={<GuestOnly area="admin" />}>
                  <Route path="/admin/login" element={<Login staff />} />
                </Route>

                <Route element={<RequireStaff />}>
                  <Route path="/admin" element={<AdminLayout />}>
                    <Route index element={<AdminDashboard />} />
                    <Route path="orders" element={<AdminOrders />} />
                    <Route path="orders/:ref" element={<AdminOrderDetail />} />
                    <Route path="projects" element={<AdminProjects />} />
                    <Route path="projects/:ref" element={<AdminProjectDetail />} />
                    <Route path="products" element={<AdminProducts />} />
                    <Route
                      path="customers"
                      element={
                        <RequirePermission permission="view-customers">
                          <AdminCustomers />
                        </RequirePermission>
                      }
                    />
                    <Route
                      path="customers/:id"
                      element={
                        <RequirePermission permission="view-customers">
                          <AdminCustomerDetail />
                        </RequirePermission>
                      }
                    />
                    <Route
                      path="team"
                      element={
                        <RequirePermission permission="manage-team">
                          <AdminTeam />
                        </RequirePermission>
                      }
                    />
                    <Route path="*" element={<NotFound />} />
                  </Route>
                </Route>

                <Route element={<RequireAuth />}>
                  <Route path="/app" element={<AppLayout />}>
                    <Route index element={<Dashboard />} />
                    <Route path="shop" element={<Shop />} />
                    <Route path="shop/:productId" element={<ProductDetail />} />
                    <Route path="cart" element={<Cart />} />
                    <Route path="checkout" element={<Checkout />} />
                    <Route path="services" element={<DigitalServices />} />
                    <Route path="services/request" element={<CommissionRequest />} />
                    <Route path="orders" element={<MyOrders />} />
                    <Route path="projects" element={<MyProjects />} />
                    <Route path="track" element={<TrackOrder />} />
                    <Route path="track/:ref" element={<TrackDetail />} />
                    <Route path="notifications" element={<Notifications />} />
                    <Route path="profile" element={<Profile />} />
                    <Route path="*" element={<NotFound />} />
                  </Route>
                </Route>

                <Route path="*" element={<NotFound />} />
              </Routes>
              </Suspense>
            </CartProvider>
          </AccountProvider>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}
