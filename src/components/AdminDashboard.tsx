import React, { useState, useEffect, useMemo } from 'react';
import { 
  Lock, 
  Search, 
  Phone, 
  MessageSquare, 
  UserCheck, 
  Car, 
  Calendar, 
  MapPin, 
  ArrowRight, 
  CheckCircle, 
  Clock, 
  Download, 
  Plus, 
  LogOut, 
  Key, 
  X, 
  Check, 
  Trash2, 
  DollarSign,
  AlertTriangle,
  Send,
  Eye,
  ArrowLeft,
  BarChart3,
  TrendingUp,
  Award,
  ArrowLeftRight
} from 'lucide-react';
import { Booking, TripType } from '../types/cab';
import { VEHICLES } from '../data/cabsData';
import { 
  getBookingsFromStorage, 
  updateBookingInStorage, 
  deleteBookingFromStorage, 
  getAdminPin, 
  setAdminPin,
  generateDriverAssignmentWhatsAppText,
  generateBookingId
} from '../utils/fareCalculator';

interface AdminDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  theme: 'dark' | 'light';
  language?: 'en' | 'hi';
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  isOpen,
  onClose,
  theme,
  language = 'en',
}) => {
  const isLight = theme === 'light';

  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem('twc_admin_auth') === 'true';
  });
  const [enteredPin, setEnteredPin] = useState('');
  const [pinError, setPinError] = useState(false);

  // Bookings state
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'confirmed' | 'assigned' | 'completed' | 'cancelled'>('all');
  const [tripTypeFilter, setTripTypeFilter] = useState<string>('all');
  const [viewTab, setViewTab] = useState<'list' | 'visual'>('list');
  const [inlineConfirmDeleteId, setInlineConfirmDeleteId] = useState<string | null>(null);

  // Visual Analytics Filter State
  const currentYearStr = new Date().getFullYear().toString();
  const [analyticsSelectedYear, setAnalyticsSelectedYear] = useState<string>(currentYearStr);
  const [analyticsSelectedMonth, setAnalyticsSelectedMonth] = useState<string>('all');
  const [stackMetric, setStackMetric] = useState<'status' | 'tripType'>('status');

  // Modals inside Admin
  const [driverModalBooking, setDriverModalBooking] = useState<Booking | null>(null);
  const [driverNameInput, setDriverNameInput] = useState('');
  const [driverPhoneInput, setDriverPhoneInput] = useState('');
  const [vehicleNoInput, setVehicleNoInput] = useState('');

  const [bookingToDelete, setBookingToDelete] = useState<Booking | null>(null);
  const [showAddManualModal, setShowAddManualModal] = useState(false);
  const [showPinSettingsModal, setShowPinSettingsModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Manual booking form state
  const [manualName, setManualName] = useState('');
  const [manualPhone, setManualPhone] = useState('');
  const [manualEmail, setManualEmail] = useState('');
  const [manualTripType, setManualTripType] = useState<TripType>('oneway');
  const [manualPickupCity, setManualPickupCity] = useState('Varanasi');
  const [manualDropCity, setManualDropCity] = useState('Ayodhya');
  const [manualAddress, setManualAddress] = useState('Home / Hotel Pickup');
  const [manualDate, setManualDate] = useState(new Date().toISOString().split('T')[0]);
  const [manualTime, setManualTime] = useState('08:00');
  const [manualVehicleCat, setManualVehicleCat] = useState('sedan');
  const [manualFare, setManualFare] = useState('2499');

  // Pin change form state
  const [oldPin, setOldPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [pinChangeError, setPinChangeError] = useState('');

  // Load bookings from storage
  const loadBookings = () => {
    const list = getBookingsFromStorage();
    setBookings(list);
  };

  useEffect(() => {
    if (isOpen) {
      loadBookings();
    }
  }, [isOpen, isAuthenticated]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Lock body scroll when dashboard is open
  useEffect(() => {
    if (isOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [isOpen]);

  // Handle PIN verification
  const handleVerifyPin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const storedPin = getAdminPin();
    if (enteredPin.trim() === storedPin) {
      setIsAuthenticated(true);
      sessionStorage.setItem('twc_admin_auth', 'true');
      setPinError(false);
      setEnteredPin('');
      loadBookings();
    } else {
      setPinError(true);
      setTimeout(() => setPinError(false), 2000);
    }
  };

  const handleKeypadPress = (num: string) => {
    if (enteredPin.length < 6) {
      const updated = enteredPin + num;
      setEnteredPin(updated);
      if (updated.length === 4) {
        const storedPin = getAdminPin();
        if (updated === storedPin) {
          setIsAuthenticated(true);
          sessionStorage.setItem('twc_admin_auth', 'true');
          setPinError(false);
          setEnteredPin('');
          loadBookings();
        }
      }
    }
  };

  const handleKeypadBackspace = () => {
    setEnteredPin(prev => prev.slice(0, -1));
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('twc_admin_auth');
    setEnteredPin('');
  };

  // Status updates
  const handleUpdateStatus = (booking: Booking, newStatus: 'confirmed' | 'assigned' | 'completed' | 'cancelled') => {
    const updated: Booking = { ...booking, status: newStatus };
    updateBookingInStorage(updated);
    loadBookings();
    showToast(`Status updated to ${newStatus.toUpperCase()}`);
  };

  // Open Driver Assignment Modal
  const handleOpenDriverModal = (b: Booking) => {
    setDriverModalBooking(b);
    setDriverNameInput(b.driverName || '');
    setDriverPhoneInput(b.driverPhone || '');
    setVehicleNoInput(b.vehicleNumber || '');
  };

  // Save Driver Assignment
  const handleSaveDriver = (e: React.FormEvent) => {
    e.preventDefault();
    if (!driverModalBooking) return;
    const cleanDriverPhone = driverPhoneInput.replace(/\D/g, '').slice(0, 10);
    if (!driverNameInput.trim() || cleanDriverPhone.length !== 10) {
      alert('Please enter Driver Name and valid 10-digit mobile number');
      return;
    }

    const updated: Booking = {
      ...driverModalBooking,
      driverName: driverNameInput.trim(),
      driverPhone: cleanDriverPhone,
      vehicleNumber: vehicleNoInput.trim() || 'Commercial Yellow Cab',
      status: 'assigned',
    };

    updateBookingInStorage(updated);
    loadBookings();
    setDriverModalBooking(null);
    showToast('Chauffeur assigned successfully!');
  };

  // Delete Booking Execution (Immediate state update + LocalStorage persistence)
  const handleConfirmDelete = () => {
    if (!bookingToDelete) return;
    deleteBookingFromStorage(bookingToDelete.bookingId);
    setBookings(prev => prev.filter(b => b.bookingId !== bookingToDelete.bookingId));
    setBookingToDelete(null);
    setInlineConfirmDeleteId(null);
    showToast(`Reservation ${bookingToDelete.bookingId} deleted successfully`);
  };

  // 1-Click Direct Delete from Card
  const handleDeleteBookingDirect = (bookingId: string) => {
    deleteBookingFromStorage(bookingId);
    setBookings(prev => prev.filter(b => b.bookingId !== bookingId));
    setBookingToDelete(null);
    setInlineConfirmDeleteId(null);
    showToast(`Reservation ${bookingId} deleted successfully`);
  };

  // Create Manual Booking
  const handleCreateManualBooking = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanManualPhone = manualPhone.replace(/\D/g, '').slice(0, 10);
    if (!manualName.trim() || cleanManualPhone.length !== 10) {
      alert('Please enter customer name and exactly 10-digit mobile number');
      return;
    }

    const vehicleObj = VEHICLES.find(v => v.category === manualVehicleCat) || VEHICLES[0];
    const newBooking: Booking = {
      bookingId: generateBookingId(),
      tripType: manualTripType,
      pickupCity: manualPickupCity.trim(),
      dropCity: manualDropCity.trim(),
      pickupAddress: manualAddress.trim(),
      pickupDate: manualDate,
      pickupTime: manualTime,
      vehicle: vehicleObj,
      estimatedDistanceKm: 160,
      baseFare: Number(manualFare) || 2499,
      driverAllowance: 300,
      tollEstimate: 160,
      gstAmount: 0,
      discountAmount: 0,
      totalFare: Number(manualFare) || 2499,
      passengerName: manualName.trim(),
      passengerPhone: cleanManualPhone,
      passengerEmail: manualEmail.trim() || 'manual@tripwithcar.com',
      passengerCount: 3,
      luggageCount: 2,
      paymentPreference: 'cash_to_driver',
      status: 'confirmed',
      createdAt: new Date().toISOString(),
    };

    updateBookingInStorage(newBooking);
    loadBookings();
    setShowAddManualModal(false);
    setManualName('');
    setManualPhone('');
    showToast(`Booking ${newBooking.bookingId} created!`);
  };

  // Change Admin PIN
  const handleChangePin = (e: React.FormEvent) => {
    e.preventDefault();
    const currentStored = getAdminPin();
    if (oldPin !== currentStored) {
      setPinChangeError('Current PIN is incorrect');
      return;
    }
    if (newPin.length < 4) {
      setPinChangeError('New PIN must be at least 4 digits');
      return;
    }
    setAdminPin(newPin);
    setShowPinSettingsModal(false);
    setOldPin('');
    setNewPin('');
    setPinChangeError('');
    // Lock dashboard immediately upon PIN update as requested
    setIsAuthenticated(false);
    sessionStorage.removeItem('twc_admin_auth');
    setEnteredPin('');
    showToast('PIN updated successfully! Dashboard locked. Enter new PIN to unlock.');
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (bookings.length === 0) {
      alert('No bookings to export.');
      return;
    }

    const headers = [
      'Booking ID',
      'Created At',
      'Status',
      'Customer Name',
      'Phone',
      'Email',
      'Trip Type',
      'Pickup City',
      'Drop City',
      'Pickup Date',
      'Pickup Time',
      'Vehicle Name',
      'Total Fare (INR)',
      'Assigned Driver',
      'Driver Phone',
      'Vehicle Plate'
    ];

    const rows = bookings.map(b => [
      b.bookingId,
      b.createdAt,
      b.status,
      `"${b.passengerName.replace(/"/g, '""')}"`,
      `"${b.passengerPhone}"`,
      `"${b.passengerEmail}"`,
      b.tripType,
      `"${b.pickupCity}"`,
      `"${b.dropCity || ''}"`,
      b.pickupDate,
      b.pickupTime,
      `"${b.vehicle?.name || ''}"`,
      b.totalFare,
      `"${b.driverName || 'Not Assigned'}"`,
      `"${b.driverPhone || ''}"`,
      `"${b.vehicleNumber || ''}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `TripWithCar_Bookings_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('CSV downloaded successfully!');
  };

  // Filtered Bookings list
  const filteredBookings = useMemo(() => {
    return bookings.filter(b => {
      // Query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesQuery = 
          b.bookingId.toLowerCase().includes(q) ||
          b.passengerName.toLowerCase().includes(q) ||
          b.passengerPhone.includes(q) ||
          b.pickupCity.toLowerCase().includes(q) ||
          (b.dropCity && b.dropCity.toLowerCase().includes(q)) ||
          (b.driverName && b.driverName.toLowerCase().includes(q));
        if (!matchesQuery) return false;
      }

      // Status filter
      if (statusFilter !== 'all' && b.status !== statusFilter) {
        return false;
      }

      // Trip type filter
      if (tripTypeFilter !== 'all' && b.tripType !== tripTypeFilter) {
        return false;
      }

      return true;
    });
  }, [bookings, searchQuery, statusFilter, tripTypeFilter]);

  // Summary Metrics
  const metrics = useMemo(() => {
    const totalCount = bookings.length;
    const totalGross = bookings.reduce((sum, b) => sum + (b.totalFare || 0), 0);
    const activeTrips = bookings.filter(b => b.status === 'confirmed' || b.status === 'assigned').length;
    
    const today = new Date().toISOString().split('T')[0];
    const todayBookings = bookings.filter(b => b.createdAt && b.createdAt.startsWith(today)).length;

    return { totalCount, totalGross, activeTrips, todayBookings };
  }, [bookings]);

  // Month Reference Data
  const MONTHS_LIST = useMemo(() => [
    { value: '01', label: 'Jan', fullName: 'January' },
    { value: '02', label: 'Feb', fullName: 'February' },
    { value: '03', label: 'Mar', fullName: 'March' },
    { value: '04', label: 'Apr', fullName: 'April' },
    { value: '05', label: 'May', fullName: 'May' },
    { value: '06', label: 'Jun', fullName: 'June' },
    { value: '07', label: 'Jul', fullName: 'July' },
    { value: '08', label: 'Aug', fullName: 'August' },
    { value: '09', label: 'Sep', fullName: 'September' },
    { value: '10', label: 'Oct', fullName: 'October' },
    { value: '11', label: 'Nov', fullName: 'November' },
    { value: '12', label: 'Dec', fullName: 'December' },
  ], []);

  // Available Years
  const availableYears = useMemo(() => {
    const years = new Set<string>();
    years.add('2026');
    years.add('2025');
    bookings.forEach(b => {
      const d = b.createdAt || b.pickupDate;
      if (d) {
        const y = new Date(d).getFullYear().toString();
        if (!isNaN(Number(y))) years.add(y);
      }
    });
    return Array.from(years).sort((a, b) => Number(b) - Number(a));
  }, [bookings]);

  // Bookings filtered specifically for Visual Analytics based on selected Month & Year
  const filteredAnalyticsBookings = useMemo(() => {
    return bookings.filter(b => {
      const dateStr = b.createdAt || b.pickupDate;
      if (!dateStr) return true;
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return true;

      const y = d.getFullYear().toString();
      const m = String(d.getMonth() + 1).padStart(2, '0');

      if (analyticsSelectedYear !== 'all' && y !== analyticsSelectedYear) {
        return false;
      }
      if (analyticsSelectedMonth !== 'all' && m !== analyticsSelectedMonth) {
        return false;
      }
      return true;
    });
  }, [bookings, analyticsSelectedYear, analyticsSelectedMonth]);

  // Visual Analytics Computations with Stacked Chart Data
  const analyticsData = useMemo(() => {
    const targetBookings = filteredAnalyticsBookings;
    const total = targetBookings.length || 0;
    const totalGross = targetBookings.reduce((sum, b) => sum + (b.totalFare || 0), 0);
    const avgFare = total ? Math.round(totalGross / total) : 0;

    const confirmedCount = targetBookings.filter(b => b.status === 'confirmed').length;
    const assignedCount = targetBookings.filter(b => b.status === 'assigned').length;
    const completedCount = targetBookings.filter(b => b.status === 'completed').length;
    const cancelledCount = targetBookings.filter(b => b.status === 'cancelled').length;

    const onewayCount = targetBookings.filter(b => b.tripType === 'oneway').length;
    const roundtripCount = targetBookings.filter(b => b.tripType === 'roundtrip').length;
    const localCount = targetBookings.filter(b => b.tripType === 'local').length;
    const airportCount = targetBookings.filter(b => b.tripType === 'airport').length;

    // Route Frequency
    const routeCounts: { [key: string]: { count: number; gross: number } } = {};
    targetBookings.forEach(b => {
      const key = `${b.pickupCity} → ${b.dropCity || 'Local'}`;
      if (!routeCounts[key]) routeCounts[key] = { count: 0, gross: 0 };
      routeCounts[key].count += 1;
      routeCounts[key].gross += b.totalFare || 0;
    });

    const topRoutes = Object.entries(routeCounts)
      .map(([route, data]) => ({ route, ...data }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 4);

    // Fleet Popularity
    const vehicleCounts: { [key: string]: number } = {};
    targetBookings.forEach(b => {
      const vName = b.vehicle?.name || 'Sedan';
      vehicleCounts[vName] = (vehicleCounts[vName] || 0) + 1;
    });
    const topVehicles = Object.entries(vehicleCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 4);

    // 12-Month Stacked Bar Chart Computations
    const targetYear = analyticsSelectedYear === 'all' ? '2026' : analyticsSelectedYear;
    const yearBookings = bookings.filter(b => {
      const d = b.createdAt || b.pickupDate;
      if (!d) return true;
      const y = new Date(d).getFullYear().toString();
      return analyticsSelectedYear === 'all' || y === targetYear;
    });

    const monthlyStacks = MONTHS_LIST.map((mObj, idx) => {
      const mBookings = yearBookings.filter(b => {
        const d = b.createdAt || b.pickupDate;
        if (!d) return false;
        const dt = new Date(d);
        return dt.getMonth() === idx;
      });

      const mCount = mBookings.length;
      const mGross = mBookings.reduce((sum, b) => sum + (b.totalFare || 0), 0);

      // Status breakdown
      const mConfirmed = mBookings.filter(b => b.status === 'confirmed').length;
      const mAssigned = mBookings.filter(b => b.status === 'assigned').length;
      const mCompleted = mBookings.filter(b => b.status === 'completed').length;
      const mCancelled = mBookings.filter(b => b.status === 'cancelled').length;

      // Trip type breakdown
      const mOneway = mBookings.filter(b => b.tripType === 'oneway').length;
      const mRoundtrip = mBookings.filter(b => b.tripType === 'roundtrip').length;
      const mLocal = mBookings.filter(b => b.tripType === 'local').length;
      const mAirport = mBookings.filter(b => b.tripType === 'airport').length;

      return {
        monthKey: mObj.value,
        label: mObj.label,
        fullName: mObj.fullName,
        count: mCount,
        gross: mGross,
        status: {
          confirmed: mConfirmed,
          assigned: mAssigned,
          completed: mCompleted,
          cancelled: mCancelled,
        },
        tripTypes: {
          oneway: mOneway,
          roundtrip: mRoundtrip,
          local: mLocal,
          airport: mAirport,
        },
      };
    });

    const maxMonthlyCount = Math.max(...monthlyStacks.map(m => m.count), 1);
    const maxMonthlyGross = Math.max(...monthlyStacks.map(m => m.gross), 1);

    // Period assessment: "kaisa tha"
    let performanceLabel = 'Steady Operations';
    let performanceTone: 'emerald' | 'amber' | 'blue' | 'slate' = 'emerald';
    if (total === 0) {
      performanceLabel = 'No Bookings in this Period';
      performanceTone = 'slate';
    } else if (cancelledCount > (confirmedCount + completedCount)) {
      performanceLabel = 'Needs Attention (High Cancellations)';
      performanceTone = 'amber';
    } else if (totalGross > 15000 || total >= 4) {
      performanceLabel = 'Peak Activity & High Volume';
      performanceTone = 'emerald';
    } else {
      performanceLabel = 'Healthy Dispatch Flow';
      performanceTone = 'blue';
    }

    return {
      total,
      totalGross,
      avgFare,
      performanceLabel,
      performanceTone,
      statusBreakdown: {
        confirmed: { count: confirmedCount, pct: total ? Math.round((confirmedCount / total) * 100) : 0 },
        assigned: { count: assignedCount, pct: total ? Math.round((assignedCount / total) * 100) : 0 },
        completed: { count: completedCount, pct: total ? Math.round((completedCount / total) * 100) : 0 },
        cancelled: { count: cancelledCount, pct: total ? Math.round((cancelledCount / total) * 100) : 0 },
      },
      tripTypeBreakdown: {
        oneway: { count: onewayCount, pct: total ? Math.round((onewayCount / total) * 100) : 0 },
        roundtrip: { count: roundtripCount, pct: total ? Math.round((roundtripCount / total) * 100) : 0 },
        local: { count: localCount, pct: total ? Math.round((localCount / total) * 100) : 0 },
        airport: { count: airportCount, pct: total ? Math.round((airportCount / total) * 100) : 0 },
      },
      topRoutes,
      topVehicles,
      monthlyStacks,
      maxMonthlyCount,
      maxMonthlyGross,
      assignmentRate: total ? Math.round(((assignedCount + completedCount) / total) * 100) : 0,
      completionRate: total ? Math.round(((total - cancelledCount) / total) * 100) : 100,
    };
  }, [filteredAnalyticsBookings, bookings, analyticsSelectedYear, analyticsSelectedMonth, MONTHS_LIST]);

  if (!isOpen) return null;

  return (
    <div className={`fixed inset-0 z-[120] ${
      !isAuthenticated 
        ? 'flex items-center justify-center p-3 bg-slate-900/60 backdrop-blur-md' 
        : 'overflow-y-auto overflow-x-hidden scrollbar-autohide bg-[#F8FAFC] text-slate-900'
    } animate-in fade-in duration-150`}>
      {/* Toast notification */}
      {toastMessage && (
        <div className="fixed top-3 left-1/2 -translate-x-1/2 z-[180] px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs shadow-2xl flex items-center gap-2 animate-in slide-in-from-top duration-150 border border-amber-600/30">
          <CheckCircle className="w-4 h-4 stroke-[2.5]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* SCREEN 1: SECURE PIN GATE */}
      {!isAuthenticated ? (
        <div className="w-full flex items-center justify-center my-auto">
          <div className="relative w-full max-w-[340px] rounded-2xl sm:rounded-3xl p-5 border border-slate-200 bg-white text-slate-900 shadow-2xl text-center transition-all">
            <button
              onClick={onClose}
              className="absolute top-3 right-3 p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
              title="Close & Return to Website"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Lock Emblem */}
            <div className="w-12 h-12 mx-auto mb-2.5 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-600 shadow-xs">
              <Lock className="w-6 h-6 stroke-[2.5]" />
            </div>

            <h2 className="text-base font-black tracking-tight text-slate-900">Staff &amp; Dispatch Access</h2>
            <p className="text-xs text-slate-500 mt-0.5 mb-3">
              Private portal for TripWithCar fleet dispatch.
            </p>

            {/* PIN Entry Display */}
            <form onSubmit={handleVerifyPin}>
              <input
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={enteredPin}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '');
                  setEnteredPin(val);
                  if (val.length === 4) {
                    const storedPin = getAdminPin();
                    if (val === storedPin) {
                      setIsAuthenticated(true);
                      sessionStorage.setItem('twc_admin_auth', 'true');
                      setPinError(false);
                      setEnteredPin('');
                      loadBookings();
                    }
                  }
                }}
                placeholder="Enter 4-digit PIN"
                className="w-full text-center tracking-widest text-lg font-mono font-bold py-2.5 px-3 rounded-xl border border-slate-300 bg-slate-50 text-slate-900 mb-2.5 focus:outline-none focus:border-amber-500 focus:bg-white transition-colors"
                autoFocus
              />

              {pinError && (
                <p className="text-red-600 text-xs font-semibold mb-2 flex items-center justify-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Invalid PIN. Try again.</span>
                </p>
              )}

              {/* Touch Keypad */}
              <div className="grid grid-cols-3 gap-1.5 mb-3">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                  <button
                    key={digit}
                    type="button"
                    onClick={() => handleKeypadPress(digit)}
                    className="h-10 rounded-xl text-base font-bold transition-all active:scale-95 cursor-pointer border border-slate-200 bg-slate-100 hover:bg-slate-200 text-slate-800 select-none shadow-xs"
                  >
                    {digit}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={onClose}
                  className="h-10 rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer border border-slate-200 bg-slate-100 text-slate-500 hover:bg-slate-200 select-none"
                >
                  Exit
                </button>
                <button
                  type="button"
                  onClick={() => handleKeypadPress('0')}
                  className="h-10 rounded-xl text-base font-bold transition-all active:scale-95 cursor-pointer border border-slate-200 bg-slate-100 hover:bg-slate-200 text-slate-800 select-none shadow-xs"
                >
                  0
                </button>
                <button
                  type="button"
                  onClick={handleKeypadBackspace}
                  className="h-10 rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer border border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-200 select-none"
                >
                  ⌫
                </button>
              </div>

              <button
                type="submit"
                disabled={enteredPin.length === 0}
                className="btn-gold w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-md disabled:opacity-50"
              >
                <Key className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Unlock Dashboard</span>
              </button>
            </form>

            <div className="mt-2.5 pt-2.5 border-t border-slate-200">
              <span className="text-[11px] text-slate-500 block">
                Protected by Owner PIN code
              </span>
            </div>
          </div>
        </div>
      ) : (
        /* SCREEN 2: AUTHENTICATED ADMIN DISPATCH DASHBOARD - WHITE HOMEPAGE THEME WITH DISTINCT SECTIONS */
        <div className="w-full min-h-screen p-3 sm:p-5 lg:p-6 pb-28 max-w-7xl mx-auto space-y-4">
          
          {/* SECTION 1: HEADER CONSOLE */}
          <div className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-200/90 bg-white text-slate-900 shadow-sm transition-all">
            {/* Top row: Brand & Live Desk Controls */}
            <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 text-[11px] font-black uppercase tracking-wider">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Live Dispatch Desk
                </span>
                <span className="text-xs font-bold text-amber-600 font-mono hidden sm:inline">TripWithCar Operations</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={onClose}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all border border-slate-300"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Site</span>
                </button>

                <button
                  onClick={handleLogout}
                  className="px-2.5 py-1.5 rounded-xl border border-red-200 bg-red-50 text-red-600 hover:bg-red-500 hover:text-white transition-all cursor-pointer flex items-center gap-1 text-xs font-bold"
                  title="Lock Dashboard"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Lock</span>
                </button>
              </div>
            </div>

            {/* Bottom row: Title & 4-Action Grid */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pt-3">
              <div>
                <h1 className="text-base sm:text-lg lg:text-xl font-black tracking-tight text-slate-900">
                  Reservation Management &amp; Dispatch Console
                </h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  Live fleet tracking, customer dispatch log &amp; chauffeur assignment.
                </p>
              </div>

              {/* 4-ACTION GRID: Equal height, clean responsive layout */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 w-full lg:w-auto shrink-0">
                <button
                  type="button"
                  onClick={() => setShowAddManualModal(true)}
                  className="h-10 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm cursor-pointer transition-all active:scale-95 whitespace-nowrap"
                >
                  <Plus className="w-4 h-4 stroke-[2.5] shrink-0" />
                  <span>+ Manual Ride</span>
                </button>

                <button
                  type="button"
                  onClick={handleExportCSV}
                  className="h-10 px-3 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all whitespace-nowrap shadow-xs"
                  title="Download CSV"
                >
                  <Download className="w-4 h-4 shrink-0 text-slate-600" />
                  <span>Export Excel</span>
                </button>

                <button
                  type="button"
                  onClick={() => setViewTab(prev => prev === 'visual' ? 'list' : 'visual')}
                  className={`h-10 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all whitespace-nowrap shadow-xs ${
                    viewTab === 'visual'
                      ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                      : 'border-slate-300 bg-white hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <BarChart3 className={`w-4 h-4 shrink-0 ${viewTab === 'visual' ? 'text-white' : 'text-blue-600'}`} />
                  <span>Visual Records</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowPinSettingsModal(true)}
                  className="h-10 px-3 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all whitespace-nowrap shadow-xs"
                >
                  <Key className="w-4 h-4 text-amber-500 shrink-0" />
                  <span>Change PIN</span>
                </button>
              </div>
            </div>
          </div>

          {/* SECTION 2: KPI METRIC CARDS - DISTINCT WHITE TILES WITH ACCENTS */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3">
            <div className="p-3.5 sm:p-4 rounded-2xl border border-slate-200/90 bg-white shadow-sm transition-all flex flex-col justify-between h-20 sm:h-22">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 font-bold truncate">Total Bookings</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">All</span>
              </div>
              <div className="text-xl sm:text-2xl font-black font-mono tracking-tight text-slate-900">{metrics.totalCount}</div>
            </div>

            <div className="p-3.5 sm:p-4 rounded-2xl border border-slate-200/90 bg-white shadow-sm transition-all flex flex-col justify-between h-20 sm:h-22">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 font-bold truncate">Active Trips</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">Live</span>
              </div>
              <div className="text-xl sm:text-2xl font-black font-mono tracking-tight text-emerald-600">{metrics.activeTrips}</div>
            </div>

            <div className="p-3.5 sm:p-4 rounded-2xl border border-slate-200/90 bg-white shadow-sm transition-all flex flex-col justify-between h-20 sm:h-22">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 font-bold truncate">Gross Tariff</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">Pipeline</span>
              </div>
              <div className="text-xl sm:text-2xl font-black font-mono tracking-tight text-amber-600">₹{metrics.totalGross.toLocaleString('en-IN')}</div>
            </div>

            <div className="p-3.5 sm:p-4 rounded-2xl border border-slate-200/90 bg-white shadow-sm transition-all flex flex-col justify-between h-20 sm:h-22">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 font-bold truncate">Today's Inquiries</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200">Today</span>
              </div>
              <div className="text-xl sm:text-2xl font-black font-mono tracking-tight text-purple-600">{metrics.todayBookings}</div>
            </div>
          </div>

          {/* VIEW SWITCH TABS (All Reservations List vs Visual Records) */}
          <div className="flex items-center justify-between pt-1 pb-1">
            <div className="bg-slate-200/80 p-1 rounded-2xl inline-flex gap-1.5 border border-slate-300/60 shadow-xs">
              <button
                type="button"
                onClick={() => setViewTab('list')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  viewTab === 'list'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-700 hover:bg-white/80'
                }`}
              >
                <Car className="w-3.5 h-3.5" />
                <span>All Reservations ({filteredBookings.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setViewTab('visual')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  viewTab === 'visual'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-700 hover:bg-white/80'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>Visual Records Summary</span>
              </button>
            </div>

            {viewTab === 'list' && (
              <span className="text-xs text-slate-500 font-semibold hidden sm:inline">
                Sorted by: Newest First
              </span>
            )}
          </div>

          {/* SECTION 3: DEDICATED VISUAL RECORDS SUMMARY WITH STACKED BAR CHART & TIME FILTERS */}
          {viewTab === 'visual' && (
            <div className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-200/90 bg-white text-slate-900 shadow-sm transition-all animate-in fade-in duration-150 space-y-4">
              
              {/* HEADER & TIME FILTERS TOOLBAR ("Month kaisa tha / Year kaisa tha") */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-amber-500 shrink-0" />
                    <h3 className="text-sm sm:text-base font-black tracking-tight text-slate-900">
                      Visual Dispatch &amp; Performance Telemetry
                    </h3>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Filter by Month &amp; Year to track period performance &amp; volume stacks.
                  </p>
                </div>

                {/* Dropdowns for Year & Month */}
                <div className="flex flex-wrap items-center gap-2">
                  {/* Year Filter */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-bold text-slate-500 uppercase">Year:</span>
                    <select
                      value={analyticsSelectedYear}
                      onChange={(e) => setAnalyticsSelectedYear(e.target.value)}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold border border-slate-300 bg-slate-50 text-slate-800 focus:outline-none focus:border-amber-500 cursor-pointer shadow-xs"
                    >
                      <option value="all">All Years</option>
                      {availableYears.map(y => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>
                  </div>

                  {/* Month Filter */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-bold text-slate-500 uppercase">Month:</span>
                    <select
                      value={analyticsSelectedMonth}
                      onChange={(e) => setAnalyticsSelectedMonth(e.target.value)}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold border border-slate-300 bg-slate-50 text-slate-800 focus:outline-none focus:border-amber-500 cursor-pointer shadow-xs"
                    >
                      <option value="all">All Months</option>
                      {MONTHS_LIST.map(m => (
                        <option key={m.value} value={m.value}>{m.fullName}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* QUICK PERIOD PRESET PILLS */}
              <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-1">
                <button
                  type="button"
                  onClick={() => {
                    setAnalyticsSelectedYear('all');
                    setAnalyticsSelectedMonth('all');
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                    analyticsSelectedYear === 'all' && analyticsSelectedMonth === 'all'
                      ? 'bg-amber-500 text-slate-950 shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                  }`}
                >
                  All Time
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setAnalyticsSelectedYear(currentYearStr);
                    setAnalyticsSelectedMonth('all');
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                    analyticsSelectedYear === currentYearStr && analyticsSelectedMonth === 'all'
                      ? 'bg-amber-500 text-slate-950 shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                  }`}
                >
                  Full Year {currentYearStr}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setAnalyticsSelectedYear(currentYearStr);
                    setAnalyticsSelectedMonth('10');
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                    analyticsSelectedYear === currentYearStr && analyticsSelectedMonth === '10'
                      ? 'bg-amber-500 text-slate-950 shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                  }`}
                >
                  Current Month (October)
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setAnalyticsSelectedYear(currentYearStr);
                    setAnalyticsSelectedMonth('09');
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                    analyticsSelectedYear === currentYearStr && analyticsSelectedMonth === '09'
                      ? 'bg-amber-500 text-slate-950 shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                  }`}
                >
                  Last Month (September)
                </button>
              </div>

              {/* PERIOD PERFORMANCE SUMMARY CARD ("Month kaisa tha / Year kaisa tha") */}
              <div className="p-4 sm:p-5 rounded-2xl border border-slate-200/90 bg-slate-50/90 shadow-xs space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm sm:text-base font-black text-slate-900">
                        {analyticsSelectedMonth !== 'all' 
                          ? `${MONTHS_LIST.find(m => m.value === analyticsSelectedMonth)?.fullName} ${analyticsSelectedYear === 'all' ? '' : analyticsSelectedYear} Performance Review`
                          : `${analyticsSelectedYear === 'all' ? 'All-Time Fleet History' : `Year ${analyticsSelectedYear} Fleet Performance Review`}`}
                      </span>
                      <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                        analyticsData.performanceTone === 'emerald'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                          : analyticsData.performanceTone === 'amber'
                          ? 'bg-amber-50 text-amber-700 border-amber-300'
                          : analyticsData.performanceTone === 'blue'
                          ? 'bg-blue-50 text-blue-700 border-blue-300'
                          : 'bg-slate-100 text-slate-600 border-slate-300'
                      }`}>
                        {analyticsData.performanceLabel}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {analyticsData.total} {analyticsData.total === 1 ? 'ride recorded' : 'rides recorded'} in selected period · Driver Fulfillment: <strong className="text-emerald-600">{analyticsData.completionRate}%</strong>
                    </p>
                  </div>

                  <div className="flex items-center gap-4 shrink-0 bg-white p-2.5 rounded-xl border border-slate-200 shadow-xs">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-500 block">Period Gross</span>
                      <span className="text-base sm:text-lg font-black font-mono text-emerald-600">
                        ₹{analyticsData.totalGross.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="pl-3 border-l border-slate-200">
                      <span className="text-[10px] uppercase font-bold text-slate-500 block">Avg Fare</span>
                      <span className="text-sm sm:text-base font-black font-mono text-amber-600">
                        ₹{analyticsData.avgFare}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Status & Trip Type Breakdown Pills */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-slate-200/80">
                  {/* Status Breakdown */}
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                      Status Distribution
                    </span>
                    <div className="flex flex-wrap items-center gap-1.5 text-xs font-bold">
                      <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Confirmed: {analyticsData.statusBreakdown.confirmed.count}
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                        Assigned: {analyticsData.statusBreakdown.assigned.count}
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200">
                        Completed: {analyticsData.statusBreakdown.completed.count}
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200">
                        Cancelled: {analyticsData.statusBreakdown.cancelled.count}
                      </span>
                    </div>
                  </div>

                  {/* Trip Type Breakdown */}
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                      Service Category Distribution
                    </span>
                    <div className="flex flex-wrap items-center gap-1.5 text-xs font-bold">
                      <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200">
                        One-Way: {analyticsData.tripTypeBreakdown.oneway.count}
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Round-Trip: {analyticsData.tripTypeBreakdown.roundtrip.count}
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                        Local: {analyticsData.tripTypeBreakdown.local.count}
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-cyan-50 text-cyan-700 border border-cyan-200">
                        Airport: {analyticsData.tripTypeBreakdown.airport.count}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* INTERACTIVE STACKED BAR CHART SECTION ("stck chart me dikhe data ke according") */}
              <div className="p-4 sm:p-5 rounded-2xl border border-slate-200/90 bg-slate-50/90 shadow-xs space-y-3">
                {/* Stacked Chart Header & Toggle */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200">
                  <div>
                    <span className="text-xs sm:text-sm font-black block text-slate-900">
                      Monthly Stacked Volume &amp; Revenue Chart ({analyticsSelectedYear === 'all' ? '2026' : analyticsSelectedYear})
                    </span>
                    <span className="text-xs text-slate-500">
                      Real booking volume stacked by status or trip type. Tap any bar to filter that month.
                    </span>
                  </div>

                  {/* Toggle Stack Metric (Status vs Trip Type) */}
                  <div className="flex items-center gap-1 bg-white p-0.5 rounded-xl border border-slate-300 shadow-xs shrink-0">
                    <button
                      type="button"
                      onClick={() => setStackMetric('status')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        stackMetric === 'status'
                          ? 'bg-amber-500 text-slate-950 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Stack by Status
                    </button>
                    <button
                      type="button"
                      onClick={() => setStackMetric('tripType')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        stackMetric === 'tripType'
                          ? 'bg-amber-500 text-slate-950 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Stack by Trip Type
                    </button>
                  </div>
                </div>

                {/* Mobile Swipe Helper Hint */}
                <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                  <span className="flex items-center gap-1.5 text-amber-700 font-bold">
                    <ArrowLeftRight className="w-3.5 h-3.5" />
                    Swipe horizontally to view all 12 months
                  </span>
                  <span className="text-slate-400">Tap column to inspect</span>
                </div>

                {/* THE 12-MONTH STACKED BAR CHART - 100% RESPONSIVE & MOBILE-FITTED */}
                <div className="overflow-x-auto scrollbar-none pt-2 pb-1">
                  <div className="flex items-end justify-between gap-1.5 sm:gap-2 min-w-[540px] h-44 px-1">
                    {analyticsData.monthlyStacks.map((m) => {
                      const isSelected = analyticsSelectedMonth === m.monthKey;
                      const hasData = m.count > 0;
                      const barHeightPct = hasData 
                        ? Math.max(Math.round((m.count / analyticsData.maxMonthlyCount) * 100), 16) 
                        : 6;

                      const totalM = m.count || 1;
                      const seg1Pct = stackMetric === 'status' 
                        ? Math.round((m.status.confirmed / totalM) * 100)
                        : Math.round((m.tripTypes.oneway / totalM) * 100);
                      const seg2Pct = stackMetric === 'status'
                        ? Math.round((m.status.assigned / totalM) * 100)
                        : Math.round((m.tripTypes.roundtrip / totalM) * 100);
                      const seg3Pct = stackMetric === 'status'
                        ? Math.round((m.status.completed / totalM) * 100)
                        : Math.round((m.tripTypes.local / totalM) * 100);
                      const seg4Pct = stackMetric === 'status'
                        ? Math.round((m.status.cancelled / totalM) * 100)
                        : Math.round((m.tripTypes.airport / totalM) * 100);

                      return (
                        <div
                          key={m.monthKey}
                          onClick={() => setAnalyticsSelectedMonth(isSelected ? 'all' : m.monthKey)}
                          className={`flex-1 flex flex-col items-center justify-end group cursor-pointer transition-all ${
                            isSelected ? 'scale-105' : 'hover:opacity-90'
                          }`}
                          title={`${m.fullName}: ${m.count} Trips, ₹${m.gross.toLocaleString('en-IN')}`}
                        >
                          {/* Value Tag on top */}
                          <span className={`text-[10px] font-mono font-bold mb-1 transition-colors ${
                            hasData ? (isSelected ? 'text-amber-600 font-black' : 'text-slate-800') : 'text-slate-400'
                          }`}>
                            {hasData ? `${m.count}` : '0'}
                          </span>

                          {/* The Stacked Bar Column */}
                          <div 
                            style={{ height: `${barHeightPct}%` }}
                            className={`w-full max-w-[34px] sm:max-w-[42px] rounded-lg overflow-hidden flex flex-col-reverse transition-all duration-300 ${
                              hasData 
                                ? isSelected ? 'ring-2 ring-amber-500 shadow-md' : 'shadow-xs'
                                : 'bg-slate-200'
                            }`}
                          >
                            {hasData && (
                              <>
                                {/* Segment 1: Confirmed or OneWay */}
                                <div
                                  style={{ height: `${seg1Pct}%` }}
                                  className={stackMetric === 'status' ? 'bg-emerald-500' : 'bg-amber-500'}
                                  title={stackMetric === 'status' ? `Confirmed: ${m.status.confirmed}` : `One-Way: ${m.tripTypes.oneway}`}
                                />
                                {/* Segment 2: Assigned or RoundTrip */}
                                <div
                                  style={{ height: `${seg2Pct}%` }}
                                  className={stackMetric === 'status' ? 'bg-blue-500' : 'bg-emerald-500'}
                                  title={stackMetric === 'status' ? `Driver Assigned: ${m.status.assigned}` : `Round-Trip: ${m.tripTypes.roundtrip}`}
                                />
                                {/* Segment 3: Completed or Local */}
                                <div
                                  style={{ height: `${seg3Pct}%` }}
                                  className={stackMetric === 'status' ? 'bg-indigo-500' : 'bg-blue-500'}
                                  title={stackMetric === 'status' ? `Completed: ${m.status.completed}` : `Local Hourly: ${m.tripTypes.local}`}
                                />
                                {/* Segment 4: Cancelled or Airport */}
                                <div
                                  style={{ height: `${seg4Pct}%` }}
                                  className={stackMetric === 'status' ? 'bg-rose-500' : 'bg-cyan-500'}
                                  title={stackMetric === 'status' ? `Cancelled: ${m.status.cancelled}` : `Airport: ${m.tripTypes.airport}`}
                                />
                              </>
                            )}
                          </div>

                          {/* Month Label */}
                          <span className={`text-[11px] mt-1.5 font-bold uppercase transition-colors ${
                            isSelected ? 'text-amber-600' : 'text-slate-600'
                          }`}>
                            {m.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 12-Month Interactive Chip Bar underneath */}
                <div className="flex items-center gap-1 overflow-x-auto scrollbar-none pt-2 pb-1 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setAnalyticsSelectedMonth('all')}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                      analyticsSelectedMonth === 'all'
                        ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                        : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
                    }`}
                  >
                    All Months
                  </button>
                  {MONTHS_LIST.map((m) => {
                    const isSelected = analyticsSelectedMonth === m.value;
                    return (
                      <button
                        key={m.value}
                        type="button"
                        onClick={() => setAnalyticsSelectedMonth(isSelected ? 'all' : m.value)}
                        className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                          isSelected
                            ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                            : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
                        }`}
                      >
                        {m.label}
                      </button>
                    );
                  })}
                </div>

                {/* Stack Legend Bar (Color Codes) */}
                <div className="pt-2 border-t border-slate-200 flex flex-wrap items-center justify-center sm:justify-start gap-3 text-xs font-semibold text-slate-700">
                  {stackMetric === 'status' ? (
                    <>
                      <span className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
                        <span>Confirmed ({analyticsData.statusBreakdown.confirmed.count})</span>
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-sm bg-blue-500" />
                        <span>Assigned ({analyticsData.statusBreakdown.assigned.count})</span>
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-sm bg-indigo-500" />
                        <span>Completed ({analyticsData.statusBreakdown.completed.count})</span>
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-sm bg-rose-500" />
                        <span>Cancelled ({analyticsData.statusBreakdown.cancelled.count})</span>
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-sm bg-amber-500" />
                        <span>One-Way ({analyticsData.tripTypeBreakdown.oneway.count})</span>
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
                        <span>Round-Trip ({analyticsData.tripTypeBreakdown.roundtrip.count})</span>
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-sm bg-blue-500" />
                        <span>Local Hourly ({analyticsData.tripTypeBreakdown.local.count})</span>
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-sm bg-cyan-500" />
                        <span>Airport Taxi ({analyticsData.tripTypeBreakdown.airport.count})</span>
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* 2 VISUAL BREAKDOWN COLUMNS: Top Corridors & Fleet Distribution */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                {/* Top Route Bars */}
                <div className="p-4 rounded-2xl border border-slate-200/90 bg-slate-50/90 shadow-xs">
                  <span className="text-xs font-black text-amber-700 uppercase tracking-wider block mb-2">
                    Top Corridors in this Period
                  </span>
                  {analyticsData.topRoutes.length === 0 ? (
                    <p className="text-xs text-slate-500 italic py-2">No route data in selected period.</p>
                  ) : (
                    <div className="space-y-2.5">
                      {analyticsData.topRoutes.map(r => {
                        const maxCount = Math.max(...analyticsData.topRoutes.map(x => x.count), 1);
                        const pct = Math.round((r.count / maxCount) * 100);
                        return (
                          <div key={r.route} className="text-xs">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-bold text-slate-800 truncate mr-2">{r.route}</span>
                              <span className="font-mono font-bold text-amber-700 shrink-0">
                                {r.count} {r.count === 1 ? 'trip' : 'trips'} · ₹{r.gross.toLocaleString('en-IN')}
                              </span>
                            </div>
                            <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
                              <div style={{ width: `${pct}%` }} className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full" />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Fleet Distribution Bars */}
                <div className="p-4 rounded-2xl border border-slate-200/90 bg-slate-50/90 shadow-xs">
                  <span className="text-xs font-black text-blue-700 uppercase tracking-wider block mb-2">
                    Fleet Category Distribution
                  </span>
                  {analyticsData.topVehicles.length === 0 ? (
                    <p className="text-xs text-slate-500 italic py-2">No vehicle data in selected period.</p>
                  ) : (
                    <div className="space-y-2.5">
                      {analyticsData.topVehicles.map(v => {
                        const total = analyticsData.total || 1;
                        const pct = Math.round((v.count / total) * 100);
                        return (
                          <div key={v.name} className="text-xs">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-bold text-slate-800 truncate mr-2">{v.name}</span>
                              <span className="font-mono font-bold text-blue-700 shrink-0">{v.count} trips ({pct}%)</span>
                            </div>
                            <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
                              <div style={{ width: `${pct}%` }} className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full" />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* SECTION 4: SEARCH & FILTERS BAR */}
          <div className="p-3.5 sm:p-4 rounded-2xl border border-slate-200/90 bg-white shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 text-slate-900">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by customer name, phone, booking ID, or city..."
                className="w-full pl-10 pr-4 py-2 rounded-xl text-xs sm:text-sm font-semibold border border-slate-300 bg-slate-50 focus:bg-white focus:border-amber-500 text-slate-900 focus:outline-none transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Status Pills - 100% hidden scrollbar with smooth swipe */}
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5 shrink-0 max-w-full">
              {(['all', 'confirmed', 'assigned', 'completed', 'cancelled'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                    statusFilter === st
                      ? 'bg-amber-500 text-slate-950 font-black shadow-xs border border-amber-500'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>

            {/* Trip Type Dropdown */}
            <select
              value={tripTypeFilter}
              onChange={(e) => setTripTypeFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl text-xs font-bold border border-slate-300 bg-slate-50 text-slate-800 focus:outline-none focus:border-amber-500 cursor-pointer shadow-xs"
            >
              <option value="all">All Trip Types</option>
              <option value="oneway">One Way</option>
              <option value="roundtrip">Round Trip</option>
              <option value="local">Local Hourly</option>
              <option value="airport">Airport Taxi</option>
            </select>
          </div>

          {/* SECTION 5: BOOKINGS FEED LIST */}
          <div className="space-y-3 pt-1">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-2">
                <span>Active Reservations</span>
                <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-mono text-[11px] font-bold border border-slate-200">
                  {filteredBookings.length} {filteredBookings.length === 1 ? 'Record' : 'Records'}
                </span>
              </span>
              <span className="text-xs text-slate-500 font-semibold">
                Sorted by: Newest
              </span>
            </div>

            {filteredBookings.length === 0 ? (
              <div className="p-12 text-center rounded-2xl border border-slate-200 bg-white text-slate-600 shadow-sm">
                <Car className="w-12 h-12 mx-auto mb-3 opacity-30 text-amber-500" />
                <h3 className="text-base font-bold text-slate-800">No bookings found</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  {bookings.length === 0 
                    ? 'No client has placed a reservation yet, or you can add a manual booking using the button above.'
                    : 'No bookings match your current search or filter criteria.'}
                </p>
                {bookings.length === 0 && (
                  <button
                    onClick={() => setShowAddManualModal(true)}
                    className="mt-4 px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs cursor-pointer shadow-sm"
                  >
                    + Add Sample Booking
                  </button>
                )}
              </div>
            ) : (
              filteredBookings.map((b) => {
                const customerWhatsAppMsg = encodeURIComponent(
                  `Namaste ${b.passengerName}, this is TripWithCar team regarding your cab booking ${b.bookingId} (${b.pickupCity} → ${b.dropCity || 'Local'}). How can we assist you?`
                );
                const customerWhatsAppUrl = `https://wa.me/91${b.passengerPhone.replace(/\D/g, '')}?text=${customerWhatsAppMsg}`;
                const driverDispatchText = encodeURIComponent(generateDriverAssignmentWhatsAppText(b));
                const driverShareUrl = `https://wa.me/91${b.passengerPhone.replace(/\D/g, '')}?text=${driverDispatchText}`;

                return (
                  <div
                    key={b.bookingId}
                    className="rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-5 text-slate-900 transition-all shadow-sm hover:shadow-md hover:border-slate-300"
                  >
                    {/* CARD HEADER */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 mb-2.5 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-amber-600 text-sm sm:text-base">
                          {b.bookingId}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 uppercase font-bold border border-slate-200">
                          {b.tripType}
                        </span>
                        <span className="text-xs text-slate-500">
                          {new Date(b.createdAt).toLocaleDateString()} at {new Date(b.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      {/* Status Dropdown & Delete Button */}
                      <div className="flex items-center gap-2">
                        <select
                          value={b.status}
                          onChange={(e) => handleUpdateStatus(b, e.target.value as any)}
                          className={`text-xs font-bold px-3 py-1 rounded-xl border focus:outline-none cursor-pointer ${
                            b.status === 'confirmed'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                              : b.status === 'assigned'
                              ? 'bg-blue-50 text-blue-700 border-blue-300'
                              : b.status === 'completed'
                              ? 'bg-indigo-50 text-indigo-700 border-indigo-300'
                              : 'bg-rose-50 text-rose-700 border-rose-300'
                          }`}
                        >
                          <option value="confirmed">Confirmed</option>
                          <option value="assigned">Driver Assigned</option>
                          <option value="completed">Completed</option>
                          <option value="cancelled">Cancelled</option>
                        </select>

                        {/* INLINE DELETE CONFIRMATION: Instant, Reliable, Zero Failure */}
                        {inlineConfirmDeleteId === b.bookingId ? (
                          <div className="flex items-center gap-1.5 bg-red-50 border border-red-200 px-2 py-1 rounded-xl animate-in fade-in duration-100">
                            <span className="text-[11px] font-bold text-red-600">Delete?</span>
                            <button
                              type="button"
                              onClick={() => handleDeleteBookingDirect(b.bookingId)}
                              className="px-2 py-0.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold text-[11px] shadow-xs cursor-pointer transition-colors"
                            >
                              Yes
                            </button>
                            <button
                              type="button"
                              onClick={() => setInlineConfirmDeleteId(null)}
                              className="p-0.5 text-slate-400 hover:text-slate-800 cursor-pointer"
                              title="Cancel"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setInlineConfirmDeleteId(b.bookingId)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                            title="Delete reservation"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* CARD BODY: 3 COLUMNS */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                      {/* COL 1: PASSENGER & DIRECT CONTACT */}
                      <div className="p-3.5 rounded-xl border border-slate-200/90 bg-slate-50/80 text-slate-900">
                        <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block mb-1">
                          Passenger Details
                        </span>
                        <div className="font-bold text-sm mb-0.5 text-slate-900">{b.passengerName}</div>
                        <div className="font-mono text-slate-600 font-semibold mb-2">{b.passengerPhone}</div>

                        {/* Quick Contact Buttons */}
                        <div className="flex gap-2 mt-2">
                          <a
                            href={`tel:${b.passengerPhone.replace(/\s+/g, '')}`}
                            className="flex-1 py-1.5 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center justify-center gap-1.5 shadow-xs transition-colors"
                          >
                            <Phone className="w-3.5 h-3.5" />
                            <span>Call Client</span>
                          </a>

                          <a
                            href={customerWhatsAppUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="flex-1 py-1.5 px-2.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-700 font-bold flex items-center justify-center gap-1.5 transition-colors"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>WhatsApp</span>
                          </a>
                        </div>
                      </div>

                      {/* COL 2: ROUTE, DATES & VEHICLE */}
                      <div className="p-3.5 rounded-xl border border-slate-200/90 bg-slate-50/80 text-slate-900">
                        <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block mb-1">
                          Journey Itinerary
                        </span>
                        <div className="font-bold text-sm flex items-center gap-1.5 mb-1 text-slate-900">
                          <span>{b.pickupCity}</span>
                          <ArrowRight className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                          <span>{b.dropCity || 'Local City Tour'}</span>
                        </div>
                        <div className="text-xs text-slate-600 flex items-center gap-1 mb-1">
                          <Calendar className="w-3 h-3 text-amber-600" />
                          <span>{b.pickupDate} at {b.pickupTime}</span>
                          {b.returnDate && <span className="text-amber-700 font-bold">· Return: {b.returnDate} ({b.returnTime || '18:00'})</span>}
                        </div>
                        <div className="text-xs text-slate-500 truncate">
                          <MapPin className="w-3 h-3 text-emerald-600 inline mr-1" />
                          {b.pickupAddress}
                        </div>
                        <div className="mt-2 pt-1.5 border-t border-slate-200 text-xs font-semibold flex items-center justify-between">
                          <span className="text-slate-700">{b.vehicle?.name || 'Cab'}</span>
                          <span className="font-mono font-bold text-amber-600 text-sm">₹{b.totalFare}</span>
                        </div>
                      </div>

                      {/* COL 3: DRIVER DISPATCH ASSIGNMENT */}
                      <div className="p-3.5 rounded-xl border border-slate-200/90 bg-slate-50/80 text-slate-900 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block">
                              Assigned Chauffeur
                            </span>
                            {b.driverName && (
                              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                Ready
                              </span>
                            )}
                          </div>

                          {b.driverName ? (
                            <div className="space-y-0.5 mb-2">
                              <div className="font-bold text-slate-900">{b.driverName}</div>
                              <div className="text-xs font-mono text-slate-600">{b.driverPhone}</div>
                              <div className="text-xs text-amber-700 font-bold">{b.vehicleNumber}</div>
                            </div>
                          ) : (
                            <p className="text-xs text-slate-500 italic mb-2">
                              No chauffeur assigned yet. Click below to assign driver name &amp; car plate.
                            </p>
                          )}
                        </div>

                        {/* Driver action buttons */}
                        <div className="space-y-1.5 mt-2">
                          <button
                            onClick={() => handleOpenDriverModal(b)}
                            className="w-full py-1.5 px-2.5 rounded-lg bg-blue-50 hover:bg-blue-100 border border-blue-300 text-blue-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <UserCheck className="w-3.5 h-3.5" />
                            <span>{b.driverName ? 'Change Driver' : 'Assign Chauffeur'}</span>
                          </button>

                          {b.driverName && (
                            <a
                              href={driverShareUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="w-full py-1 px-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-700 font-bold text-xs flex items-center justify-center gap-1 transition-colors"
                            >
                              <Send className="w-3 h-3" />
                              <span>Share Driver Info via WhatsApp</span>
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* MODAL 1: ASSIGN DRIVER DIALOG */}
          {driverModalBooking && (
            <div className="fixed inset-0 z-[160] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
              <div className="relative w-full max-w-md rounded-2xl sm:rounded-3xl p-5 border border-slate-200 bg-white text-slate-900 shadow-2xl transition-all">
                <button
                  onClick={() => setDriverModalBooking(null)}
                  className="absolute top-4 right-4 p-1.5 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-100 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>

                <h3 className="text-base font-black flex items-center gap-2 mb-1 text-slate-900">
                  <UserCheck className="w-5 h-5 text-amber-500" />
                  <span>Assign Chauffeur &amp; Cab</span>
                </h3>
                <p className="text-xs text-slate-500 mb-4">
                  For Booking <strong className="text-amber-600 font-mono">{driverModalBooking.bookingId}</strong> ({driverModalBooking.passengerName})
                </p>

                <form onSubmit={handleSaveDriver} className="space-y-3 text-xs">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Chauffeur / Driver Name *</label>
                    <input
                      type="text"
                      required
                      value={driverNameInput}
                      onChange={(e) => setDriverNameInput(e.target.value)}
                      placeholder="e.g. Ramesh Kumar Yadav"
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:border-amber-500 text-slate-900 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Driver Phone Number * (10 Digits Only)</label>
                    <input
                      type="tel"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      required
                      maxLength={10}
                      value={driverPhoneInput}
                      onChange={(e) => setDriverPhoneInput(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      onPaste={(e) => {
                        e.preventDefault();
                        const val = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 10);
                        setDriverPhoneInput(val);
                      }}
                      placeholder="e.g. 9876543210"
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:border-amber-500 text-slate-900 font-mono font-bold focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Vehicle License Plate / Model</label>
                    <input
                      type="text"
                      value={vehicleNoInput}
                      onChange={(e) => setVehicleNoInput(e.target.value)}
                      placeholder="e.g. UP 65 AB 4521 (White Dzire)"
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:border-amber-500 text-slate-900 focus:outline-none"
                    />
                  </div>

                  <div className="pt-2 flex gap-2">
                    <button
                      type="button"
                      onClick={() => setDriverModalBooking(null)}
                      className="flex-1 py-2.5 rounded-xl border border-slate-300 bg-slate-100 text-slate-700 font-bold hover:bg-slate-200 transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 btn-gold py-2.5 rounded-xl font-bold flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
                    >
                      <Check className="w-4 h-4" />
                      <span>Save &amp; Assign</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* MODAL 2: ADD MANUAL BOOKING */}
          {showAddManualModal && (
            <div className="fixed inset-0 z-[160] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150 overflow-y-auto">
              <div className="relative w-full max-w-lg rounded-2xl sm:rounded-3xl p-5 border border-slate-200 bg-white text-slate-900 shadow-2xl my-8 transition-all">
                <button
                  onClick={() => setShowAddManualModal(false)}
                  className="absolute top-4 right-4 p-1.5 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-100 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>

                <h3 className="text-base font-black flex items-center gap-2 mb-1 text-slate-900">
                  <Plus className="w-5 h-5 text-amber-500" />
                  <span>Create Manual Reservation</span>
                </h3>
                <p className="text-xs text-slate-500 mb-4">
                  For phone call orders, WhatsApp inquiries, or walk-in clients.
                </p>

                <form onSubmit={handleCreateManualBooking} className="space-y-3 text-xs">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Customer Name *</label>
                      <input
                        type="text"
                        required
                        value={manualName}
                        onChange={(e) => setManualName(e.target.value)}
                        placeholder="e.g. Amit Sharma"
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:border-amber-500 text-slate-900 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Phone Number * (10 Digits Only)</label>
                      <input
                        type="tel"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        required
                        maxLength={10}
                        value={manualPhone}
                        onChange={(e) => setManualPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                        onPaste={(e) => {
                          e.preventDefault();
                          const val = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 10);
                          setManualPhone(val);
                        }}
                        placeholder="e.g. 9876543210"
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:border-amber-500 text-slate-900 font-mono font-bold focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Trip Type</label>
                      <select
                        value={manualTripType}
                        onChange={(e) => setManualTripType(e.target.value as any)}
                        className="w-full px-2.5 py-2 rounded-xl border border-slate-300 bg-slate-50 text-slate-900 focus:outline-none font-bold"
                      >
                        <option value="oneway">One Way</option>
                        <option value="roundtrip">Round Trip</option>
                        <option value="local">Local Hourly</option>
                        <option value="airport">Airport</option>
                      </select>
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Pickup City</label>
                      <input
                        type="text"
                        required
                        value={manualPickupCity}
                        onChange={(e) => setManualPickupCity(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-slate-50 text-slate-900 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Drop City</label>
                      <input
                        type="text"
                        required
                        value={manualDropCity}
                        onChange={(e) => setManualDropCity(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-slate-50 text-slate-900 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Pickup Date</label>
                      <input
                        type="date"
                        value={manualDate}
                        onChange={(e) => setManualDate(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-slate-50 text-slate-900 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Pickup Time</label>
                      <input
                        type="time"
                        value={manualTime}
                        onChange={(e) => setManualTime(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-slate-50 text-slate-900 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Pickup Address</label>
                    <input
                      type="text"
                      value={manualAddress}
                      onChange={(e) => setManualAddress(e.target.value)}
                      placeholder="e.g. Hotel Taj Ganges, Cantonment"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-slate-50 text-slate-900 focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Vehicle Category</label>
                      <select
                        value={manualVehicleCat}
                        onChange={(e) => setManualVehicleCat(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-slate-50 text-slate-900 focus:outline-none font-bold"
                      >
                        {VEHICLES.map(v => (
                          <option key={v.id} value={v.category}>{v.name} ({v.seats} Seats)</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Total Agreed Fare (₹)</label>
                      <input
                        type="number"
                        required
                        value={manualFare}
                        onChange={(e) => setManualFare(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-slate-50 font-mono font-bold text-amber-600 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="pt-2 flex gap-2">
                    <button
                      type="button"
                      onClick={() => setShowAddManualModal(false)}
                      className="flex-1 py-2.5 rounded-xl border border-slate-300 bg-slate-100 text-slate-700 font-bold hover:bg-slate-200 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 btn-gold py-2.5 rounded-xl font-bold flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
                    >
                      <Check className="w-4 h-4" />
                      <span>Save Booking</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* MODAL 3: CHANGE ADMIN PIN SETTINGS (LOCKS IMMEDIATELY ON UPDATE) */}
          {showPinSettingsModal && (
            <div className="fixed inset-0 z-[160] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
              <div className="relative w-full max-w-sm rounded-2xl sm:rounded-3xl p-5 border border-slate-200 bg-white text-slate-900 shadow-2xl transition-all">
                <button
                  onClick={() => setShowPinSettingsModal(false)}
                  className="absolute top-4 right-4 p-1.5 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-100 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>

                <h3 className="text-base font-black flex items-center gap-2 mb-1 text-slate-900">
                  <Key className="w-5 h-5 text-amber-500" />
                  <span>Change Admin PIN</span>
                </h3>
                <p className="text-xs text-slate-500 mb-4">
                  Set a new private PIN. Dashboard will lock immediately for security upon change.
                </p>

                <form onSubmit={handleChangePin} className="space-y-3 text-xs">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Current PIN</label>
                    <input
                      type="password"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={6}
                      required
                      value={oldPin}
                      onChange={(e) => setOldPin(e.target.value.replace(/\D/g, ''))}
                      placeholder="e.g. 1234"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:border-amber-500 text-slate-900 focus:outline-none font-mono text-center tracking-widest text-base"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">New PIN (4-6 digits)</label>
                    <input
                      type="password"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={6}
                      required
                      value={newPin}
                      onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                      placeholder="e.g. 5678"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:border-amber-500 text-slate-900 focus:outline-none font-mono text-center tracking-widest text-base"
                    />
                  </div>

                  {pinChangeError && (
                    <p className="text-red-600 text-xs font-semibold">{pinChangeError}</p>
                  )}

                  <div className="pt-2 flex gap-2">
                    <button
                      type="button"
                      onClick={() => setShowPinSettingsModal(false)}
                      className="flex-1 py-2.5 rounded-xl border border-slate-300 bg-slate-100 text-slate-700 font-bold hover:bg-slate-200 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 btn-gold py-2.5 rounded-xl font-bold flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
                    >
                      <Check className="w-4 h-4" />
                      <span>Update &amp; Lock</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* MODAL 4: IN-APP DELETE CONFIRMATION */}
          {bookingToDelete && (
            <div className="fixed inset-0 z-[170] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
              <div className="relative w-full max-w-sm rounded-2xl sm:rounded-3xl p-5 border border-slate-200 bg-white text-slate-900 shadow-2xl transition-all">
                <div className="w-10 h-10 rounded-xl bg-red-50 border border-red-200 text-red-600 flex items-center justify-center mb-3">
                  <Trash2 className="w-5 h-5 stroke-[2.5]" />
                </div>

                <h3 className="text-base font-black text-slate-900 mb-1">Delete Reservation?</h3>
                <p className="text-xs text-slate-600 mb-4 leading-relaxed">
                  Are you sure you want to permanently delete reservation <strong className="text-amber-600 font-mono">{bookingToDelete.bookingId}</strong> for <strong className="text-slate-900">{bookingToDelete.passengerName}</strong> ({bookingToDelete.pickupCity} → {bookingToDelete.dropCity || 'Local'})?
                </p>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setBookingToDelete(null)}
                    className="flex-1 py-2 rounded-xl border border-slate-300 bg-slate-100 text-slate-700 font-bold text-xs hover:bg-slate-200 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmDelete}
                    className="flex-1 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-md transition-colors cursor-pointer"
                  >
                    Yes, Delete
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
