import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { encryptField, decryptField, maskValue } from '../lib/crypto';
import { useSession } from '../context/SessionContext';
import { Eye, EyeOff, Plus, Save } from 'lucide-react';

const SECTIONS = ['Identity', 'Personal', 'Education', 'Licenses'];

export default function Profile() {
  const { user, sessionKey } = useSession();
  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // State for unmasking
  const [unmasked, setUnmasked] = useState({}); // { field_key: plaintext }

  // Form state
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({
    section: 'Identity',
    field_key: '',
    plaintext: '',
    sensitivity: 'high',
    format_type: 'text'
  });

  const loadFields = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('profile_fields')
      .select('*')
      .eq('user_id', user.id);
    
    if (!error && data) {
      setFields(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadFields();
  }, []);

  const toggleUnmask = async (field) => {
    if (unmasked[field.field_key]) {
      // Re-mask
      setUnmasked(prev => {
        const next = { ...prev };
        delete next[field.field_key];
        return next;
      });
    } else {
      // Decrypt
      try {
        const plaintext = await decryptField(
          field.encrypted_value,
          field.iv,
          sessionKey
        );
        setUnmasked(prev => ({ ...prev, [field.field_key]: plaintext }));
      } catch (err) {
        console.error("Decryption failed", err);
        alert("Failed to decrypt this field. Key mismatch.");
      }
    }
  };

  const handleSaveField = async (e) => {
    e.preventDefault();
    try {
      // Encrypt the input
      const { encryptedValue, iv } = await encryptField(formData.plaintext, sessionKey);
      
      const { error } = await supabase.from('profile_fields').upsert({
        user_id: user.id,
        field_key: formData.field_key,
        section: formData.section,
        encrypted_value: encryptedValue,
        iv: iv,
        sensitivity: formData.sensitivity,
        format_type: formData.format_type,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id, field_key' });

      if (error) throw error;
      
      setIsAdding(false);
      setFormData({ ...formData, field_key: '', plaintext: '' });
      loadFields();
      
    } catch (err) {
      console.error("Save error", err);
      alert("Error saving field: " + err.message);
    }
  };

  const groupedFields = SECTIONS.reduce((acc, sec) => {
    acc[sec] = fields.filter(f => f.section === sec);
    return acc;
  }, {});

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Your Data Vault</h1>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 text-sm font-medium transition"
        >
          <Plus className="w-4 h-4" /> Add Field
        </button>
      </div>

      {isAdding && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 mb-8">
          <h2 className="text-lg font-medium text-slate-900 mb-4">Add or Edit Field</h2>
          <form onSubmit={handleSaveField} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">Section</label>
              <select 
                value={formData.section}
                onChange={e => setFormData({...formData, section: e.target.value})}
                className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
              >
                {SECTIONS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700">Field Key (e.g. aadhaar_number)</label>
              <input 
                required
                type="text" 
                value={formData.field_key}
                onChange={e => setFormData({...formData, field_key: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '')})}
                className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">Value (Plaintext)</label>
              <input 
                required
                type="text" 
                value={formData.plaintext}
                onChange={e => setFormData({...formData, plaintext: e.target.value})}
                className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
              />
            </div>

            <div className="flex items-end gap-2">
              <button type="submit" className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-md hover:bg-slate-800 text-sm font-medium transition w-full justify-center">
                <Save className="w-4 h-4" /> Encrypt & Save
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-slate-500">Loading your vault...</div>
      ) : (
        <div className="space-y-8">
          {SECTIONS.map(section => (
            <div key={section} className="bg-white shadow-sm border border-slate-200 rounded-lg overflow-hidden">
              <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
                <h3 className="text-lg font-medium text-slate-900">{section}</h3>
              </div>
              <ul className="divide-y divide-slate-200">
                {groupedFields[section].length === 0 ? (
                  <li className="px-6 py-4 text-sm text-slate-500 italic">No fields in this section yet.</li>
                ) : (
                  groupedFields[section].map(field => {
                    const isUnmasked = !!unmasked[field.field_key];
                    // We generate a masked representation from the Base64 ciphertext length as a fallback proxy
                    // because the plaintext length is hidden. (Or we just use a generic '••••••••')
                    const displayValue = isUnmasked 
                      ? unmasked[field.field_key] 
                      : maskValue(field.encrypted_value.substring(0, 16)); // Just masking a chunk of ciphertext as proxy

                    return (
                      <li key={field.field_key} className="px-6 py-4 flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-slate-900">{field.field_key}</p>
                          <p className="text-xs text-slate-500 font-mono mt-1">
                            {displayValue}
                          </p>
                        </div>
                        <button 
                          onClick={() => toggleUnmask(field)}
                          className="text-slate-400 hover:text-indigo-600 transition p-2"
                          title={isUnmasked ? "Mask value" : "Decrypt & view"}
                        >
                          {isUnmasked ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </li>
                    );
                  })
                )}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
