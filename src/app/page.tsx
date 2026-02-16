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
}

const LOCATIONS = ['Front Lot', 'Rear Lot', 'Side Lot', 'Service Bay', 'Detail Shop', 'Auction Hold', 'Sold (Pending Pickup)', 'In Transit'];

const STAGES = ['Pending Inventory', 'Awaiting Detail', 'Awaiting Photos', 'Awaiting Service', 'Pending Estimate', 'Pending Approval', 'Approved - Pending Repair', 'Ready for Sale'];

const initialVehicles: Vehicle[] = [
  { id: '1', stockNum: 'R1770526', year: '2021', make: 'Chevrolet', model: 'Equinox', vin: '', status: 'Approved - Pending Repair', location: 'Service Bay', age: 5 },
  { id: '2', stockNum: 'R1770526', year: '2023', make: 'Buick', model: 'Enclave', vin: '', status: 'Pending Inventory', location: 'Front Lot', age: 7 },
  { id: '3', stockNum: 'R1770526', year: '2020', make: 'Cadillac', model: 'Escalade ESV', vin: '', status: 'Ready for Sale', location: 'Front Lot', age: 7 },
  { id: '4', stockNum: 'R1770526', year: '2018', make: 'Chevrolet', model: 'Express 2500', vin: '', status: 'Awaiting Photos', location: 'Detail Shop', age: 0 },
  { id: '5', stockNum: 'R1770581', year: '2020', make: 'Chevrolet', model: 'Silverado 1500', vin: '', status: 'Awaiting Detail', location: 'Rear Lot', age: 0 },
];

export default function Home() {
  const [vehicles, setVehicles] = useState<Vehicle[]>(initialVehicles);
  const [activeTab, setActiveTab] = useState('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [isDecoding, setIsDecoding] = useState(false);
  const [newVehicle, setNewVehicle] = useState({ stockNum: '', year: '', make: '', model: '', vin: '', location: 'Front Lot' });

  const filteredVehicles = activeTab === 'all' ? vehicles : vehicles.filter(v => v.status === activeTab);

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
      const getVar = (id: string) => vars.find((v: any) => v.VariableID === parseInt(id))?.Value || '';
      
      const year = getVar('29') || getVar('85') || '';
      const make = getVar('26') || getVar('88') || '';
      const model = getVar('28') || getVar('87') || '';
      
      if (year || make || model) {
        setNewVehicle({ ...newVehicle, year, make, model });
      } else {
        alert('Could not decode VIN. Please enter details manually.');
      }
    } catch (e) {
      alert('Error decoding VIN. Please enter details manually.');
    }
    setIsDecoding(false);
  };

  const handleAddVehicle = () => {
    const vehicle: Vehicle = {
      id: Date.now().toString(),
      stockNum: newVehicle.stockNum || `R${Date.now().toString().slice(-6)}`,
      year: newVehicle.year,
      make: newVehicle.make,
      model: newVehicle.model,
      vin: newVehicle.vin,
      status: 'Pending Inventory',
      location: newVehicle.location,
      age: 0
    };
    setVehicles([vehicle, ...vehicles]);
    setShowAddForm(false);
    setNewVehicle({ stockNum: '', year: '', make: '', model: '', vin: '', location: 'Front Lot' });
  };

  const getStatusColor = (status: string) => {
    if (status === 'Ready for Sale') return '#22c55e';
    if (status.includes('Pending') || status.includes('Awaiting')) return '#ef4444';
    return '#eab308';
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#111827', color: 'white', fontFamily: 'system-ui, sans-serif', paddingBottom: '40px' }}>
      {/* Header */}
      <header style={{ backgroundColor: '#1f2937', padding: '16px', borderBottom: '1px solid #374151', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 style={{ fontSize: '22px', fontWeight: 'bold', margin: 0 }}>🚗 Car Manager</h1>
          <span style={{ color: '#9ca3af', fontSize: '14px' }}>{vehicles.length} cars</span>
        </div>
      </header>

      {/* Quick Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', padding: '12px' }}>
        <div style={{ backgroundColor: '#1f2937', padding: '10px', borderRadius: '8px', textAlign: 'center' }}>
          <div style={{ fontSize: '20px', fontWeight: 'bold' }}>{vehicles.length}</div>
          <div style={{ fontSize: '10px', color: '#9ca3af' }}>TOTAL</div>
        </div>
        <div style={{ backgroundColor: '#1f2937', padding: '10px', borderRadius: '8px', textAlign: 'center' }}>
          <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#22c55e' }}>{vehicles.filter(v => v.status === 'Ready for Sale').length}</div>
          <div style={{ fontSize: '10px', color: '#9ca3af' }}>READY</div>
        </div>
        <div style={{ backgroundColor: '#1f2937', padding: '10px', borderRadius: '8px', textAlign: 'center' }}>
          <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#ef4444' }}>{vehicles.filter(v => v.age > 7).length}</div>
          <div style={{ fontSize: '10px', color: '#9ca3af' }}>OVER 7 DAYS</div>
        </div>
      </div>

      {/* Stage Filters */}
      <div style={{ padding: '0 12px', overflowX: 'auto' }}>
        <div style={{ display: 'flex', gap: '6px', paddingBottom: '8px' }}>
          <button onClick={() => setActiveTab('all')} style={{ padding: '8px 14px', borderRadius: '20px', border: 'none', backgroundColor: activeTab === 'all' ? '#3b82f6' : '#374151', color: 'white', fontSize: '12px', whiteSpace: 'nowrap', fontWeight: activeTab === 'all' ? 'bold' : 'normal' }}>
            All ({vehicles.length})
          </button>
          {STAGES.filter(s => vehicles.some(v => v.status === s)).map(stage => (
            <button key={stage} onClick={() => setActiveTab(stage === activeTab ? 'all' : stage)} style={{ padding: '8px 14px', borderRadius: '20px', border: 'none', backgroundColor: activeTab === stage ? '#3b82f6' : '#374151', color: 'white', fontSize: '12px', whiteSpace: 'nowrap' }}>
              {vehicles.filter(v => v.status === stage).length} {stage.substring(0, 8)}
            </button>
          ))}
        </div>
      </div>

      {/* Add Button */}
      <div style={{ padding: '12px' }}>
        <button onClick={() => setShowAddForm(!showAddForm)} style={{ width: '100%', backgroundColor: showAddForm ? '#374151' : '#2563eb', color: 'white', fontWeight: '600', padding: '14px', borderRadius: '12px', border: 'none', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          {showAddForm ? '✕ Cancel' : '+ Quick Add Vehicle'}
        </button>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <div style={{ margin: '0 12px 12px', backgroundColor: '#1f2937', padding: '16px', borderRadius: '12px' }}>
          
          {/* VIN Decode */}
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', fontSize: '12px', color: '#9ca3af', marginBottom: '4px' }}>VIN (optional - we'll look up the rest)</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input 
                placeholder="Enter VIN" 
                value={newVehicle.vin}
                onChange={e => setNewVehicle({...newVehicle, vin: e.target.value.toUpperCase()})}
                maxLength={17}
                style={{ flex: 1, backgroundColor: '#374151', border: '1px solid #4b5563', borderRadius: '8px', padding: '10px 12px', color: 'white', fontSize: '14px' }}
              />
              <button 
                onClick={decodeVin}
                disabled={isDecoding}
                style={{ backgroundColor: '#7c3aed', color: 'white', padding: '10px 16px', borderRadius: '8px', border: 'none', fontWeight: '600', fontSize: '13px', opacity: isDecoding ? 0.7 : 1 }}
              >
                {isDecoding ? '...' : 'Decode'}
              </button>
            </div>
          </div>

          {/* Stock # */}
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', fontSize: '12px', color: '#9ca3af', marginBottom: '4px' }}>Stock #</label>
            <input 
              placeholder="Auto-generated if empty"
              value={newVehicle.stockNum}
              onChange={e => setNewVehicle({...newVehicle, stockNum: e.target.value.toUpperCase()})}
              style={{ width: '100%', backgroundColor: '#374151', border: '1px solid #4b5563', borderRadius: '8px', padding: '10px 12px', color: 'white', fontSize: '14px' }}
            />
          </div>

          {/* Year/Make/Model Row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 2fr', gap: '8px', marginBottom: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: '#9ca3af', marginBottom: '4px' }}>Year</label>
              <input 
                placeholder="2024"
                value={newVehicle.year}
                onChange={e => setNewVehicle({...newVehicle, year: e.target.value})}
                style={{ width: '100%', backgroundColor: '#374151', border: '1px solid #4b5563', borderRadius: '8px', padding: '10px 12px', color: 'white', fontSize: '14px' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: '#9ca3af', marginBottom: '4px' }}>Make</label>
              <input 
                placeholder="Toyota"
                value={newVehicle.make}
                onChange={e => setNewVehicle({...newVehicle, make: e.target.value})}
                style={{ width: '100%', backgroundColor: '#374151', border: '1px solid #4b5563', borderRadius: '8px', padding: '10px 12px', color: 'white', fontSize: '14px' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: '#9ca3af', marginBottom: '4px' }}>Model</label>
              <input 
                placeholder="Camry"
                value={newVehicle.model}
                onChange={e => setNewVehicle({...newVehicle, model: e.target.value})}
                style={{ width: '100%', backgroundColor: '#374151', border: '1px solid #4b5563', borderRadius: '8px', padding: '10px 12px', color: 'white', fontSize: '14px' }}
              />
            </div>
          </div>

          {/* Location */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '12px', color: '#9ca3af', marginBottom: '4px' }}>Location</label>
            <select 
              value={newVehicle.location}
              onChange={e => setNewVehicle({...newVehicle, location: e.target.value})}
              style={{ width: '100%', backgroundColor: '#374151', border: '1px solid #4b5563', borderRadius: '8px', padding: '10px 12px', color: 'white', fontSize: '14px' }}
            >
              {LOCATIONS.map(loc => <option key={loc} value={loc}>{loc}</option>)}
            </select>
          </div>

          {/* Submit */}
          <button 
            onClick={handleAddVehicle}
            style={{ width: '100%', backgroundColor: '#16a34a', color: 'white', fontWeight: '600', padding: '14px', borderRadius: '8px', border: 'none', fontSize: '15px' }}
          >
            Add to Inventory
          </button>
        </div>
      )}

      {/* Vehicle List */}
      <div style={{ padding: '0 12px' }}>
        {filteredVehicles.map(vehicle => (
          <div key={vehicle.id} style={{ backgroundColor: '#1f2937', padding: '14px', borderRadius: '12px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '4px', height: '50px', borderRadius: '2px', backgroundColor: getStatusColor(vehicle.status) }}></div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: '600', fontSize: '15px' }}>{vehicle.year} {vehicle.make} {vehicle.model}</div>
              <div style={{ fontSize: '12px', color: '#9ca3af' }}>#{vehicle.stockNum} • {vehicle.status}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '11px', color: '#9ca3af' }}>{vehicle.location}</div>
              <div style={{ fontSize: '18px', fontWeight: 'bold', color: vehicle.age > 7 ? '#ef4444' : vehicle.age > 3 ? '#eab308' : 'white' }}>{vehicle.age}d</div>
            </div>
          </div>
        ))}
        {filteredVehicles.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>No vehicles in this stage</div>
        )}
      </div>
    </div>
  );
}
