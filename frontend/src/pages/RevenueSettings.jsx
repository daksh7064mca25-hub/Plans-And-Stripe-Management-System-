import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { toast } from 'react-toastify';
import { Settings, Percent, Users, Save, Loader2 } from 'lucide-react';

const RevenueSettings = () => {
  const [mode, setMode] = useState('Percentage');
  const [ownerPercentage, setOwnerPercentage] = useState(70);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await api.get('/revenue/settings');
        setMode(res.data.mode);
        setOwnerPercentage(res.data.ownerPercentage);
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to load revenue settings');
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.put('/revenue/settings', {
        mode,
        ownerPercentage: mode === 'Percentage' ? Number(ownerPercentage) : undefined,
      });
      toast.success('Revenue sharing settings updated successfully');
      setMode(res.data.mode);
      setOwnerPercentage(res.data.ownerPercentage);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-73px)] bg-slate-950 text-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center space-x-3 mb-8">
          <Settings className="h-8 w-8 text-indigo-500" />
          <h1 className="text-3xl font-bold tracking-tight">Revenue Sharing Settings</h1>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none"></div>

          <form onSubmit={handleSave} className="space-y-8">
            <div>
              <label className="text-lg font-semibold text-slate-200">Select Revenue Sharing Mode</label>
              <p className="text-sm text-slate-400 mt-1 mb-4">
                Choose how incoming Stripe payments will be distributed automatically among yourself and active employees.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Mode 1: Equal Split */}
                <div
                  onClick={() => setMode('Equal')}
                  className={`cursor-pointer rounded-xl p-5 border transition-all flex flex-col justify-between ${
                    mode === 'Equal'
                      ? 'border-indigo-500 bg-indigo-500/10 shadow-lg shadow-indigo-500/10'
                      : 'border-slate-800 bg-slate-900/50 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <Users className={`h-5 w-5 ${mode === 'Equal' ? 'text-indigo-400' : 'text-slate-400'}`} />
                      <span className="font-semibold text-slate-100">Equal Split</span>
                    </div>
                    <div className={`h-4 w-4 rounded-full border flex items-center justify-center ${mode === 'Equal' ? 'border-indigo-500' : 'border-slate-600'}`}>
                      {mode === 'Equal' && <div className="h-2 w-2 rounded-full bg-indigo-500"></div>}
                    </div>
                  </div>
                  <p className="text-sm text-slate-400 leading-relaxed">
                    The total Stripe subscription payment will be divided equally among you (the Owner) and all active Employees.
                  </p>
                </div>

                {/* Mode 2: Percentage Split */}
                <div
                  onClick={() => setMode('Percentage')}
                  className={`cursor-pointer rounded-xl p-5 border transition-all flex flex-col justify-between ${
                    mode === 'Percentage'
                      ? 'border-indigo-500 bg-indigo-500/10 shadow-lg shadow-indigo-500/10'
                      : 'border-slate-800 bg-slate-900/50 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <Percent className={`h-5 w-5 ${mode === 'Percentage' ? 'text-indigo-400' : 'text-slate-400'}`} />
                      <span className="font-semibold text-slate-100">Percentage Split</span>
                    </div>
                    <div className={`h-4 w-4 rounded-full border flex items-center justify-center ${mode === 'Percentage' ? 'border-indigo-500' : 'border-slate-600'}`}>
                      {mode === 'Percentage' && <div className="h-2 w-2 rounded-full bg-indigo-500"></div>}
                    </div>
                  </div>
                  <p className="text-sm text-slate-400 leading-relaxed">
                    You configure a specific percentage to receive. The remaining balance is split equally among all active Employees.
                  </p>
                </div>
              </div>
            </div>

            {/* Percentage configuration */}
            {mode === 'Percentage' && (
              <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 animate-fadeIn">
                <div className="flex justify-between items-center mb-4">
                  <label htmlFor="ownerPercentage" className="block text-sm font-semibold text-slate-300">
                    Owner Share Percentage
                  </label>
                  <span className="text-2xl font-bold text-indigo-400">{ownerPercentage}%</span>
                </div>

                <input
                  id="ownerPercentage"
                  type="range"
                  min="0"
                  max="100"
                  value={ownerPercentage}
                  onChange={(e) => setOwnerPercentage(Number(e.target.value))}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />

                <div className="flex justify-between text-xs text-slate-500 mt-2">
                  <span>0% (Full to Employees)</span>
                  <span>100% (Full to Owner)</span>
                </div>

                <div className="mt-4 p-3 bg-indigo-500/5 rounded-lg border border-indigo-500/10 text-xs text-indigo-300 leading-relaxed">
                  <strong>Distribution Rule:</strong> You will receive {ownerPercentage}% of all subscription sales. The remaining{' '}
                  {100 - ownerPercentage}% will be shared equally among all active employees.
                </div>
              </div>
            )}

            {mode === 'Equal' && (
              <div className="bg-indigo-500/5 p-4 rounded-xl border border-indigo-500/10 text-sm text-indigo-300">
                <strong>Equal Split Active:</strong> 100% of future subscription sales will be divided evenly in equal parts among the Owner and
                all active Employees.
              </div>
            )}

            {/* Save Button */}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center space-x-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-700/50 text-white font-semibold rounded-xl shadow-lg shadow-indigo-600/20 hover:shadow-indigo-500/30 transition-all cursor-pointer"
              >
                {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                <span>{saving ? 'Saving...' : 'Save Settings'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RevenueSettings;
