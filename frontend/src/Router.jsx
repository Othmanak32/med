import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';

// Auth Pages
import Login from './pages/auth/Login';

// Dashboard
import Dashboard from './pages/dashboard/Dashboard';

// Products
import ProductList from './pages/products/ProductList';
import ProductForm from './pages/products/ProductForm';

// Inventory
import InventoryList from './pages/inventory/InventoryList';
import StockMovements from './pages/inventory/StockMovements';

// Sales
import SalesList from './pages/sales/SalesList';
import SalesForm from './pages/sales/SalesForm';
import SalesReturn from './pages/sales/SalesReturn';

// Purchases
import PurchasesList from './pages/purchases/PurchasesList';
import PurchaseForm from './pages/purchases/PurchaseForm';

// Customers
import CustomerList from './pages/customers/CustomerList';
import CustomerForm from './pages/customers/CustomerForm';
import CustomerDetails from './pages/customers/CustomerDetails';

// Suppliers
import SupplierList from './pages/suppliers/SupplierList';
import SupplierForm from './pages/suppliers/SupplierForm';
import SupplierDetails from './pages/suppliers/SupplierDetails';

// Reports
import SalesReport from './pages/reports/SalesReport';
import PurchasesReport from './pages/reports/PurchasesReport';
import InventoryReport from './pages/reports/InventoryReport';
import ProfitLossReport from './pages/reports/ProfitLossReport';
import CustomerReport from './pages/reports/CustomerReport';
import SupplierReport from './pages/reports/SupplierReport';

// Settings
import Settings from './pages/settings/Settings';

function PrivateRoute({ children }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/login" />;
}

function Router() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<Login />} />

      {/* Protected Routes */}
      <Route
        path="/"
        element={
          <PrivateRoute>
            <Dashboard />
          </PrivateRoute>
        }
      />

      {/* Products */}
      <Route
        path="/products"
        element={
          <PrivateRoute>
            <ProductList />
          </PrivateRoute>
        }
      />
      <Route
        path="/products/new"
        element={
          <PrivateRoute>
            <ProductForm />
          </PrivateRoute>
        }
      />
      <Route
        path="/products/:id"
        element={
          <PrivateRoute>
            <ProductForm />
          </PrivateRoute>
        }
      />

      {/* Inventory */}
      <Route
        path="/inventory"
        element={
          <PrivateRoute>
            <InventoryList />
          </PrivateRoute>
        }
      />
      <Route
        path="/inventory/movements"
        element={
          <PrivateRoute>
            <StockMovements />
          </PrivateRoute>
        }
      />

      {/* Sales */}
      <Route
        path="/sales"
        element={
          <PrivateRoute>
            <SalesList />
          </PrivateRoute>
        }
      />
      <Route
        path="/sales/new"
        element={
          <PrivateRoute>
            <SalesForm />
          </PrivateRoute>
        }
      />
      <Route
        path="/sales/return/:id"
        element={
          <PrivateRoute>
            <SalesReturn />
          </PrivateRoute>
        }
      />

      {/* Purchases */}
      <Route
        path="/purchases"
        element={
          <PrivateRoute>
            <PurchasesList />
          </PrivateRoute>
        }
      />
      <Route
        path="/purchases/new"
        element={
          <PrivateRoute>
            <PurchaseForm />
          </PrivateRoute>
        }
      />

      {/* Customers */}
      <Route
        path="/customers"
        element={
          <PrivateRoute>
            <CustomerList />
          </PrivateRoute>
        }
      />
      <Route
        path="/customers/new"
        element={
          <PrivateRoute>
            <CustomerForm />
          </PrivateRoute>
        }
      />
      <Route
        path="/customers/:id"
        element={
          <PrivateRoute>
            <CustomerDetails />
          </PrivateRoute>
        }
      />

      {/* Suppliers */}
      <Route
        path="/suppliers"
        element={
          <PrivateRoute>
            <SupplierList />
          </PrivateRoute>
        }
      />
      <Route
        path="/suppliers/new"
        element={
          <PrivateRoute>
            <SupplierForm />
          </PrivateRoute>
        }
      />
      <Route
        path="/suppliers/:id"
        element={
          <PrivateRoute>
            <SupplierDetails />
          </PrivateRoute>
        }
      />

      {/* Reports */}
      <Route
        path="/reports/sales"
        element={
          <PrivateRoute>
            <SalesReport />
          </PrivateRoute>
        }
      />
      <Route
        path="/reports/purchases"
        element={
          <PrivateRoute>
            <PurchasesReport />
          </PrivateRoute>
        }
      />
      <Route
        path="/reports/inventory"
        element={
          <PrivateRoute>
            <InventoryReport />
          </PrivateRoute>
        }
      />
      <Route
        path="/reports/profit-loss"
        element={
          <PrivateRoute>
            <ProfitLossReport />
          </PrivateRoute>
        }
      />
      <Route
        path="/reports/customers"
        element={
          <PrivateRoute>
            <CustomerReport />
          </PrivateRoute>
        }
      />
      <Route
        path="/reports/suppliers"
        element={
          <PrivateRoute>
            <SupplierReport />
          </PrivateRoute>
        }
      />

      {/* Settings */}
      <Route
        path="/settings"
        element={
          <PrivateRoute>
            <Settings />
          </PrivateRoute>
        }
      />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default Router;
