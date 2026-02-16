'use client';

import { useState, useEffect } from 'react';

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

// Common used car makes/models by year (for dropdowns)
const YEARS = Array.from({ length: 25 }, (_, i) => (2026 - i).toString());

const MAKES_MODELS: Record<string, string[]> = {
  'Chevrolet': ['Silverado 1500', 'Silverado 2500', 'Equinox', 'Traverse', 'Tahoe', 'Suburban', 'Colorado', 'Camaro', 'Malibu', 'Impala', 'Express 1500', 'Express 2500', 'Cruze', 'Trax', 'Blazer'],
  'Ford': ['F-150', 'F-250', 'F-350', 'Explorer', 'Expedition', 'Escape', 'Edge', 'Mustang', 'Ranger', 'Bronco', 'Transit 150', 'Transit 250', 'Focus', 'Fusion', 'Escape'],
  'Toyota': ['Camry', 'Corolla', 'RAV4', 'Highlander', '4Runner', 'Tacoma', 'Tundra', 'Prius', 'Sienna', 'Sequoia', 'Crown'],
  'Honda': ['Civic', 'Accord', 'CR-V', 'Pilot', 'HR-V', 'Odyssey', 'Ridgeline', 'Passport'],
  'Nissan': ['Altima', 'Rogue', 'Sentra', 'Pathfinder', 'Armada', 'Frontier', 'Murano', 'Kicks', 'Leaf'],
  'GMC': ['Sierra 1500', 'Sierra 2500', 'Acadia', 'Terrain', 'Yukon', 'Yukon XL', 'Canyon', 'Envoy'],
  'Buick': ['Enclave', 'Encore', 'Envision', 'Regal', 'LaCrosse', 'Verano'],
  'Cadillac': ['Escalade', 'Escalade ESV', 'XT4', 'XT5', 'XT6', 'CT5', 'CT4', 'SRX'],
  'Dodge': ['Charger', 'Challenger', 'Durango', 'Journey', 'Grand Caravan', 'Hornet'],
  'Jeep': ['Wrangler', 'Grand Cherokee', 'Cherokee', 'Compass', 'Renegade', 'Gladiator', 'Wagoneer'],
  'Ram': ['1500', '2500', '3500', 'ProMaster'],
  'Mazda': ['CX-5', 'CX-50', 'CX-9', 'Mazda3', 'Mazda6', 'CX-30'],
  'Subaru': ['Outback', 'Forester', 'Crosstrek', 'Impreza', 'Legacy', 'Ascent', 'Solterra'],
  'Volkswagen': ['Tiguan', 'Atlas', 'Jetta', 'Passat', 'Golf', 'Taos', 'ID.4'],
  'Hyundai': ['Tucson', 'Santa Fe', 'Elantra', 'Sonata', 'Palisade', 'Venue', 'Kona', 'Ioniq 5'],
  'Kia': ['Sportage', 'Telluride', 'Sorento', 'Forte', 'K5', 'Seltos', 'Carnival', 'EV6'],
  'Lexus': ['RX', 'ES', 'NX', 'GX', 'LX', 'IS', 'UX', 'RZ'],
  'BMW': ['X3', 'X5', 'X7', 'X1', '3 Series', '5 Series', '7 Series', 'iX'],
  'Mercedes-Benz': ['GLC', 'GLE', 'GLS', 'C-Class', 'E-Class', 'S-Class', 'EQB', 'EQE'],
  'Audi': ['Q5', 'Q7', 'Q3', 'A4', 'A6', 'A3', 'e-tron', 'Q4 e-tron'],
  'Porsche': ['Cayenne', 'Macan', '911', 'Panamera', 'Taycan'],
  'Volvo': ['XC90', 'XC60', 'XC40', 'S60', 'S90', 'V60'],
  'Tesla': ['Model 3', 'Model Y', 'Model S', 'Model X', 'Cybertruck'],
  'Chrysler': ['Pacifica', '300', 'Voyager'],
  'Lincoln': ['Aviator', 'Navigator', 'Corsair', 'Nautilus', 'MKZ', 'Continental'],
  'Acura': ['MDX', 'RDX', 'TLX', 'ILX', 'RLX'],
  'Infiniti': ['QX60', 'QX80', 'QX50', 'Q50', 'Q60'],
  'Genesis': ['GV80', 'GV70', 'G80', 'G70', 'GV60'],
  'Mitsubishi': ['Outlander', 'Eclipse Cross', 'Mirage', 'Triton'],
  'Suzuki': ['Swift', 'Vitara', 'S-Cross', 'Jimny'],
  'Land Rover': ['Range Rover', 'Range Rover Sport', 'Defender', 'Discovery', 'Range Rover Evoque'],
  'Jaguar': ['F-PACE', 'E-PACE', 'I-PACE', 'XF', 'XE'],
  'Alfa Romeo': ['Stelvio', 'Giulia', 'Tonale'],
  'Peugeot': ['3008', '5008', '208', '508'],
  'Renault': ['Arkana', 'Koleos', 'Captur', 'Clio'],
  'Fiat': ['500X', '500L', 'Panda'],
  'MINI': ['Cooper', 'Countryman', 'Clubman', 'Cooper SE'],
  'Cupra': ['Formentor', 'Ateca', 'Leon'],
  'Polestar': ['2', '3', '4']
};

const COMMON_MAKES = Object.keys(MAKES_MODELS);

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
  const [newVehicle, setNewVehicle] = useState({ year: '', make: '', model: '', vin: '', stockNum: '', location: 'Front Lot' });
  const [searchQuery, setSearchQuery] = useState('');

  // Dependent dropdown logic
  const selectedMake = newVehicle.make;
  const modelsForMake = selectedMake ? (MAKES_MODELS[selectedMake] || []) : [];

  const filteredVehicles = vehicles.filter(v => {
    const matchesTab = activeTab === 'all' || v.status === activeTab;
    const matchesSearch = !searchQuery || 
      v.stockNum.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.vin.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.make.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.model.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

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
      const getVar = (name: string) => vars.find((v: any) => v.Variable === name)?.Value?.trim() || '';
      
      const year = getVar('Model Year') || getVar('Model Year');
      const make = getVar('Make') || '';
      const model = getVar('Model') || '';
      
      if (year || make || model) {
        setNewVehicle({ ...newVehicle, year, make, model: model || newVehicle.model });
      } else {
        alert('Could not decode VIN. Please select manually.');
      }
    } catch (e) {
      alert('Error decoding VIN. Please select manually.');
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
      status: 'Pending Inventory',
      location: newVehicle.location,
      age: 0
    };
    setVehicles([vehicle, ...vehicles]);
    setShowAddForm(false);
    setNewVehicle({ year: '', make: '', model: '', vin: '', stockNum: '', location: 'Front Lot' });
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

      {/* Search */}
      <div style={{ padding: '0 12px 8px' }}>
        <input 
          placeholder="Search stock#, VIN, make, model..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          style={{ width: '100%', backgroundColor: '#374151', border: '1px solid #4b5563', borderRadius: '8px', padding: '10px 12px', color: 'white', fontSize: '14px' }}
        />
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

          {/* Year/Make/Model Row - Dependent Dropdowns */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 2fr', gap: '8px', marginBottom: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: '#9ca3af', marginBottom: '4px' }}>Year *</label>
              <select 
                value={newVehicle.year}
                onChange={e => setNewVehicle({...newVehicle, year: e.target.value, make: '', model: ''})}
                style={{ width: '100%', backgroundColor: '#374151', border: '1px solid #4b5563', borderRadius: '8px', padding: '10px 12px', color: 'white', fontSize: '14px' }}
              >
                <option value="">Select Year</option>
                {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: '#9ca3af', marginBottom: '4px' }}>Make *</label>
              <select 
                value={newVehicle.make}
                onChange={e => setNewVehicle({...newVehicle, make: e.target.value, model: ''})}
                disabled={!newVehicle.year}
                style={{ width: '100%', backgroundColor: '#374151', border: '1px solid #4b5563', borderRadius: '8px', padding: '10px 12px', color: 'white', fontSize: '14px', opacity: newVehicle.year ? 1 : 0.5 }}
              >
                <option value="">Select Make</option>
                {COMMON_MAKES.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: '#9ca3af', marginBottom: '4px' }}>Model *</label>
              <select 
                value={newVehicle.model}
                onChange={e => setNewVehicle({...newVehicle, model: e.target.value})}
                disabled={!newVehicle.make}
                style={{ width: '100%', backgroundColor: '#374151', border: '1px solid #4b5563', borderRadius: '8px', padding: '10px 12px', color: 'white', fontSize: '14px', opacity: newVehicle.make ? 1 : 0.5 }}
              >
                <option value="">Select Model</option>
                {modelsForMake.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
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
