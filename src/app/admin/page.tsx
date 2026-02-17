'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { supabase, User, PipelineStage, DropdownList } from '@/lib/supabase';

const ROLES = ['Manager', 'Service', 'Detail', 'Sales'];
const STAGE_ROLES = ['Manager', 'Service', 'Detail', 'Sales'];
const COMPLETION_TYPES = ['checkbox', 'dropdown'];
const STAGE_COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899'];

export default function AdminPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  
  const [users, setUsers] = useState<User[]>([]);
  const [stages, setStages] = useState<PipelineStage[]>([]);
  const [dropdownLists, setDropdownLists] = useState<DropdownList[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'users' | 'stages' | 'dropdowns'>('users');
  
  // User form state
  const [showUserForm, setShowUserForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userForm, setUserForm] = useState({ name: '', pin: '', roles: [] as string[] });
  
  // Stage form state
  const [showStageForm, setShowStageForm] = useState(false);
  const [editingStage, setEditingStage] = useState<PipelineStage | null>(null);
  const [stageForm, setStageForm] = useState({ stage_name: '', role: 'Manager', completion_field: '', completion_type: 'checkbox' as 'checkbox' | 'dropdown', list_name: '', target_hours: 24, stage_color: '#ef4444', is_terminal: false, order: 1 });
  
  // Dropdown form state
  const [showDropdownForm, setShowDropdownForm] = useState(false);
  const [editingDropdown, setEditingDropdown] = useState<DropdownList | null>(null);
  const [dropdownForm, setDropdownForm] = useState({ list_name: '', values: '' });

  useEffect(() => {
    if (!authLoading && (!user || !user.roles.includes('Manager'))) {
      router.push('/');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user && user.roles.includes('Manager')) {
      fetchData();
    }
  }, [user]);

  async function fetchData() {
    setLoading(true);
    try {
      const [usersRes, stagesRes, dropdownsRes] = await Promise.all([
        supabase.from('users').select('*').order('created_at', { ascending: false }),
        supabase.from('pipeline_stages').select('*').order('order'),
        supabase.from('dropdown_lists').select('*')
      ]);

      if (usersRes.data) setUsers(usersRes.data);
      if (stagesRes.data) setStages(stagesRes.data);
      if (dropdownsRes.data) setDropdownLists(dropdownsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }

  // User functions
  async function handleSaveUser() {
    if (!userForm.name || !userForm.pin || userForm.roles.length === 0) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      if (editingUser) {
        const { error } = await supabase
          .from('users')
          .update({ name: userForm.name, pin: userForm.pin, roles: userForm.roles })
          .eq('id', editingUser.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('users')
          .insert({
            dealership_id: user?.dealership_id,
            name: userForm.name,
            pin: userForm.pin,
            roles: userForm.roles,
            active: true
          });
        if (error) throw error;
      }
      
      setShowUserForm(false);
      setEditingUser(null);
      setUserForm({ name: '', pin: '', roles: [] });
      fetchData();
    } catch (error) {
      console.error('Error saving user:', error);
      alert('Failed to save user');
    }
  }

  async function toggleUserActive(userId: string, currentActive: boolean) {
    try {
      const { error } = await supabase
        .from('users')
        .update({ active: !currentActive })
        .eq('id', userId);
      if (error) throw error;
      fetchData();
    } catch (error) {
      console.error('Error toggling user:', error);
    }
  }

  function openUserForm(existingUser?: User) {
    if (existingUser) {
      setEditingUser(existingUser);
      setUserForm({ name: existingUser.name, pin: existingUser.pin, roles: existingUser.roles });
    } else {
      setEditingUser(null);
      setUserForm({ name: '', pin: '', roles: [] });
    }
    setShowUserForm(true);
  }

  // Stage functions
  async function handleSaveStage() {
    if (!stageForm.stage_name || !stageForm.completion_field) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      if (editingStage) {
        const { error } = await supabase
          .from('pipeline_stages')
          .update(stageForm)
          .eq('id', editingStage.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('pipeline_stages')
          .insert({ ...stageForm, dealership_id: user?.dealership_id });
        if (error) throw error;
      }
      
      setShowStageForm(false);
      setEditingStage(null);
      fetchData();
    } catch (error) {
      console.error('Error saving stage:', error);
      alert('Failed to save stage');
    }
  }

  async function deleteStage(stageId: string) {
    if (!confirm('Are you sure you want to delete this stage?')) return;
    
    try {
      const { error } = await supabase.from('pipeline_stages').delete().eq('id', stageId);
      if (error) throw error;
      fetchData();
    } catch (error) {
      console.error('Error deleting stage:', error);
    }
  }

  function openStageForm(existingStage?: PipelineStage) {
    if (existingStage) {
      setEditingStage(existingStage);
      setStageForm({
        stage_name: existingStage.stage_name,
        role: existingStage.role,
        completion_field: existingStage.completion_field,
        completion_type: existingStage.completion_type as 'checkbox' | 'dropdown',
        list_name: existingStage.list_name || '',
        target_hours: existingStage.target_hours,
        stage_color: existingStage.stage_color,
        is_terminal: existingStage.is_terminal,
        order: existingStage.order
      });
    } else {
      setEditingStage(null);
      setStageForm({ stage_name: '', role: 'Manager', completion_field: '', completion_type: 'checkbox', list_name: '', target_hours: 24, stage_color: '#ef4444', is_terminal: false, order: stages.length + 1 });
    }
    setShowStageForm(true);
  }

  // Dropdown functions
  async function handleSaveDropdown() {
    if (!dropdownForm.list_name) {
      alert('Please enter a list name');
      return;
    }

    try {
      const values = dropdownForm.values.split('\n').map(v => v.trim()).filter(v => v);
      
      if (editingDropdown) {
        const { error } = await supabase
          .from('dropdown_lists')
          .update({ list_name: dropdownForm.list_name, values })
          .eq('id', editingDropdown.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('dropdown_lists')
          .insert({ dealership_id: user?.dealership_id, list_name: dropdownForm.list_name, values });
        if (error) throw error;
      }
      
      setShowDropdownForm(false);
      setEditingDropdown(null);
      setDropdownForm({ list_name: '', values: '' });
      fetchData();
    } catch (error) {
      console.error('Error saving dropdown:', error);
      alert('Failed to save dropdown list');
    }
  }

  async function deleteDropdown(dropdownId: string) {
    if (!confirm('Are you sure you want to delete this list?')) return;
    
    try {
      const { error } = await supabase.from('dropdown_lists').delete().eq('id', dropdownId);
      if (error) throw error;
      fetchData();
    } catch (error) {
      console.error('Error deleting dropdown:', error);
    }
  }

  function openDropdownForm(existingDropdown?: DropdownList) {
    if (existingDropdown) {
      setEditingDropdown(existingDropdown);
      setDropdownForm({ list_name: existingDropdown.list_name, values: existingDropdown.values.join('\n') });
    } else {
      setEditingDropdown(null);
      setDropdownForm({ list_name: '', values: '' });
    }
    setShowDropdownForm(true);
  }

  const toggleRole = (role: string) => {
    setUserForm(prev => ({
      ...prev,
      roles: prev.roles.includes(role) 
        ? prev.roles.filter(r => r !== role)
        : [...prev.roles, role]
    }));
  };

  if (authLoading || loading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: '#94a3b8' }}>Loading...</div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0f172a', color: 'white', fontFamily: 'system-ui, sans-serif' }}>
      <header style={{ backgroundColor: '#1e293b', padding: '16px', borderBottom: '1px solid #334155', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>⚙️ Admin Panel</h1>
          <button onClick={() => router.push('/')} style={{ backgroundColor: '#475569', border: 'none', borderRadius: '8px', padding: '8px 16px', color: 'white', fontSize: '14px', cursor: 'pointer' }}>← Back</button>
        </div>
      </header>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid #334155' }}>
        {(['users', 'stages', 'dropdowns'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{ flex: 1, padding: '16px', backgroundColor: activeTab === tab ? '#1e293b' : '#0f172a', border: 'none', borderBottom: activeTab === tab ? '2px solid #2563eb' : '2px solid transparent', color: activeTab === tab ? '#2563eb' : '#94a3b8', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      <div style={{ padding: '16px' }}>
        {/* Users Tab */}
        {activeTab === 'users' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 600 }}>Users</h2>
              <button onClick={() => openUserForm()} style={{ backgroundColor: '#2563eb', color: 'white', padding: '8px 16px', borderRadius: '8px', border: 'none', fontSize: '14px', cursor: 'pointer' }}>+ Add User</button>
            </div>
            
            <div style={{ display: 'grid', gap: '8px' }}>
              {users.map(u => (
                <div key={u.id} style={{ backgroundColor: '#1e293b', padding: '16px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>{u.name}</div>
                    <div style={{ fontSize: '12px', color: '#94a3b8' }}>PIN: {u.pin} • Roles: {u.roles.join(', ')}</div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <span style={{ fontSize: '12px', color: u.active ? '#22c55e' : '#ef4444' }}>{u.active ? 'Active' : 'Inactive'}</span>
                    <button onClick={() => toggleUserActive(u.id, u.active)} style={{ backgroundColor: u.active ? '#ef4444' : '#22c55e', color: 'white', padding: '6px 12px', borderRadius: '6px', border: 'none', fontSize: '12px', cursor: 'pointer' }}>{u.active ? 'Deactivate' : 'Activate'}</button>
                    <button onClick={() => openUserForm(u)} style={{ backgroundColor: '#475569', color: 'white', padding: '6px 12px', borderRadius: '6px', border: 'none', fontSize: '12px', cursor: 'pointer' }}>Edit</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Stages Tab */}
        {activeTab === 'stages' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 600 }}>Pipeline Stages</h2>
              <button onClick={() => openStageForm()} style={{ backgroundColor: '#2563eb', color: 'white', padding: '8px 16px', borderRadius: '8px', border: 'none', fontSize: '14px', cursor: 'pointer' }}>+ Add Stage</button>
            </div>
            
            <div style={{ display: 'grid', gap: '8px' }}>
              {stages.sort((a, b) => a.order - b.order).map(s => (
                <div key={s.id} style={{ backgroundColor: '#1e293b', padding: '16px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderLeft: `4px solid ${s.stage_color}` }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>{s.order}. {s.stage_name}</div>
                    <div style={{ fontSize: '12px', color: '#94a3b8' }}>{s.role} • {s.completion_type} • {s.target_hours}h {s.is_terminal && '• Terminal'}</div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => openStageForm(s)} style={{ backgroundColor: '#475569', color: 'white', padding: '6px 12px', borderRadius: '6px', border: 'none', fontSize: '12px', cursor: 'pointer' }}>Edit</button>
                    <button onClick={() => deleteStage(s.id)} style={{ backgroundColor: '#ef444420', color: '#ef4444', padding: '6px 12px', borderRadius: '6px', border: '1px solid #ef4444', fontSize: '12px', cursor: 'pointer' }}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Dropdowns Tab */}
        {activeTab === 'dropdowns' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 600 }}>Dropdown Lists</h2>
              <button onClick={() => openDropdownForm()} style={{ backgroundColor: '#2563eb', color: 'white', padding: '8px 16px', borderRadius: '8px', border: 'none', fontSize: '14px', cursor: 'pointer' }}>+ Add List</button>
            </div>
            
            <div style={{ display: 'grid', gap: '8px' }}>
              {dropdownLists.map(d => (
                <div key={d.id} style={{ backgroundColor: '#1e293b', padding: '16px', borderRadius: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <div style={{ fontWeight: 600 }}>{d.list_name}</div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={() => openDropdownForm(d)} style={{ backgroundColor: '#475569', color: 'white', padding: '6px 12px', borderRadius: '6px', border: 'none', fontSize: '12px', cursor: 'pointer' }}>Edit</button>
                      <button onClick={() => deleteDropdown(d.id)} style={{ backgroundColor: '#ef444420', color: '#ef4444', padding: '6px 12px', borderRadius: '6px', border: '1px solid #ef4444', fontSize: '12px', cursor: 'pointer' }}>Delete</button>
                    </div>
                  </div>
                  <div style={{ fontSize: '12px', color: '#94a3b8' }}>{d.values.join(', ')}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* User Form Modal */}
      {showUserForm && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: '#00000080', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ backgroundColor: '#1e293b', padding: '20px', borderRadius: '16px', width: '100%', maxWidth: '400px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px' }}>{editingUser ? 'Edit User' : 'Add User'}</h2>
            
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>Name</label>
              <input value={userForm.name} onChange={e => setUserForm({...userForm, name: e.target.value})} style={{ width: '100%', backgroundColor: '#334155', border: 'none', borderRadius: '8px', padding: '12px', color: 'white', fontSize: '14px' }} />
            </div>
            
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>PIN (4 digits)</label>
              <input value={userForm.pin} onChange={e => setUserForm({...userForm, pin: e.target.value.replace(/\D/g, '').slice(0, 4)})} maxLength={4} style={{ width: '100%', backgroundColor: '#334155', border: 'none', borderRadius: '8px', padding: '12px', color: 'white', fontSize: '14px' }} />
            </div>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '8px' }}>Roles</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {ROLES.map(role => (
                  <button key={role} onClick={() => toggleRole(role)} style={{ backgroundColor: userForm.roles.includes(role) ? '#2563eb' : '#334155', color: 'white', padding: '8px 16px', borderRadius: '8px', border: 'none', fontSize: '13px', cursor: 'pointer' }}>{role}</button>
                ))}
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => setShowUserForm(false)} style={{ flex: 1, backgroundColor: '#475569', color: 'white', padding: '12px', borderRadius: '8px', border: 'none', fontSize: '14px', cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleSaveUser} style={{ flex: 1, backgroundColor: '#2563eb', color: 'white', padding: '12px', borderRadius: '8px', border: 'none', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Stage Form Modal */}
      {showStageForm && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: '#00000080', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ backgroundColor: '#1e293b', padding: '20px', borderRadius: '16px', width: '100%', maxWidth: '400px', maxHeight: '90vh', overflow: 'auto' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px' }}>{editingStage ? 'Edit Stage' : 'Add Stage'}</h2>
            
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>Stage Name</label>
              <input value={stageForm.stage_name} onChange={e => setStageForm({...stageForm, stage_name: e.target.value})} style={{ width: '100%', backgroundColor: '#334155', border: 'none', borderRadius: '8px', padding: '12px', color: 'white', fontSize: '14px' }} />
            </div>
            
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>Role</label>
              <select value={stageForm.role} onChange={e => setStageForm({...stageForm, role: e.target.value})} style={{ width: '100%', backgroundColor: '#334155', border: 'none', borderRadius: '8px', padding: '12px', color: 'white', fontSize: '14px' }}>
                {STAGE_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>Completion Field</label>
              <input value={stageForm.completion_field} onChange={e => setStageForm({...stageForm, completion_field: e.target.value})} style={{ width: '100%', backgroundColor: '#334155', border: 'none', borderRadius: '8px', padding: '12px', color: 'white', fontSize: '14px' }} />
            </div>
            
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>Completion Type</label>
              <select value={stageForm.completion_type} onChange={e => setStageForm({...stageForm, completion_type: e.target.value as 'checkbox' | 'dropdown'})} style={{ width: '100%', backgroundColor: '#334155', border: 'none', borderRadius: '8px', padding: '12px', color: 'white', fontSize: '14px' }}>
                {COMPLETION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            
            {stageForm.completion_type === 'dropdown' && (
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>Dropdown List</label>
                <select value={stageForm.list_name} onChange={e => setStageForm({...stageForm, list_name: e.target.value})} style={{ width: '100%', backgroundColor: '#334155', border: 'none', borderRadius: '8px', padding: '12px', color: 'white', fontSize: '14px' }}>
                  <option value="">Select list...</option>
                  {dropdownLists.map(d => <option key={d.id} value={d.list_name}>{d.list_name}</option>)}
                </select>
              </div>
            )}
            
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>Target Hours</label>
              <input type="number" value={stageForm.target_hours} onChange={e => setStageForm({...stageForm, target_hours: parseInt(e.target.value) || 0})} style={{ width: '100%', backgroundColor: '#334155', border: 'none', borderRadius: '8px', padding: '12px', color: 'white', fontSize: '14px' }} />
            </div>
            
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>Order</label>
              <input type="number" value={stageForm.order} onChange={e => setStageForm({...stageForm, order: parseInt(e.target.value) || 1})} style={{ width: '100%', backgroundColor: '#334155', border: 'none', borderRadius: '8px', padding: '12px', color: 'white', fontSize: '14px' }} />
            </div>
            
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>Color</label>
              <select value={stageForm.stage_color} onChange={e => setStageForm({...stageForm, stage_color: e.target.value})} style={{ width: '100%', backgroundColor: '#334155', border: 'none', borderRadius: '8px', padding: '12px', color: 'white', fontSize: '14px' }}>
                {STAGE_COLORS.map(c => <option key={c} value={c} style={{ color: c }}>{c}</option>)}
              </select>
            </div>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input type="checkbox" checked={stageForm.is_terminal} onChange={e => setStageForm({...stageForm, is_terminal: e.target.checked})} style={{ width: '20px', height: '20px' }} />
                <span>Terminal Stage (Ready for Sale)</span>
              </label>
            </div>
            
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => setShowStageForm(false)} style={{ flex: 1, backgroundColor: '#475569', color: 'white', padding: '12px', borderRadius: '8px', border: 'none', fontSize: '14px', cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleSaveStage} style={{ flex: 1, backgroundColor: '#2563eb', color: 'white', padding: '12px', borderRadius: '8px', border: 'none', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Dropdown Form Modal */}
      {showDropdownForm && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: '#00000080', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ backgroundColor: '#1e293b', padding: '20px', borderRadius: '16px', width: '100%', maxWidth: '400px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px' }}>{editingDropdown ? 'Edit List' : 'Add List'}</h2>
            
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>List Name</label>
              <input value={dropdownForm.list_name} onChange={e => setDropdownForm({...dropdownForm, list_name: e.target.value})} style={{ width: '100%', backgroundColor: '#334155', border: 'none', borderRadius: '8px', padding: '12px', color: 'white', fontSize: '14px' }} />
            </div>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>Values (one per line)</label>
              <textarea value={dropdownForm.values} onChange={e => setDropdownForm({...dropdownForm, values: e.target.value})} rows={6} style={{ width: '100%', backgroundColor: '#334155', border: 'none', borderRadius: '8px', padding: '12px', color: 'white', fontSize: '14px', resize: 'vertical' }} />
            </div>
            
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => setShowDropdownForm(false)} style={{ flex: 1, backgroundColor: '#475569', color: 'white', padding: '12px', borderRadius: '8px', border: 'none', fontSize: '14px', cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleSaveDropdown} style={{ flex: 1, backgroundColor: '#2563eb', color: 'white', padding: '12px', borderRadius: '8px', border: 'none', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
