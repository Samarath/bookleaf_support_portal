import { RouterProvider, createRouter, createRoute, createRootRoute, redirect } from '@tanstack/react-router'
import Login from './pages/Login'
import AuthorDashboard from './pages/AuthorDashboard'
import AdminDashboard from './pages/AdminDashboard'

const rootRoute = createRootRoute()

// Auth helpers
const isAuthenticated = () => localStorage.getItem("user") !== null;
const getUserRole = () => localStorage.getItem("role");

// Login Route - Redirects away if already logged in
const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: Login,
  beforeLoad: () => {
    if (isAuthenticated()) {
      const role = getUserRole();
      throw redirect({ to: role === 'ADMIN' ? '/admin' : '/author' });
    }
  }
})

// Author Route - Protects against unauthenticated or Admin access
const authorRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/author',
  component: AuthorDashboard,
  beforeLoad: () => {
    if (!isAuthenticated() || getUserRole() !== 'AUTHOR') {
      throw redirect({ to: '/' });
    }
  }
})

// Admin Route - Protects against unauthenticated or Author access
const adminRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/admin',
  component: AdminDashboard,
  beforeLoad: () => {
    if (!isAuthenticated() || getUserRole() !== 'ADMIN') {
      throw redirect({ to: '/' });
    }
  }
})

const routeTree = rootRoute.addChildren([indexRoute, adminRoute, authorRoute])
const router = createRouter({ routeTree })

export default function App() {
  return <RouterProvider router={router} />
}