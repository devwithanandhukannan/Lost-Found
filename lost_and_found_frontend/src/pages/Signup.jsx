import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

function Signup() {
  const navigate = useNavigate();
  const { setUser, setToken } = useContext(AuthContext);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    phoneNumber: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!formData.email) newErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Invalid email';

    if (!formData.password) newErrors.password = 'Password is required';
    else if (formData.password.length < 6) newErrors.password = 'Min 6 characters';

    if (!formData.phoneNumber) newErrors.phoneNumber = 'Phone is required';
    else if (!/^\d{10}$/.test(formData.phoneNumber.replace(/\D/g, ''))) newErrors.phoneNumber = '10 digits required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/user/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
        credentials: 'include'
      });

      const data = await response.json();

      if (data.success) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        setToken(data.token);
        setUser(data.user);
        navigate('/dashboard');
      } else {
        setErrors({ general: data.message });
      }
    } catch (error) {
      setErrors({ general: 'Connection error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-black">Create Account</h1>
          <p className="text-xs text-gray-600 mt-1">Join us today</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {errors.general && (
            <div className="text-xs text-red-500 bg-red-50 p-2 rounded">
              {errors.general}
            </div>
          )}

          <div className="flex flex-col space-y-1.5">
            <label className="text-xs font-medium text-gray-700">Email</label>
            <input
              type="email"
              name="email"
              placeholder="your@email.com"
              value={formData.email}
              onChange={handleChange}
              className={`px-3 py-2 text-sm border bg-white text-black placeholder-gray-400 outline-none transition-colors ${
                errors.email ? 'border-red-500' : 'border-gray-200'
              } focus:border-black`}
            />
            {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
          </div>

          <div className="flex flex-col space-y-1.5">
            <label className="text-xs font-medium text-gray-700">Phone Number</label>
            <input
              type="tel"
              name="phoneNumber"
              placeholder="1234567890"
              value={formData.phoneNumber}
              onChange={handleChange}
              className={`px-3 py-2 text-sm border bg-white text-black placeholder-gray-400 outline-none transition-colors ${
                errors.phoneNumber ? 'border-red-500' : 'border-gray-200'
              } focus:border-black`}
            />
            {errors.phoneNumber && <p className="text-xs text-red-500">{errors.phoneNumber}</p>}
          </div>

          <div className="flex flex-col space-y-1.5">
            <label className="text-xs font-medium text-gray-700">Password</label>
            <input
              type="password"
              name="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              className={`px-3 py-2 text-sm border bg-white text-black placeholder-gray-400 outline-none transition-colors ${
                errors.password ? 'border-red-500' : 'border-gray-200'
              } focus:border-black`}
            />
            {errors.password && <p className="text-xs text-red-500">{errors.password}</p>}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 text-sm font-medium bg-black text-white hover:bg-gray-800 active:bg-gray-900 transition-all disabled:opacity-50"
          >
            {loading ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-xs text-gray-600">
            Already have an account?{' '}
            <button
              onClick={() => navigate('/login')}
              className="text-black font-semibold hover:underline transition-all"
            >
              Login
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Signup;