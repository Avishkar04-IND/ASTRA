import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useSession } from '../context/SessionContext';
import { Save } from 'lucide-react';
import { UserProfileSchema } from '../lib/fieldSchemas';
import { FIELD_KEY_LABELS, getFieldSensitivity, FIELD_SOURCE } from '../lib/fieldKeys';
import StateFeedback from '../components/StateFeedback';
import { encryptField, decryptField } from '../lib/crypto';

export default function Profile() {
  const { user, sessionKey } = useSession();
  const [formData, setFormData] = useState({
    full_name: '',
    dob: '',
    aadhaar_number: '',
    mobile: '',
    address: ''
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});

    const formatTypeForField = (fieldKey) => {
      if (fieldKey === 'dob') return 'date';
      return 'text';
    };

  useEffect(() => {
    async function loadProfile() {
      if (!user?.id || !sessionKey) return;
      
      setLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from('profile_fields')
        .select('*')
        .eq('user_id', user.id);
      
      if (error) {
        if (error.code !== 'PGRST116') {
          setError(error.message);
        }
      } else if (data) {
        const decryptedFormData = { full_name: '', dob: '', aadhaar_number: '', mobile: '', address: '' };
        for (const field of data) {
           if (Object.keys(decryptedFormData).includes(field.field_key)) {
               try {
                   const plaintext = await decryptField(field.field_value_ciphertext, field.field_value_iv, sessionKey);
                   decryptedFormData[field.field_key] = plaintext;
               } catch (err) {
                   console.error(`Failed to decrypt field ${field.field_key}`, err);
               }
           }
        }
        setFormData(decryptedFormData);
      }
      setLoading(false);
    }
    
    loadProfile();
  }, [user, sessionKey]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (validationErrors[name]) {
      setValidationErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setValidationErrors({});

    const result = UserProfileSchema.safeParse(formData);
    
    if (!result.success) {
      const formattedErrors = result.error.format();
      const newErrors = {};
      Object.keys(formattedErrors).forEach(key => {
        if (key !== '_errors' && formattedErrors[key]?._errors?.length > 0) {
          newErrors[key] = formattedErrors[key]._errors[0];
        }
      });
      setValidationErrors(newErrors);
      setError("Please fix the validation errors below.");
      return;
    }

    try {
      if (!sessionKey) throw new Error("Session key not available. Please log in again.");
      
      const fieldKeys = Object.keys(result.data);
      
      for (const key of fieldKeys) {
        const plaintext = result.data[key];
        
        const { data: existingField } = await supabase
          .from('profile_fields')
          .select('id')
          .eq('user_id', user.id)
          .eq('field_key', key)
          .maybeSingle();
              
        if (plaintext) {
            const { ciphertext, iv } = await encryptField(plaintext, sessionKey);
            
            if (existingField) {
                const sensitivity = getFieldSensitivity(key);
                console.log("PROFILE FIELD UPDATE:", {
                  user_id: user.id,
                  section: 'personal',
                  field_key: key,
                  sensitivity: sensitivity,
                  source: FIELD_SOURCE.MANUAL
                });
                const { error: updateErr } = await supabase
                  .from('profile_fields')
                  .update({
                      field_value_ciphertext: ciphertext,
                      field_value_iv: iv,
                      updated_at: new Date().toISOString(),
                      sensitivity: sensitivity,
                      source: FIELD_SOURCE.MANUAL
                  })
                  .eq('id', existingField.id);
                if (updateErr) throw updateErr;
            } else {
                const sensitivity = getFieldSensitivity(key);
                console.log("PROFILE FIELD INSERT:", {
                  user_id: user.id,
                  section: 'personal',
                  field_key: key,
                  sensitivity: sensitivity,
                  source: FIELD_SOURCE.MANUAL
                });
                const { error: insertErr } = await supabase
                  .from('profile_fields')
                  .insert({
                      user_id: user.id,
                      section: 'personal',
                      field_key: key,
                      field_value_ciphertext: ciphertext,
                      field_value_iv: iv,
                      format_type: formatTypeForField(key),
                      sensitivity: sensitivity,
                      source: FIELD_SOURCE.MANUAL
                  });
                if (insertErr) throw insertErr;
            }
        } else if (existingField) {
            // Delete if field is empty now
            const { error: delErr } = await supabase
              .from('profile_fields')
              .delete()
              .eq('id', existingField.id);
            if (delErr) throw delErr;
        }
      }
      
      setSuccess("Profile updated successfully!");
    } catch (err) {
      console.error("Save error", err);
      setError("Error saving profile: " + err.message);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-slate-900">My Profile</h1>
      </div>

      <StateFeedback loading={loading} error={error} successMessage={success}>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            <div>
              <label className="block text-sm font-medium text-slate-700">
                {FIELD_KEY_LABELS.full_name}
              </label>
              <input 
                name="full_name"
                type="text" 
                value={formData.full_name}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
              />
              {validationErrors.full_name && <p className="text-red-500 text-xs mt-1">{validationErrors.full_name}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">
                {FIELD_KEY_LABELS.dob}
              </label>
              <input 
                name="dob"
                type="date" 
                value={formData.dob}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
              />
              {validationErrors.dob && <p className="text-red-500 text-xs mt-1">{validationErrors.dob}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">
                {FIELD_KEY_LABELS.aadhaar_number}
              </label>
              <input 
                name="aadhaar_number"
                type="text" 
                value={formData.aadhaar_number}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
              />
              {validationErrors.aadhaar_number && <p className="text-red-500 text-xs mt-1">{validationErrors.aadhaar_number}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">
                {FIELD_KEY_LABELS.mobile}
              </label>
              <input 
                name="mobile"
                type="text" 
                value={formData.mobile}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
              />
              {validationErrors.mobile && <p className="text-red-500 text-xs mt-1">{validationErrors.mobile}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">
                {FIELD_KEY_LABELS.address}
              </label>
              <textarea 
                name="address"
                rows="3"
                value={formData.address}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
              />
              {validationErrors.address && <p className="text-red-500 text-xs mt-1">{validationErrors.address}</p>}
            </div>

            <div className="flex items-end gap-2 pt-4">
              <button type="submit" className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700 text-sm font-medium transition">
                <Save className="w-4 h-4" /> Save Profile
              </button>
            </div>
          </form>
        </div>
      </StateFeedback>
    </div>
  );
}
