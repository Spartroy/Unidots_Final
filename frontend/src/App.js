import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Auth Context Provider
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { LanguageProvider } from './context/LanguageContext';

// Landing Page
import Landing from './pages/Landing';

// Auth Pages
import Login from './pages/auth/Login';

// Client Portal Pages

// Employee Portal Pages


// Manager Portal Pages

// New imports for Prepress
import PrepressLayout from './components/layouts/PrepressLayout';

// Courier Portal
import ProtectedRoute from './components/common/ProtectedRoute';
import PublicRoute from './components/common/PublicRoute';
import CourierLayout from './components/layouts/CourierLayout';
// Layouts
import ClientLayout from './components/layouts/ClientLayout';
import EmployeeLayout from './components/layouts/EmployeeLayout';
import ManagerLayout from './components/layouts/ManagerLayout';

// Pages load on demand so the first visit downloads far less code
const Register = lazy(() => import('./pages/auth/Register'));
const ClientDashboard = lazy(() => import('./pages/client/Dashboard'));
const ClientOrders = lazy(() => import('./pages/client/Orders'));
const ClientOrderDetail = lazy(() => import('./pages/client/OrderDetail'));
const ClientNewOrder = lazy(() => import('./pages/client/NewOrder'));
const ClientClaims = lazy(() => import('./pages/client/Claims'));
const ClientClaimDetail = lazy(() => import('./pages/client/ClaimDetail'));
const ClientNewClaim = lazy(() => import('./pages/client/NewClaim'));
const ClientProfile = lazy(() => import('./pages/client/Profile'));
const EmployeeDashboard = lazy(() => import('./pages/employee/Dashboard'));
const EmployeeTasks = lazy(() => import('./pages/employee/Tasks'));
const EmployeeTaskDetail = lazy(() => import('./pages/employee/TaskDetail'));
const EmployeeOrders = lazy(() => import('./pages/employee/Orders'));
const EmployeeOrderDetail = lazy(() => import('./pages/employee/OrderDetail'));
const EmployeeOrderEdit = lazy(() => import('./pages/employee/OrderEdit'));
const EmployeeClaims = lazy(() => import('./pages/employee/Claims'));
const EmployeeClaimDetail = lazy(() => import('./pages/employee/ClaimDetail'));
const EmployeeProfile = lazy(() => import('./pages/employee/Profile'));
const Templates = lazy(() => import('./pages/employee/Templates'));
const TemplateCustomize = lazy(() => import('./pages/employee/TemplateCustomize'));
const ManagerDashboard = lazy(() => import('./pages/manager/Dashboard'));
const ManagerOrders = lazy(() => import('./pages/manager/Orders'));
const ManagerOrderDetail = lazy(() => import('./pages/manager/OrderDetail'));
const ManagerClaims = lazy(() => import('./pages/manager/Claims'));
const ManagerClaimDetail = lazy(() => import('./pages/manager/ClaimDetail'));
const ManagerTasks = lazy(() => import('./pages/manager/Tasks'));
const ManagerTaskDetail = lazy(() => import('./pages/manager/TaskDetail'));
const ManagerEmployees = lazy(() => import('./pages/manager/Employees'));
const ManagerEmployeeDetail = lazy(() => import('./pages/manager/EmployeeDetail'));
const ManagerClients = lazy(() => import('./pages/manager/Clients'));
const ManagerClientDetail = lazy(() => import('./pages/manager/ClientDetail'));
const ManagerProfile = lazy(() => import('./pages/manager/Profile'));
const MonthlyReports = lazy(() => import('./pages/manager/MonthlyReports'));
const ManagerMessages = lazy(() => import('./pages/manager/Messages'));
const BarrelManagement = lazy(() => import('./pages/manager/BarrelManagement'));
const ManagerPlateMonitoring = lazy(() => import('./pages/manager/PlateMonitoring'));
const PrepressOrders = lazy(() => import('./pages/prepress/Orders'));
const PrepressOrderHistory = lazy(() => import('./pages/prepress/OrderHistory'));
const PrepressOrderDetail = lazy(() => import('./pages/prepress/OrderDetail'));
const PrepressProfile = lazy(() => import('./pages/prepress/Profile'));
const AcidSolutionMonitor = lazy(() => import('./pages/prepress/AcidSolutionMonitor'));
const PrepressPlateMonitoring = lazy(() => import('./pages/prepress/PlateMonitoring'));
const CourierDashboard = lazy(() => import('./pages/courier/Dashboard'));
const CourierOrderDetail = lazy(() => import('./pages/courier/OrderDetail'));
const CourierProfile = lazy(() => import('./pages/courier/Profile'));
const DotDeformationDetector = lazy(() => import('./pages/DotDeformationDetector'));

// Protected Route Component

// Ai Components

function App() {
  return (
    <AuthProvider>
      <LanguageProvider>
      <NotificationProvider>
        <Suspense
          fallback={
            <div className="flex min-h-screen items-center justify-center" role="status">
              <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-primary-600" />
              <span className="sr-only">Loading…</span>
            </div>
          }
        >
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

          {/* Client Portal Routes */}
          <Route path="/client" element={
            <ProtectedRoute allowedRoles={['client']}>
              <ClientLayout />
            </ProtectedRoute>
          }>
            <Route index element={<ClientDashboard />} />
            <Route path="orders" element={<ClientOrders />} />
            <Route path="orders/:id" element={<ClientOrderDetail />} />
            <Route path="orders/new" element={<ClientNewOrder />} />
            <Route path="claims" element={<ClientClaims />} />
            <Route path="claims/:id" element={<ClientClaimDetail />} />
            <Route path="claims/new" element={<ClientNewClaim />} />
            <Route path="profile" element={<ClientProfile />} />
          </Route>

          {/* Employee Portal Routes */}
          <Route path="/employee" element={
            <ProtectedRoute allowedRoles={['employee']}>
              <EmployeeLayout />
            </ProtectedRoute>
          }>
            <Route index element={<EmployeeDashboard />} />
            <Route path="tasks" element={<EmployeeTasks />} />
            <Route path="tasks/:id" element={<EmployeeTaskDetail />} />
            <Route path="orders" element={<EmployeeOrders />} />
            <Route path="orders/:id" element={<EmployeeOrderDetail />} />
            <Route path="orders/:id/edit" element={<EmployeeOrderEdit />} />
            <Route path="templates" element={<Templates />} />
            <Route path="templates/:templateId" element={<TemplateCustomize />} />
            <Route path="templates/:templateId/customize" element={<TemplateCustomize />} />
            <Route path="claims" element={<EmployeeClaims />} />
            <Route path="claims/:id" element={<EmployeeClaimDetail />} />
            <Route path="profile" element={<EmployeeProfile />} />
          </Route>

          {/* Manager Portal Routes */}
          <Route path="/manager" element={
            <ProtectedRoute allowedRoles={['manager', 'admin']}>
              <ManagerLayout />
            </ProtectedRoute>
          }>
            <Route index element={<ManagerDashboard />} />
            <Route path="orders" element={<ManagerOrders />} />
            <Route path="orders/:id" element={<ManagerOrderDetail />} />
            <Route path="claims" element={<ManagerClaims />} />
            <Route path="claims/:id" element={<ManagerClaimDetail />} />
            <Route path="tasks" element={<ManagerTasks />} />
            <Route path="tasks/:id" element={<ManagerTaskDetail />} />
            <Route path="employees" element={<ManagerEmployees />} />
            <Route path="employees/:id" element={<ManagerEmployeeDetail />} />
            <Route path="clients" element={<ManagerClients />} />
            <Route path="clients/:id" element={<ManagerClientDetail />} />
            <Route path="barrel-management" element={<BarrelManagement />} />
            <Route path="plate-monitoring" element={<ManagerPlateMonitoring />} />
            <Route path="reports" element={<MonthlyReports />} />
            <Route path="messages" element={<ManagerMessages />} />
            <Route path="profile" element={<ManagerProfile />} />
          </Route>

          {/* Prepress Portal Routes */}
          <Route path="/prepress" element={
            <ProtectedRoute allowedRoles={['prepress']}>
              <PrepressLayout />
            </ProtectedRoute>
          }>
            <Route index element={<PrepressOrders />} />
            <Route path="history" element={<PrepressOrderHistory />} />
            <Route path="orders/:id" element={<PrepressOrderDetail />} />
            <Route path="acid-solution" element={<AcidSolutionMonitor />} />
            <Route path="plate-monitoring" element={<PrepressPlateMonitoring />} />
            <Route path="profile" element={<PrepressProfile />} />
          </Route>

          {/* Courier Portal Routes */}
          <Route path="/courier" element={
            <ProtectedRoute allowedRoles={['courier']}>
              <CourierLayout />
            </ProtectedRoute>
          }>
            <Route index element={<CourierDashboard />} />
            <Route path="orders/:id" element={<CourierOrderDetail />} />
            <Route path="profile" element={<CourierProfile />} />
          </Route>

          {/* Landing Page */}
          <Route path="/" element={<Landing />} />
          <Route path="/DotDeformationDetector" element={<DotDeformationDetector />} />
          
          {/* Catch all - redirect to landing */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </Suspense>
        
        <ToastContainer position="top-right" autoClose={5000} />
      </NotificationProvider>
      </LanguageProvider>
    </AuthProvider>
  );
}

export default App;