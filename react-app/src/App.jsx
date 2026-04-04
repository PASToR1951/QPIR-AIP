import { Component, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Login from './Login';

// Framer-motion + all authenticated routes live in this lazy module.
// This keeps framer-motion (124KB) off the Login critical path.
const AnimatedContent = lazy(() => import('./AnimatedContent'));

const Spinner = () => (
  <div className="fixed inset-0 flex items-center justify-center bg-slate-50 dark:bg-dark-base">
    <div className="w-6 h-6 rounded-full border-2 border-slate-300 dark:border-slate-600 border-t-pink-500 animate-spin" />
  </div>
);

function AppRoutes() {
  const location = useLocation();

  // Login renders immediately — zero framer-motion dependency
  if (location.pathname === '/login') {
    return (
      <Routes location={location}>
        <Route path="/login" element={<Login />} />
      </Routes>
    );
  }

  // Everything else lazy-loads the animated shell (includes framer-motion)
  return (
    <Suspense fallback={<Spinner />}>
      <AnimatedContent />
    </Suspense>
  );
}

class ErrorBoundary extends Component {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 flex flex-col items-center justify-center bg-slate-50 dark:bg-dark-base text-slate-900 dark:text-slate-100 p-8 text-center">
          <h1 className="text-2xl font-bold mb-2">Something went wrong</h1>
          <p className="text-slate-500 mb-4">An unexpected error occurred.</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
          >
            Reload Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function App() {
  return (
    <Router>
      <ErrorBoundary>
        <AppRoutes />
      </ErrorBoundary>
    </Router>
  );
}

export default App;
