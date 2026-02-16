'use client';

import { useState } from 'react';

interface Vehicle {
  id: string;
  stockNum: string;
  year: string;
  make: string;
  model: string;
  status: string;
  location: string;
  age: number;
}

const LOCATIONS = ['Front Lot', 'Rear Lot', 'Side Lot', 'Service Bay', 'Detail Shop', 'Auction Hold', 'Sold (Pending Pickup)', 'In Transit'];

const STAGES = ['Pending Inventory', 'Awaiting Detail', 'Awaiting Photos', 'Awaiting Service', 'Pending Estimate', 'Pending Approval', 'Approved - Pending Repair', 'Ready for Sale'];

const initialVehicles: Vehicle[] = [
  { id: '1', stockNum: 'R1770526', year: '2021', make: 'Chevrolet', model: 'Equinox', status: 'Approved - Pending Repair', location: 'Service Bay', age: 5 },
  { id: '2', stockNum: 'R1770526', year: '2023', make: 'Buick', model: 'Enclave', status: 'Pending Inventory', location: 'Front Lot', age: 7 },
  { id: '3', stockNum: 'R1770526', year: '2020', make: 'Cadillac', model: 'Escalade ESV', status: 'Ready for Sale', location: 'Front Lot', age: 7 },
  { id: '4', stockNum: 'R1770526', year: '2018', make: 'Chevrolet', model: 'Express 2500', status: 'Awaiting Photos', location: 'Detail Shop', age: 0 },
  { id: '5', stockNum: 'R1770581', year: '2020', make: 'Chevrolet', model: 'Silverado 1500', status: 'Awaiting Detail', location: 'Rear Lot', age: 0 },
  { id: '6', stockNum: 'R1770590', year: '2018', make: 'Cadillac', model: 'Escalade ESV', status: 'Awaiting Detail', location: 'Side Lot', age: 0 },
  { id: '7', stockNum: 'R1770604', year: '2018', make: 'Bentley', model: 'Continental', status: 'Ready for Sale', location: 'Front Lot', age: 0 },
];

export default function Home() {
  const [vehicles, setVehicles] = useState<Vehicle[]>(initialVehicles);
  const [activeTab, setActiveTab] = useState('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newVehicle, setNewVehicle] = useState({ stockNum: '', year: '', make: '', model: '', location: 'Front Lot' });

  const filteredVehicles = activeTab === 'all' ? vehicles : vehicles.filter(v => v.status === activeTab);

  const getStatusColor = (status: string) => {
    if (status === 'Ready for Sale') return '#22c55e';
    if (status.includes('Pending') || status.includes('Awaiting')) return '#ef4444';
    return '#eab308';
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#111827', color: 'white', fontFamily: 'system-ui, sans-serif' }}>
      {/* Header */}
      <header style={{ backgroundColor: '#1f2937', padding: '12px 16px', borderBottom: '1px solid #374151' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 style={{ fontSize: '20px', fontWeight: 'bold', margin: 0 }}>🚗 Car Manager</h1>
          <span style={{ color: '#9ca3af', fontSize: '14px' }}>{vehicles.length} vehicles</span>
        </div>
      </header>

      {/* Pipeline */}
      <div style={{ backgroundColor: '#1f2937', padding: '12px 16px', borderBottom: '1px solid #374151', overflowX: 'auto' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => setActiveTab('all')} style={{ padding: '6px 12px', borderRadius: '8px', border: activeTab === 'all' ? '2px solid #3b82f6' : '1px solid #4b5563', backgroundColor: activeTab === 'all' ? '#3b82f6' : '#374151', fontSize: '12px', whiteSpace: 'nowrap' }}>All ({vehicles.length})</button>
          {STAGES.filter(s => vehicles.some(v => v.status === s)).map(stage => (
            <button key={stage} onClick={() => setActiveTab(stage === activeTab ? 'all' : stage)} style={{ padding: '6px 12px', borderRadius: '8px', border: activeTab === stage ? '2px solid #3b82f6' : '1px solid #4b5563', backgroundColor: activeTab === stage ? '#3b82f6' : '#374151', fontSize: '12px', whiteSpace: 'nowrap' }}>
              {vehicles.filter(v => v.status === stage).length} {stage.substring(0, 12)}
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', padding: '16px' }}>
        <div style={{ backgroundColor: '#1f2937', padding: '12px', borderRadius: '8px', textAlign: 'center' }}>
          <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{vehicles.length}</div>
          <div style={{ fontSize: '12px', color: '#9ca3af' }}>Total</div>
        </div>
        <div style={{ backgroundColor: '#1f2937', padding: '12px', borderRadius: '8px', textAlign: 'center' }}>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#22c55e' }}>{vehicles.filter(v => v.status === 'Ready for Sale').length}</div>
          <div style={{ fontSize: '12px', color: '#9ca3af' }}>Ready</div>
        </div>
        <div style={{ backgroundColor: '#1f2937', padding: '12px', borderRadius: '8px', textAlign: 'center' }}>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ef4444' }}>{vehicles.filter(v => v.age > 7).length}</div>
          <div style={{ fontSize: '12px', color: '#9ca3af' }}>Over 7 days</div>
        </div>
      </div>

      {/* Add Button */}
      <div style={{ padding: '0 16px' }}>
        <button onClick={() => setShowAddForm(!showAddForm)} style={{ width: '100%', backgroundColor: '#2563eb', color: 'white', fontWeight: '600', padding: '12px', borderRadius: '8px', border: 'none', fontSize: '16px' }}>
          {showAddForm ? '✕ Cancel' : '+ Add Vehicle'}
        </button>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <div style={{ margin: '16px', backgroundColor: '#1f2937', padding: '16px', borderRadius: '8px' }}>
          <h3 style={{ fontWeight: '600', marginBottom: '12px' }}>New Vehicle</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <input placeholder="Stock #" value={newVehicle.stockNum} onChange={e => setNewVehicle({...newVehicle, stockNum: e.target.value})} style={{ backgroundColor: '#374151', border: '1px solid #4b5563', borderRadius: '6px', padding: '8px 12px', color: 'white', fontSize: '14px' }} />
            <select value={newVehicle.location} onChange={e => setNewVehicle({...newVehicle, location: e.target.value})} style={{ backgroundColor: '#374151', border: '1px solid #4b5563', borderRadius: '6px', padding: '8px 12px', color: 'white', fontSize: '14px' }}>
              {LOCATIONS.map(loc => <option key={loc} value={loc}>{loc}</option>)}
            </select>
            <input placeholder="Year" value={newVehicle.year} onChange={e => setNewVehicle({...newVehicle, year: e.target.value})} style={{ backgroundColor: '#374151', border: '1px solid #4b5563', borderRadius: '6px', padding: '8px 12px', color: 'white', fontSize: '14px' }} />
            <input placeholder="Make" value={newVehicle.make} onChange={e => setNewVehicle({...newVehicle, make: e.target.value})} style={{ backgroundColor: '#374151', border: '1px solid #4b5563', borderRadius: '6px', padding: '8px 12px', color: 'white', fontSize: '14px' }} />
            <input placeholder="Model" value={newVehicle.model} onChange={e => setNewVehicle({...newVehicle, model: e.target.value})} style={{ gridColumn: 'span 2', backgroundColor: '#374151', border: '1px solid #4b5563', borderRadius: '6px', padding: '8px 12px', color: 'white', fontSize: '14px' }} />
          </div>
          <button onClick={() => { setVehicles([{ id: Date.now().toString(), ...newVehicle, status: 'Pending Inventory', age: 0 }, ...vehicles]); setShowAddForm(false); setNewVehicle({ stockNum: '', year: '', make: '', model: '', location: 'Front Lot' }); }} style={{ width: '100%', backgroundColor: '#16a34a', color: 'white', fontWeight: '600', padding: '10px', borderRadius: '6px', border: 'none', marginTop: '12px', fontSize: '14px' }}>
            Add to Inventory
          </button>
        </div>
      )}

      {/* Vehicle List */}
      <div style={{ padding: '16px' }}>
        {filteredVehicles.map(vehicle => (
          <div key={vehicle.id} style={{ backgroundColor: '#1f2937', padding: '12px', borderRadius: '8px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '4px', height: '48px', borderRadius: '2px', backgroundColor: getStatusColor(vehicle.status) }}></div>
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
      </div>
    </div>
  );
}
