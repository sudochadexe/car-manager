'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { supabase, Vehicle, PipelineStage, StageCompletion, DropdownList, User } from '@/lib/supabase';

const MAKES_MODELS: Record<string, string[]> = {
  'Chevrolet': ['Silverado 1500', 'Silverado 2500', 'Equinox', 'Traverse', 'Tahoe', 'Suburban', 'Colorado', 'Camaro', 'Malibu', 'Express 1500', 'Express 2500', 'Cruze', 'Trax', 'Blazer'],
  'Ford': ['F-150', 'F-250', 'F-350', 'Explorer', 'Expedition', 'Escape', 'Edge', 'Mustang', 'Ranger', 'Bronco', 'Transit 150', 'Transit 250', 'Focus', 'Fusion'],
  'Toyota': ['Camry', 'Corolla', 'RAV4', 'Highlander', '4Runner', 'Tacoma', 'Tundra', 'Prius', 'Sienna', 'Sequoia'],
  'Honda': ['Civic', 'Accord', 'CR-V', 'Pilot', 'HR-V', 'Odyssey', 'Ridgeline', 'Passport'],
  'Nissan': ['Altima', 'Rogue', 'Sentra', 'Pathfinder', 'Armada', 'Frontier', 'Murano', 'Kicks'],
  'GMC': ['Sierra 1500', 'Sierra 2500', 'Acadia', 'Terrain', 'Yukon', 'Yukon XL', 'Canyon'],
  'Buick': ['Enclave', 'Encore', 'Envision', 'Regal', 'LaCrosse'],
  'Cadillac': ['Escalade', 'Escalade ESV', 'XT4', 'XT5', 'XT6', 'CT5', 'SRX'],
  'Dodge': ['Charger', 'Challenger', 'Durango', 'Journey', 'Grand Caravan', 'Hornet'],
  'Jeep': ['Wrangler', 'Grand Cherokee', 'Cherokee', 'Compass', 'Renegade', 'Gladiator'],
  'Ram': ['1500', '2500', '3500', 'ProMaster'],
  'Mazda': ['CX-5', 'CX-50', 'CX-9', 'Mazda3', 'Mazda6', 'CX-30'],
  'Subaru': ['Outback', 'Forester', 'Crosstrek', 'Impreza', 'Legacy', 'Ascent'],
  'Volkswagen': ['Tiguan', 'Atlas', 'Jetta', 'Passat', 'Golf', 'Taos'],
  'Hyundai': ['Tucson', 'Santa Fe', 'Elantra', 'Sonata', 'Palisade', 'Venue', 'Kona'],
  'Kia': ['Sportage', 'Telluride', 'Sorento', 'Forte', 'K5', 'Seltos', 'Carnival'],
  'Lexus': ['RX', 'ES', 'NX', 'GX', 'LX', 'IS', 'UX'],
  'BMW': ['X3', 'X5', 'X7', 'X1', '3 Series', '5 Series'],
  'Mercedes-Benz': ['GLC', 'GLE', 'GLS', 'C-Class', 'E-Class', 'S-Class'],
  'Audi': ['Q5', 'Q7', 'Q3', 'A4', 'A6', 'A3'],
  'Tesla': ['Model 3', 'Model Y', 'Model S', 'Model X', 'Cybertruck'],
  'Chrysler': ['Pacifica', '300', 'Voyager'],
  'Lincoln': ['Aviator', 'Navigator', 'Corsair', 'Nautilus', 'MKZ'],
  'Acura': ['MDX', 'RDX', 'TLX', 'ILX'],
  'Infiniti': ['QX60', 'QX80', 'QX50', 'Q50', 'Q60'],
  'Genesis': ['GV80', 'GV70', 'G80', 'G70'],
  'Mitsubishi': ['Outlander', 'Eclipse Cross', 'Mirage'],
  'Other': ['Other']
};

const YEARS = Array.from({ length: 40 }, (_, i) => (2026 - i).toString());
const COMMON_MAKES = Object.keys(MAKES_MODELS);

export default function Home() {
  const { user, loading: authLoading, logout } = useAuth();
  const router = useRouter();
  
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [stages, setStages] = useState<PipelineStage[]>([]);
  const [completions, setCompletions] = useState<StageCompletion[]>([]);
  const [dropdownLists, setDropdownLists] = useState<DropdownList[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [isDecoding, setIsDecoding] = useState(false);
  const [newVehicle, setNewVehicle] = useState({ year: '', make: '', model: '', vin: '', stock_num: '' });

  const getCurrentStatus = useCallback((vehicleId: string): string => {
    const vehicleCompletions = completions.filter(c => c.vehicle_id === vehicleId);
    const sortedStages = [...stages].sort((a, b) => a.order - b.order);
    
    for (const stage of sortedStages) {
      const completion = vehicleCompletions.find(c => c.stage_id === stage.id);
      if (!completion || !completion.completion_value || completion.cleared_at) {
        return stage.stage_name;
      }
    }
    return sortedStages.find(s => s.is_terminal)?.stage_name || 'Pending';
  }, [stages, completions]);

  const getAge = useCallback((inSystemDate: string): number => {
    const inDate = new Date(inSystemDate);
    const now = new Date();
    return Math.floor((now.getTime() - inDate.getTime()) / (1000 * 60 * 60 * 24));
  }, []);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  async function fetchData() {
    setLoading(true);
    try {
      const [vehiclesRes, stagesRes, completionsRes, dropdownsRes, usersRes] = await Promise.all([
        supabase.from('vehicles').select('*').eq('archived', false).order('created_at', { ascending: false }),
        supabase.from('pipeline_stages').select('*').order('order'),
        supabase.from('stage_completions').select('*'),
        supabase.from('dropdown_lists').select('*'),
        supabase.from('users').select('*').eq('active', true)
      ]);

      if (vehiclesRes.data) setVehicles(vehiclesRes.data);
      if (stagesRes.data) setStages(stagesRes.data);
      if (completionsRes.data) setCompletions(completionsRes.data);
      if (dropdownsRes.data) setDropdownLists(dropdownsRes.data);
      if (usersRes.data) setAllUsers(usersRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }

  const getAccessibleStages = (): PipelineStage[] => {
    if (!user) return stages;
    if (user.roles.includes('Manager')) return stages;
    return stages.filter(s => s.role === 'Manager' || user.roles.includes(s.role));
  };

  const getDropdownValues = (listName: string | null, stageRole: string): string[] => {
    if (!listName) return [];
    
    // Use real users for role-based dropdowns
    const roleBasedLists = ['Detailers', 'Advisors', 'Technicians'];
    if (roleBasedLists.includes(listName)) {
      // Map list names to roles
      const roleMap: { [key: string]: string } = {
        'Detailers': 'Detail',
        'Advisors': 'Service', 
        'Technicians': 'Service'
      };
      
      const targetRole = roleMap[listName];
      if (targetRole) {
        return allUsers
          .filter(u => u.roles.includes(targetRole))
          .map(u => u.name);
      }
    }
    
    // Fall back to static dropdown lists
    const list = dropdownLists.find(d => d.list_name === listName);
    return list?.values || [];
  };

  async function logAudit(action: string, vehicleId: string, vehicleDesc: string, fieldName: string, oldValue: string, newValue: string) {
    await supabase.from('audit_log').insert({
      dealership_id: user?.dealership_id,
      user_name: user?.name,
      user_role: user?.roles[0],
      action,
      vehicle_id: vehicleId,
      vehicle_desc: vehicleDesc,
      field_name: fieldName,
      old_value: oldValue,
      new_value: newValue
    });
  }

  async function handleAddVehicle() {
    if (!newVehicle.year || !newVehicle.make || !newVehicle.model) {
      alert('Please select year, make, and model');
      return;
    }

    try {
      const { data: existingVehicles } = await supabase
        .from('vehicles')
        .select('row_id')
        .order('row_id', { ascending: false })
        .limit(1);
      
      const nextRowId = existingVehicles && existingVehicles.length > 0 
        ? Math.max(...existingVehicles.map(v => v.row_id)) + 1 
        : 1;

      const vehicleData = {
        dealership_id: user?.dealership_id,
        row_id: nextRowId,
        stock_num: newVehicle.stock_num || `R${Date.now().toString().slice(-6)}`,
        year: newVehicle.year,
        make: newVehicle.make,
        model: newVehicle.model,
        vin: newVehicle.vin,
        status: 'Pending',
        age: 0,
        in_system_date: new Date().toISOString(),
        archived: false
      };

      const { data, error } = await supabase
        .from('vehicles')
        .insert(vehicleData)
        .select()
        .single();

      if (error) throw error;

      await logAudit('CREATE', data.id, `${newVehicle.year} ${newVehicle.make} ${newVehicle.model}`, 'vehicle', '', 'created');
      
      setShowAddForm(false);
      setNewVehicle({ year: '', make: '', model: '', vin: '', stock_num: '' });
      fetchData();
    } catch (error) {
      console.error('Error adding vehicle:', error);
      alert('Failed to add vehicle');
    }
  }

  async function updateStageCompletion(vehicleId: string, stage: PipelineStage, value: string) {
    try {
      const vehicle = vehicles.find(v => v.id === vehicleId);
      if (!vehicle) return;

      const existingCompletion = completions.find(
        c => c.vehicle_id === vehicleId && c.stage_id === stage.id
      );

      if (existingCompletion) {
        if (value) {
          const { error } = await supabase
            .from('stage_completions')
            .update({
              completion_value: value,
              completed_by: user?.name,
              completed_at: new Date().toISOString(),
              cleared_at: null
            })
            .eq('id', existingCompletion.id);

          if (error) throw error;
          await logAudit('UPDATE', vehicleId, `${vehicle.year} ${vehicle.make} ${vehicle.model}`, stage.completion_field, existingCompletion.completion_value || '', value);
        } else {
          const { error } = await supabase
            .from('stage_completions')
            .update({
              completion_value: null,
              completed_by: null,
              completed_at: null,
              cleared_at: new Date().toISOString()
            })
            .eq('id', existingCompletion.id);

          if (error) throw error;
          await logAudit('UPDATE', vehicleId, `${vehicle.year} ${vehicle.make} ${vehicle.model}`, stage.completion_field, existingCompletion.completion_value || '', '');
        }
      } else if (value) {
        const { error } = await supabase
          .from('stage_completions')
          .insert({
            vehicle_id: vehicleId,
            stage_id: stage.id,
            completion_value: value,
            completed_by: user?.name,
            completed_at: new Date().toISOString()
          });

        if (error) throw error;
        await logAudit('UPDATE', vehicleId, `${vehicle.year} ${vehicle.make} ${vehicle.model}`, stage.completion_field, '', value);
      }

      fetchData();
    } catch (error) {
      console.error('Error updating completion:', error);
    }
  }

  async function deleteVehicle(vehicleId: string) {
    if (!confirm('Remove this vehicle from inventory?')) return;

    try {
      const vehicle = vehicles.find(v => v.id === vehicleId);
      await supabase.from('vehicles').update({ archived: true }).eq('id', vehicleId);
      await logAudit('DELETE', vehicleId, `${vehicle?.year} ${vehicle?.make} ${vehicle?.model}`, 'vehicle', 'active', 'archived');
      setShowActions(false);
      setSelectedVehicle(null);
      fetchData();
    } catch (error) {
      console.error('Error deleting vehicle:', error);
    }
  }

  const decodeYearFromVin = (vin: string): string => {
    const code = vin.charAt(9).toUpperCase();
    const map: Record<string, number> = {
      'Y': 2000, '1': 2001, '2': 2002, '3': 2003, '4': 2004,
      '5': 2005, '6': 2006, '7': 2007, '8': 2008, '9': 2009,
      'A': 2010, 'B': 2011, 'C': 2012, 'D': 2013, 'E': 2014,
      'F': 2015, 'G': 2016, 'H': 2017, 'J': 2018, 'K': 2019,
      'L': 2020, 'M': 2021, 'N': 2022, 'P': 2023, 'R': 2024,
      'S': 2025, 'T': 2026, 'V': 2027, 'W': 2028, 'X': 2029,
    };
    const seventh = vin.charAt(6).toUpperCase();
    const base = map[code];
    if (base === undefined) return '';
    if (base >= 2010 || /[A-Z]/.test(seventh)) return base.toString();
    return (base - 30 >= 1980) ? (base - 30).toString() : base.toString();
  };

  const decodeVin = async () => {
    if (!newVehicle.vin || newVehicle.vin.length < 17) {
      alert('Enter a complete VIN (17 characters)');
      return;
    }
    setIsDecoding(true);
    try {
      const res = await fetch(`https://vpic.nhtsa.dot.gov/api/vehicles/decodevin/${newVehicle.vin}?format=json`);
      const data = await res.json();
      const vars = data.Results || [];
      const getVar = (name: string) => {
        const val = vars.find((v: any) => v.Variable === name)?.Value?.trim() || '';
        return (val && val !== '0' && val !== 'Not Applicable') ? val : '';
      };
      let year = getVar('Model Year');
      const make = getVar('Make');
      const model = getVar('Model');

      if (!year) {
        year = decodeYearFromVin(newVehicle.vin);
      }

      if (year || make || model) {
        setNewVehicle(prev => ({
          ...prev,
          year: year || prev.year,
          make: make || prev.make,
          model: model || prev.model,
        }));
        if (!make && !model && year) {
          alert(`Decoded year (${year}) from VIN. Make/model not found — please select manually.`);
        }
      } else {
        alert('Could not decode this VIN. Please enter year, make, and model manually.');
      }
    } catch (e) {
      const year = decodeYearFromVin(newVehicle.vin);
      if (year) {
        setNewVehicle(prev => ({ ...prev, year }));
        alert(`Decoded year (${year}) from VIN. Make/model not available offline — please select manually.`);
      } else {
        alert('VIN decode failed. Please enter details manually.');
      }
    }
    setIsDecoding(false);
  };

  const getStageColor = (status: string) => {
    const stage = stages.find(s => s.stage_name === status);
    return stage?.stage_color || '#ef4444';
  };

  const isStageAccessible = (stageRole: string): boolean => {
    if (!user) return false;
    if (user.roles.includes('Manager')) return true;
    return user.roles.includes(stageRole);
  };

  const isStageCompleted = (vehicleId: string, stageId: string): boolean => {
    const completion = completions.find(c => c.vehicle_id === vehicleId && c.stage_id === stageId);
    return !!completion?.completion_value && !completion.cleared_at;
  };

  const getCompletionValue = (vehicleId: string, stageId: string): string => {
    const completion = completions.find(c => c.vehicle_id === vehicleId && c.stage_id === stageId);
    return completion?.completion_value || '';
  };

  if (authLoading || loading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: '#94a3b8' }}>Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const readyCars = vehicles.filter(v => {
    const status = getCurrentStatus(v.id);
    return stages.find(s => s.stage_name === status)?.is_terminal;
  });
  const inProgressCars = vehicles.filter(v => {
    const status = getCurrentStatus(v.id);
    return !stages.find(s => s.stage_name === status)?.is_terminal;
  });

  const modelsForMake = newVehicle.make ? (MAKES_MODELS[newVehicle.make] || []) : [];

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0f172a', color: 'white', fontFamily: 'system-ui, sans-serif', paddingBottom: '80px' }}>
      
      <header style={{ backgroundColor: '#1e293b', padding: '16px', borderBottom: '1px solid #334155', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>🚗 Car Manager</h1>
          <div style={{ display: 'flex', gap: '8px' }}>
            {user.roles.includes('Manager') && (
              <button onClick={() => router.push('/admin')} style={{ backgroundColor: '#475569', border: 'none', borderRadius: '8px', padding: '6px 12px', color: 'white', fontSize: '13px', cursor: 'pointer' }}>⚙️ Admin</button>
            )}
            <button onClick={() => router.push('/dashboard')} style={{ backgroundColor: '#475569', border: 'none', borderRadius: '8px', padding: '6px 12px', color: 'white', fontSize: '13px', cursor: 'pointer' }}>📊 Dashboard</button>
            <button onClick={() => { logout(); router.push('/login'); }} style={{ backgroundColor: '#475569', border: 'none', borderRadius: '8px', padding: '6px 12px', color: 'white', fontSize: '13px', cursor: 'pointer' }}>🚪</button>
          </div>
        </div>
        
        <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '12px' }}>
          Logged in as: <span style={{ color: '#22c55e', fontWeight: 600 }}>{user.name}</span> ({user.roles.join(', ')})
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
          <div style={{ backgroundColor: '#334155', padding: '8px', borderRadius: '8px', textAlign: 'center' }}>
            <div style={{ fontSize: '18px', fontWeight: 'bold' }}>{vehicles.length}</div>
            <div style={{ fontSize: '9px', color: '#94a3b8' }}>TOTAL</div>
          </div>
          <div style={{ backgroundColor: '#22c55e20', padding: '8px', borderRadius: '8px', textAlign: 'center' }}>
            <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#22c55e' }}>{readyCars.length}</div>
            <div style={{ fontSize: '9px', color: '#94a3b8' }}>READY</div>
          </div>
          <div style={{ backgroundColor: '#eab30820', padding: '8px', borderRadius: '8px', textAlign: 'center' }}>
            <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#eab308' }}>{inProgressCars.length}</div>
            <div style={{ fontSize: '9px', color: '#94a3b8' }}>IN PROG</div>
          </div>
          <div style={{ backgroundColor: '#ef444420', padding: '8px', borderRadius: '8px', textAlign: 'center' }}>
            <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#ef4444' }}>{vehicles.filter(v => getAge(v.in_system_date) > 7).length}</div>
            <div style={{ fontSize: '9px', color: '#94a3b8' }}>AGING</div>
          </div>
        </div>
      </header>

      {readyCars.length > 0 && (
        <div style={{ padding: '12px' }}>
          <h2 style={{ fontSize: '14px', color: '#22c55e', marginBottom: '8px' }}>🚗 READY TO SELL ({readyCars.length})</h2>
          <div style={{ display: 'grid', gap: '6px' }}>
            {readyCars.map(v => {
              const status = getCurrentStatus(v.id);
              return (
                <div key={v.id} onClick={() => { setSelectedVehicle(v); setShowActions(true); }} style={{ backgroundColor: '#22c55e20', border: '1px solid #22c55e40', padding: '12px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
                  <div>
                    <div style={{ fontWeight: '600', fontSize: '15px' }}>{v.year} {v.make} {v.model}</div>
                    <div style={{ fontSize: '11px', color: '#94a3b8' }}>#{v.stock_num} • VIN: {v.vin || 'N/A'}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '12px', color: '#22c55e', fontWeight: '600' }}>{status}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div style={{ padding: '12px' }}>
        <h2 style={{ fontSize: '14px', color: '#f59e0b', marginBottom: '8px' }}>🔄 IN PROGRESS ({inProgressCars.length})</h2>
        <div style={{ display: 'grid', gap: '6px' }}>
          {inProgressCars.map(v => {
            const status = getCurrentStatus(v.id);
            const age = getAge(v.in_system_date);
            const stageColor = getStageColor(status);
            return (
              <div key={v.id} onClick={() => { setSelectedVehicle(v); setShowActions(true); }} style={{ backgroundColor: '#1e293b', borderLeft: `4px solid ${stageColor}`, padding: '12px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: '600', fontSize: '15px' }}>{v.year} {v.make} {v.model}</div>
                  <div style={{ fontSize: '11px', color: '#94a3b8' }}>#{v.stock_num} • VIN: {v.vin || 'N/A'}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '12px', color: stageColor, fontWeight: '600' }}>{status.split(' - ')[0]}</div>
                  <div style={{ fontSize: '10px', color: age > 7 ? '#ef4444' : '#94a3b8' }}>{age}d</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {vehicles.length === 0 && (
        <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🚗</div>
          <p>No vehicles yet. Click + to add one.</p>
        </div>
      )}

      <button onClick={() => setShowAddForm(true)} style={{ position: 'fixed', bottom: '24px', right: '24px', backgroundColor: '#2563eb', color: 'white', width: '60px', height: '60px', borderRadius: '30px', border: 'none', fontSize: '28px', boxShadow: '0 4px 20px rgba(37,99,235,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>+</button>

      {showAddForm && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: '#00000080', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ backgroundColor: '#1e293b', padding: '20px', borderRadius: '16px', width: '100%', maxWidth: '400px', maxHeight: '90vh', overflow: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0 }}>Add Vehicle</h2>
              <button onClick={() => setShowAddForm(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '24px', cursor: 'pointer' }}>✕</button>
            </div>
            
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>VIN (optional)</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input placeholder="Enter VIN" value={newVehicle.vin} onChange={e => setNewVehicle({...newVehicle, vin: e.target.value.toUpperCase()})} maxLength={17} style={{ flex: 1, backgroundColor: '#334155', border: 'none', borderRadius: '8px', padding: '12px', color: 'white', fontSize: '14px' }} />
                <button onClick={decodeVin} disabled={isDecoding} style={{ backgroundColor: '#7c3aed', color: 'white', padding: '12px 16px', borderRadius: '8px', border: 'none', fontWeight: '600', cursor: 'pointer' }}>{isDecoding ? '...' : 'Decode'}</button>
              </div>
            </div>

            <div style={{ display: 'grid', gap: '8px', marginBottom: '12px' }}>
              <select value={newVehicle.year} onChange={e => setNewVehicle({...newVehicle, year: e.target.value, make: '', model: ''})} style={{ backgroundColor: '#334155', border: 'none', borderRadius: '8px', padding: '12px', color: 'white', fontSize: '14px' }}>
                <option value="">Select Year</option>
                {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
              <select value={newVehicle.make} onChange={e => setNewVehicle({...newVehicle, make: e.target.value, model: ''})} disabled={!newVehicle.year} style={{ backgroundColor: '#334155', border: 'none', borderRadius: '8px', padding: '12px', color: 'white', fontSize: '14px', opacity: newVehicle.year ? 1 : 0.5 }}>
                <option value="">Select Make</option>
                {COMMON_MAKES.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
              <select value={newVehicle.model} onChange={e => setNewVehicle({...newVehicle, model: e.target.value})} disabled={!newVehicle.make} style={{ backgroundColor: '#334155', border: 'none', borderRadius: '8px', padding: '12px', color: 'white', fontSize: '14px', opacity: newVehicle.make ? 1 : 0.5 }}>
                <option value="">Select Model</option>
                {modelsForMake.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <input placeholder="Stock # (optional)" value={newVehicle.stock_num} onChange={e => setNewVehicle({...newVehicle, stock_num: e.target.value.toUpperCase()})} style={{ width: '100%', backgroundColor: '#334155', border: 'none', borderRadius: '8px', padding: '12px', color: 'white', fontSize: '14px' }} />
            </div>

            <button onClick={handleAddVehicle} style={{ width: '100%', backgroundColor: '#22c55e', color: 'white', fontWeight: '600', padding: '14px', borderRadius: '10px', border: 'none', fontSize: '16px', cursor: 'pointer' }}>Add Vehicle</button>
          </div>
        </div>
      )}

      {showActions && selectedVehicle && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: '#00000080', zIndex: 200, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div style={{ backgroundColor: '#1e293b', padding: '20px', borderRadius: '20px 20px 0 0', width: '100%', maxWidth: '500px', maxHeight: '90vh', overflow: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0 }}>{selectedVehicle.year} {selectedVehicle.make} {selectedVehicle.model}</h2>
                <p style={{ fontSize: '12px', color: '#94a3b8', margin: '4px 0 0' }}>#{selectedVehicle.stock_num} • VIN: {selectedVehicle.vin || 'No VIN'}</p>
              </div>
              <button onClick={() => setShowActions(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '24px', cursor: 'pointer' }}>✕</button>
            </div>

            <div style={{ backgroundColor: '#334155', padding: '12px', borderRadius: '10px', marginBottom: '16px' }}>
              <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '6px' }}>CURRENT STATUS</div>
              <div style={{ fontSize: '14px', fontWeight: '600', color: getStageColor(getCurrentStatus(selectedVehicle.id)) }}>{getCurrentStatus(selectedVehicle.id)}</div>
              <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>📅 In system: {getAge(selectedVehicle.in_system_date)} days</div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '8px' }}>PIPELINE</div>
              <div style={{ display: 'grid', gap: '8px' }}>
                {stages.sort((a, b) => a.order - b.order).map(stage => {
                  const isAccessible = isStageAccessible(stage.role);
                  const isCompleted = isStageCompleted(selectedVehicle.id, stage.id);
                  const currentValue = getCompletionValue(selectedVehicle.id, stage.id);
                  const dropdownValues = getDropdownValues(stage.list_name, stage.role);
                  const completion = completions.find(c => c.vehicle_id === selectedVehicle.id && c.stage_id === stage.id);

                  if (!isAccessible) return null;

                  return (
                    <div key={stage.id} style={{ backgroundColor: isCompleted ? '#22c55e20' : '#334155', padding: '12px', borderRadius: '8px', border: isCompleted ? '1px solid #22c55e40' : '1px solid transparent' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ fontSize: '13px', fontWeight: '600', color: stage.stage_color }}>{stage.stage_name}</span>
                        <span style={{ fontSize: '10px', color: '#64748b' }}>{stage.role}</span>
                      </div>
                      
                      {stage.completion_type === 'checkbox' ? (
                        <div>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                            <input type="checkbox" checked={isCompleted} onChange={e => updateStageCompletion(selectedVehicle.id, stage, e.target.checked ? user.name : '')} style={{ width: '20px', height: '20px', accentColor: '#22c55e' }} />
                            <span style={{ fontSize: '12px', color: isCompleted ? '#22c55e' : '#94a3b8' }}>{isCompleted ? 'Completed' : 'Mark complete'}</span>
                          </label>
                          {completion && completion.completed_at && (
                            <div style={{ fontSize: '10px', color: '#64748b', marginTop: '4px' }}>
                              ✓ {completion.completed_by} • {new Date(completion.completed_at).toLocaleDateString()} {new Date(completion.completed_at).toLocaleTimeString()}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div>
                          <select value={currentValue} onChange={e => updateStageCompletion(selectedVehicle.id, stage, e.target.value)} style={{ width: '100%', backgroundColor: '#1e293b', border: 'none', borderRadius: '6px', padding: '8px', color: 'white', fontSize: '13px' }}>
                            <option value="">Select...</option>
                            {dropdownValues.map(v => <option key={v} value={v}>{v}</option>)}
                          </select>
                          {completion && completion.completed_at && currentValue && (
                            <div style={{ fontSize: '10px', color: '#64748b', marginTop: '4px' }}>
                              ✓ {completion.completed_by} • {new Date(completion.completed_at).toLocaleDateString()} {new Date(completion.completed_at).toLocaleTimeString()}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {user.roles.includes('Manager') && (
              <button onClick={() => deleteVehicle(selectedVehicle.id)} style={{ width: '100%', backgroundColor: '#ef444420', color: '#ef4444', padding: '12px', borderRadius: '8px', border: '1px solid #ef4444', fontSize: '14px', cursor: 'pointer' }}>🗑️ Remove Vehicle</button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
