import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import { useContext } from 'react';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import ViewItem from './pages/ViewItem';
import MakeLost from './pages/MakeLost';
import MyItems from './pages/MyItems';
import Notifications from './pages/Notifications';
import FoundItemPage from './pages/FoundItemPage';

function ProtectedRoute({ children }) {
  const { user, loading } = useContext(AuthContext);

  if (loading) return <div>Loading...</div>;
  
  return user ? children : <Navigate to="/login" />;
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/view-item" element={<ProtectedRoute><ViewItem /></ProtectedRoute>} />
          <Route path="/item/:itemId" element={<FoundItemPage />} />
          <Route path="/make-lost" element={<ProtectedRoute><MakeLost /></ProtectedRoute>} />
          <Route path="/my-items" element={<ProtectedRoute><MyItems /></ProtectedRoute>} />
          <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;