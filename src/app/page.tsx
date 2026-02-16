'use client';

import { useState } from 'react';

interface Vehicle {
  id: string;
  stockNum: string;
  year: string;
  make: string;
  model: string;
  vin: string;
  status: string;
  location: string;
  age: number;
  assignee?: string;
  notes?: string;
  updatedAt?: string;
}

const LOCATIONS = ['Front Lot', 'Rear Lot', 'Side Lot', 'Service Bay', 'Detail Shop', 'Auction Hold', 'Sold (Pending Pickup)', 'In Transit'];

const STAGES = [
  '1. Received - Inspection',
  '2. Recon Assignment', 
  '3. Service - Mechanical',
  '4. Detail - Interior/Exterior',
  '5. Final Quality Check',
  '6. Photos & Marketing',
  '7. Lot Ready - Front Line',
  '8. Sold - Delivered'
];

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

// Role-based stage access
const ROLE_STAGES: Record<string, string[]> = {
  'Manager': STAGES,
  'Service': STAGES.slice(2, 4), // Service stages
  'Detail': STAGES.slice(3, 6),  // Detail stages  
  'Sales': STAGES.slice(6, 8),   // Lot ready + Sold
};

const initialVehicles: Vehicle[] = [
  { id: '1', stockNum: 'R1770526', year: '2021', make: 'Chevrolet', model: 'Equinox', vin: '', status: '3. Service - Mechanical', location: 'Service Bay', age: 5 },
  { id: '2', stockNum: 'R1770527', year: '2023', make: 'Buick', model: 'Enclave', vin: '', status: '1. Received - Inspection', location: 'Front Lot', age: 1 },
  { id: '3', stockNum: 'R1770528', year: '2020', make: 'Cadillac', model: 'Escalade ESV', vin: '', status: '7. Lot Ready - Front Line', location: 'Front Lot', age: 3 },
  { id: '4', stockNum: 'R1770529', year: '2018', make: 'Chevrolet', model: 'Express 2500', vin: '', status: '4. Detail - Interior/Exterior', location: 'Detail Shop', age: 2 },
  { id: '5', stockNum: 'R1770530', year: '2020', make: 'Chevrolet', model: 'Silverado 1500', vin: '', status: '5. Final Quality Check', location: 'Rear Lot', age: 1 },
  { id: '6', stockNum: 'R1770531', year: '2022', make: 'Ford', model: 'F-150', vin: '', status: '8. Sold - Delivered', location: 'Sold (Pending Pickup)', age: 0 },
  { id: '7', stockNum: 'R1770532', year: '2019', make: 'Toyota', model: 'Camry', vin: '', status: '6. Photos & Marketing', location: 'Front Lot', age: 4 },
  { id: '8', stockNum: 'R1770533', year: '2021', make: 'Honda', model: 'Civic', vin: '', status: '2. Recon Assignment', location: 'Rear Lot', age: 1 },
];

export default function Home() {
  const [vehicles, setVehicles] = useState<Vehicle[]>(initialVehicles);
  const [userRole, setUserRole] = useState('Manager');
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [isDecoding, setIsDecoding] = useState(false);
  const [newVehicle, setNewVehicle] = useState({ year: '', make: '', model: '', vin: '', stockNum: '', location: 'Front Lot' });
  
  const roleStages = ROLE_STAGES[userRole] || STAGES;
  
  const getStageColor = (status: string) => {
    const idx = STAGES.indexOf(status);
    if (idx >= 6) return '#22c55e'; // Ready/Sold - green
    if (idx >= 4) return '#3b82f6'; // Quality/Photos - blue
    if (idx >= 2) return '#eab308'; // Service - yellow
    return '#ef4444'; // New - red
  };

  const getStageIcon = (status: string) => {
    const idx = STAGES.indexOf(status);
    if (idx === 0) return '📥';
    if (idx === 1) return '📋';
    if (idx === 2) return '🔧';
    if (idx === 3) return '✨';
    if (idx === 4) return '✅';
    if (idx === 5) return '📸';
    if (idx === 6) return '🚗';
    if (idx === 7) return '💰';
    return '📌';
  };

  // Decode model year from VIN 10th character (pos index 9)
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
    // VIN 7th char determines 30-year cycle: if it's a letter, add 30
    const seventh = vin.charAt(6).toUpperCase();
    const base = map[code];
    if (base === undefined) return '';
    // For 1980-2009 era vehicles, 7th char is typically a digit
    // For 2010+ vehicles, 7th char can be a letter (alpha)
    if (base >= 2010 || /[A-Z]/.test(seventh)) return base.toString();
    // If 7th is digit and base < 2010, it could be 1980-2009 range
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
      // NHTSA returns "0" or empty string for unknown values — filter those out
      const getVar = (name: string) => {
        const val = vars.find((v: any) => v.Variable === name)?.Value?.trim() || '';
        return (val && val !== '0' && val !== 'Not Applicable') ? val : '';
      };
      let year = getVar('Model Year');
      const make = getVar('Make');
      const model = getVar('Model');

      // Fallback: decode year from VIN 10th character if NHTSA didn't return it
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
      // Fallback to VIN character decode
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

  const handleAddVehicle = () => {
    if (!newVehicle.year || !newVehicle.make || !newVehicle.model) {
      alert('Please select year, make, and model');
      return;
    }
    const vehicle: Vehicle = {
      id: Date.now().toString(),
      stockNum: newVehicle.stockNum || `R${Date.now().toString().slice(-6)}`,
      year: newVehicle.year,
      make: newVehicle.make,
      model: newVehicle.model,
      vin: newVehicle.vin,
      status: '1. Received - Inspection',
      location: newVehicle.location,
      age: 0,
      updatedAt: new Date().toLocaleString()
    };
    setVehicles([vehicle, ...vehicles]);
    setShowAddForm(false);
    setNewVehicle({ year: '', make: '', model: '', vin: '', stockNum: '', location: 'Front Lot' });
  };

  const updateVehicleStatus = (vehicleId: string, newStatus: string) => {
    setVehicles(vehicles.map(v => 
      v.id === vehicleId 
        ? { ...v, status: newStatus, updatedAt: new Date().toLocaleString() }
        : v
    ));
    setShowActions(false);
  };

  const updateVehicleLocation = (vehicleId: string, newLocation: string) => {
    setVehicles(vehicles.map(v => 
      v.id === vehicleId 
        ? { ...v, location: newLocation, updatedAt: new Date().toLocaleString() }
        : v
    ));
    setShowActions(false);
  };

  const deleteVehicle = (vehicleId: string) => {
    if (confirm('Remove this vehicle from inventory?')) {
      setVehicles(vehicles.filter(v => v.id !== vehicleId));
      setShowActions(false);
      setSelectedVehicle(null);
    }
  };

  const modelsForMake = newVehicle.make ? (MAKES_MODELS[newVehicle.make] || []) : [];
  const readyCars = vehicles.filter(v => v.status.includes('Lot Ready') || v.status.includes('Sold'));
  const inProgressCars = vehicles.filter(v => !v.status.includes('Lot Ready') && !v.status.includes('Sold'));

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0f172a', color: 'white', fontFamily: 'system-ui, sans-serif', paddingBottom: '80px' }}>
      
      {/* Header */}
      <header style={{ backgroundColor: '#1e293b', padding: '16px', borderBottom: '1px solid #334155', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>🚗 Car Manager</h1>
          <select 
            value={userRole}
            onChange={e => setUserRole(e.target.value)}
            style={{ backgroundColor: '#475569', border: 'none', borderRadius: '8px', padding: '6px 12px', color: 'white', fontSize: '13px' }}
          >
            <option value="Manager">👑 Manager</option>
            <option value="Service">🔧 Service</option>
            <option value="Detail">✨ Detail</option>
            <option value="Sales">💰 Sales</option>
          </select>
        </div>
        
        {/* Quick Stats */}
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
            <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#ef4444' }}>{vehicles.filter(v => v.age > 7).length}</div>
            <div style={{ fontSize: '9px', color: '#94a3b8' }}>AGING</div>
          </div>
        </div>
      </header>

      {/* Ready for Sale Section */}
      {readyCars.length > 0 && (
        <div style={{ padding: '12px' }}>
          <h2 style={{ fontSize: '14px', color: '#22c55e', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            🚗 READY TO SELL ({readyCars.length})
          </h2>
          <div style={{ display: 'grid', gap: '6px' }}>
            {readyCars.map(v => (
              <div 
                key={v.id}
                onClick={() => { setSelectedVehicle(v); setShowActions(true); }}
                style={{ backgroundColor: '#22c55e20', border: '1px solid #22c55e40', padding: '12px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
              >
                <div>
                  <div style={{ fontWeight: '600', fontSize: '15px' }}>{v.year} {v.make} {v.model}</div>
                  <div style={{ fontSize: '11px', color: '#94a3b8' }}>#{v.stockNum} • {v.location}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '12px', color: '#22c55e', fontWeight: '600' }}>{v.status}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* In Progress Section */}
      <div style={{ padding: '12px' }}>
        <h2 style={{ fontSize: '14px', color: '#f59e0b', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          🔄 IN PROGRESS ({inProgressCars.length})
        </h2>
        <div style={{ display: 'grid', gap: '6px' }}>
          {inProgressCars.map(v => (
            <div 
              key={v.id}
              onClick={() => { setSelectedVehicle(v); setShowActions(true); }}
              style={{ backgroundColor: '#1e293b', borderLeft: `4px solid ${getStageColor(v.status)}`, padding: '12px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: '600', fontSize: '15px' }}>{v.year} {v.make} {v.model}</div>
                <div style={{ fontSize: '11px', color: '#94a3b8' }}>#{v.stockNum} • {v.location}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '12px', color: getStageColor(v.status), fontWeight: '600' }}>{getStageIcon(v.status)} {v.status.split(' - ')[0]}</div>
                <div style={{ fontSize: '10px', color: v.age > 7 ? '#ef4444' : '#94a3b8' }}>{v.age}d</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Floating Action Button */}
      <button 
        onClick={() => setShowAddForm(true)}
        style={{ 
          position: 'fixed', bottom: '24px', right: '24px', 
          backgroundColor: '#2563eb', color: 'white', 
          width: '60px', height: '60px', borderRadius: '30px', 
          border: 'none', fontSize: '28px', boxShadow: '0 4px 20px rgba(37,99,235,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}
      >
        +
      </button>

      {/* Add Vehicle Modal */}
      {showAddForm && (
        <div style={{ 
          position: 'fixed', inset: 0, backgroundColor: '#00000080', zIndex: 200,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px'
        }}>
          <div style={{ backgroundColor: '#1e293b', padding: '20px', borderRadius: '16px', width: '100%', maxWidth: '400px', maxHeight: '90vh', overflow: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0 }}>Add Vehicle</h2>
              <button onClick={() => setShowAddForm(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '24px' }}>✕</button>
            </div>
            
            {/* VIN */}
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>VIN (optional)</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input 
                  placeholder="Enter VIN"
                  value={newVehicle.vin}
                  onChange={e => setNewVehicle({...newVehicle, vin: e.target.value.toUpperCase()})}
                  maxLength={17}
                  style={{ flex: 1, backgroundColor: '#334155', border: 'none', borderRadius: '8px', padding: '12px', color: 'white', fontSize: '14px' }}
                />
                <button 
                  onClick={decodeVin}
                  disabled={isDecoding}
                  style={{ backgroundColor: '#7c3aed', color: 'white', padding: '12px 16px', borderRadius: '8px', border: 'none', fontWeight: '600' }}
                >
                  {isDecoding ? '...' : 'Decode'}
                </button>
              </div>
            </div>

            {/* Year/Make/Model */}
            <div style={{ display: 'grid', gap: '8px', marginBottom: '12px' }}>
              <select 
                value={newVehicle.year}
                onChange={e => setNewVehicle({...newVehicle, year: e.target.value, make: '', model: ''})}
                style={{ backgroundColor: '#334155', border: 'none', borderRadius: '8px', padding: '12px', color: 'white', fontSize: '14px' }}
              >
                <option value="">Select Year</option>
                {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
              <select 
                value={newVehicle.make}
                onChange={e => setNewVehicle({...newVehicle, make: e.target.value, model: ''})}
                disabled={!newVehicle.year}
                style={{ backgroundColor: '#334155', border: 'none', borderRadius: '8px', padding: '12px', color: 'white', fontSize: '14px', opacity: newVehicle.year ? 1 : 0.5 }}
              >
                <option value="">Select Make</option>
                {COMMON_MAKES.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
              <select 
                value={newVehicle.model}
                onChange={e => setNewVehicle({...newVehicle, model: e.target.value})}
                disabled={!newVehicle.make}
                style={{ backgroundColor: '#334155', border: 'none', borderRadius: '8px', padding: '12px', color: 'white', fontSize: '14px', opacity: newVehicle.make ? 1 : 0.5 }}
              >
                <option value="">Select Model</option>
                {modelsForMake.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>

            {/* Stock & Location */}
            <div style={{ display: 'grid', gap: '8px', marginBottom: '16px' }}>
              <input 
                placeholder="Stock # (optional)"
                value={newVehicle.stockNum}
                onChange={e => setNewVehicle({...newVehicle, stockNum: e.target.value.toUpperCase()})}
                style={{ backgroundColor: '#334155', border: 'none', borderRadius: '8px', padding: '12px', color: 'white', fontSize: '14px' }}
              />
              <select 
                value={newVehicle.location}
                onChange={e => setNewVehicle({...newVehicle, location: e.target.value})}
                style={{ backgroundColor: '#334155', border: 'none', borderRadius: '8px', padding: '12px', color: 'white', fontSize: '14px' }}
              >
                {LOCATIONS.map(loc => <option key={loc} value={loc}>{loc}</option>)}
              </select>
            </div>

            <button 
              onClick={handleAddVehicle}
              style={{ width: '100%', backgroundColor: '#22c55e', color: 'white', fontWeight: '600', padding: '14px', borderRadius: '10px', border: 'none', fontSize: '16px' }}
            >
              Add Vehicle
            </button>
          </div>
        </div>
      )}

      {/* Quick Actions Modal */}
      {showActions && selectedVehicle && (
        <div style={{ 
          position: 'fixed', inset: 0, backgroundColor: '#00000080', zIndex: 200,
          display: 'flex', alignItems: 'flex-end', justifyContent: 'center'
        }}>
          <div style={{ backgroundColor: '#1e293b', padding: '20px', borderRadius: '20px 20px 0 0', width: '100%', maxWidth: '500px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0 }}>{selectedVehicle.year} {selectedVehicle.make} {selectedVehicle.model}</h2>
                <p style={{ fontSize: '12px', color: '#94a3b8', margin: '4px 0 0' }}>#{selectedVehicle.stockNum} • {selectedVehicle.vin || 'No VIN'}</p>
              </div>
              <button onClick={() => setShowActions(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '24px' }}>✕</button>
            </div>

            {/* Current Status */}
            <div style={{ backgroundColor: '#334155', padding: '12px', borderRadius: '10px', marginBottom: '16px' }}>
              <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '6px' }}>CURRENT STATUS</div>
              <div style={{ fontSize: '14px', fontWeight: '600', color: getStageColor(selectedVehicle.status) }}>
                {getStageIcon(selectedVehicle.status)} {selectedVehicle.status}
              </div>
              <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>📍 {selectedVehicle.location} • {selectedVehicle.age} days</div>
            </div>

            {/* Move to Next Stage */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '8px' }}>MOVE TO STAGE</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px' }}>
                {roleStages.map(stage => (
                  <button
                    key={stage}
                    onClick={() => updateVehicleStatus(selectedVehicle.id, stage)}
                    disabled={stage === selectedVehicle.status}
                    style={{ 
                      backgroundColor: stage === selectedVehicle.status ? '#22c55e' : '#334155',
                      color: 'white', padding: '12px', borderRadius: '8px', border: 'none', 
                      fontSize: '12px', fontWeight: '600', opacity: stage === selectedVehicle.status ? 1 : 0.8,
                      textAlign: 'left'
                    }}
                  >
                    {getStageIcon(stage)} {stage.split(' - ')[0]}
                  </button>
                ))}
              </div>
            </div>

            {/* Move Location */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '8px' }}>MOVE LOCATION</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {LOCATIONS.map(loc => (
                  <button
                    key={loc}
                    onClick={() => updateVehicleLocation(selectedVehicle.id, loc)}
                    style={{ 
                      backgroundColor: loc === selectedVehicle.location ? '#3b82f6' : '#334155',
                      color: 'white', padding: '8px 12px', borderRadius: '6px', border: 'none', 
                      fontSize: '11px'
                    }}
                  >
                    {loc}
                  </button>
                ))}
              </div>
            </div>

            {/* Delete (Manager only) */}
            {userRole === 'Manager' && (
              <button 
                onClick={() => deleteVehicle(selectedVehicle.id)}
                style={{ width: '100%', backgroundColor: '#ef444420', color: '#ef4444', padding: '12px', borderRadius: '8px', border: '1px solid #ef4444', fontSize: '14px' }}
              >
                🗑️ Remove Vehicle
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
