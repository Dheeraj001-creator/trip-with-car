import React, { useState } from 'react';
import { X, CheckCircle2, Car, Phone, User, MapPin } from 'lucide-react';
import { COMPANY_WHATSAPP, COMPANY_NAME } from '../data/cabsData';

interface DriverPartnerModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: 'en' | 'hi';
  theme?: 'dark' | 'light';
}

export const DriverPartnerModal: React.FC<DriverPartnerModalProps> = ({
  isOpen,
  onClose,
  language,
  theme = 'dark',
}) => {
  const [driverName, setDriverName] = useState('');
  const [driverPhone, setDriverPhone] = useState('');
  const [city, setCity] = useState('Varanasi');
  const [vehicleModel, setVehicleModel] = useState('Swift Dzire (Sedan)');
  const [isCommercialPlate, setIsCommercialPlate] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const isLight = theme === 'light';

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!driverName || !driverPhone) return;

    setSubmitted(true);
  };

  const cleanPhone = driverPhone.replace(/\D/g, '');
  const partnerWhatsAppText = `TRIPWITHCAR FLEET PARTNER APPLICATION
Name: ${driverName}
Phone: +91 ${cleanPhone}
Operating City: ${city}
Vehicle Model: ${vehicleModel}
Commercial Registration: ${isCommercialPlate ? 'Yes (Yellow Plate)' : 'No'}

I would like to onboard my commercial vehicle with the TripWithCar fleet network.`;

  const partnerWhatsAppUrl = `https://wa.me/${COMPANY_WHATSAPP}?text=${encodeURIComponent(partnerWhatsAppText)}`;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
      <div className={`relative w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden my-8 border transition-colors ${
        isLight
          ? 'bg-white border-slate-300 text-slate-900'
          : 'bg-[#0F172A] border-slate-700 text-white'
      }`}>
        <div className={`p-5 border-b flex items-center justify-between ${
          isLight ? 'bg-slate-100 border-slate-200' : 'bg-[#0B1120] border-slate-800'
        }`}>
          <div className="flex items-center gap-2">
            <Car className="w-5 h-5 text-blue-500" />
            <h3 className="text-sm font-black uppercase tracking-wider">
              {language === 'en' ? 'Fleet Owner & Chauffeur Partnership' : 'वाहन पार्टनर पंजीकरण'}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              isLight ? 'text-slate-500 hover:text-slate-900 hover:bg-slate-200' : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {submitted ? (
          <div className="p-8 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-500 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-black">Application Received</h3>
            <p className={`text-xs leading-relaxed max-w-sm mx-auto ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
              Thank you, {driverName}. Our onboarding manager will verify your vehicle specifications and contact you within 24 business hours.
            </p>

            <div className="pt-2">
              <a
                href={partnerWhatsAppUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg transition-colors cursor-pointer"
              >
                <span>Fast-Track on WhatsApp Dispatch</span>
              </a>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-xs font-bold mb-1 flex items-center gap-1.5 opacity-90">
                <User className="w-3.5 h-3.5 text-blue-500" />
                <span>Driver / Taxi Owner Name *</span>
              </label>
              <input
                type="text"
                required
                value={driverName}
                onChange={(e) => setDriverName(e.target.value)}
                placeholder="e.g. Anand Prakash"
                className={`w-full rounded-xl px-3.5 py-2.5 text-xs font-bold focus:outline-none transition-colors ${
                  isLight
                    ? 'bg-slate-50 border border-slate-300 text-slate-900 focus:border-blue-600 focus:bg-white'
                    : 'bg-[#090D16] border border-slate-700 text-white focus:border-blue-500'
                }`}
              />
            </div>

            <div>
              <label className="block text-xs font-bold mb-1 flex items-center gap-1.5 opacity-90">
                <Phone className="w-3.5 h-3.5 text-blue-500" />
                <span>WhatsApp Mobile Number *</span>
              </label>
              <input
                type="tel"
                inputMode="numeric"
                pattern="[0-9]*"
                required
                maxLength={10}
                value={driverPhone}
                onChange={(e) => setDriverPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                onPaste={(e) => {
                  e.preventDefault();
                  const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 10);
                  setDriverPhone(pasted);
                }}
                placeholder="10-digit number"
                className={`w-full rounded-xl px-3.5 py-2.5 text-xs font-bold font-mono focus:outline-none transition-colors ${
                  isLight
                    ? 'bg-slate-50 border border-slate-300 text-slate-900 focus:border-blue-600 focus:bg-white'
                    : 'bg-[#090D16] border border-slate-700 text-white focus:border-blue-500'
                }`}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold mb-1 flex items-center gap-1.5 opacity-90">
                  <MapPin className="w-3.5 h-3.5 text-blue-500" />
                  <span>Base City</span>
                </label>
                <select
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className={`w-full rounded-xl px-3 py-2 text-xs font-bold focus:outline-none transition-colors ${
                    isLight
                      ? 'bg-slate-50 border border-slate-300 text-slate-900'
                      : 'bg-[#090D16] border border-slate-700 text-white'
                  }`}
                >
                  <option value="Varanasi">Varanasi</option>
                  <option value="Ayodhya">Ayodhya</option>
                  <option value="Prayagraj">Prayagraj</option>
                  <option value="Lucknow">Lucknow</option>
                  <option value="Gorakhpur">Gorakhpur</option>
                  <option value="New Delhi">New Delhi</option>
                  <option value="Patna">Patna</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold mb-1 opacity-90">Vehicle Category</label>
                <select
                  value={vehicleModel}
                  onChange={(e) => setVehicleModel(e.target.value)}
                  className={`w-full rounded-xl px-3 py-2 text-xs font-bold focus:outline-none transition-colors ${
                    isLight
                      ? 'bg-slate-50 border border-slate-300 text-slate-900'
                      : 'bg-[#090D16] border border-slate-700 text-white'
                  }`}
                >
                  <option value="Swift Dzire (Sedan)">Swift Dzire / Etios (Sedan)</option>
                  <option value="Maruti Ertiga (SUV)">Maruti Ertiga (6+1)</option>
                  <option value="Innova Crysta">Toyota Innova Crysta</option>
                  <option value="Tempo Traveller">Tempo Traveller (12/17/26)</option>
                  <option value="WagonR / Hatchback">WagonR / Hatchback</option>
                </select>
              </div>
            </div>

            <div className="pt-2">
              <label className="flex items-center gap-2 text-xs font-bold cursor-pointer">
                <input
                  type="checkbox"
                  checked={isCommercialPlate}
                  onChange={(e) => setIsCommercialPlate(e.target.checked)}
                  className="accent-blue-600 w-4 h-4 rounded"
                />
                <span>Vehicle has Yellow Commercial Plate (T-Permit)</span>
              </label>
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs tracking-wider uppercase shadow-lg transition-all cursor-pointer"
            >
              Submit Fleet Onboarding Application
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
