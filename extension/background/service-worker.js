/**
 * MahaSetu — Background Service Worker (Manifest V3)
 * Handles session key management, cryptographic operations, and messaging with content scripts & dashboard.
 *
 * SECURITY DESIGN:
 * The derived AES `sessionKey` lives ONLY in memory within this module-level scope.
 * It is never written to chrome.storage, localStorage, IndexedDB, or sent over the network.
 * This guarantees a zero-knowledge architecture where the server never has access to the key.
 */

import { deriveKey, encryptField, decryptField, generateSalt } from './crypto.js';
import { supabase } from './supabase-client.js';

// In-memory key storage (never written to disk or chrome.storage)
let sessionKey = null;
let currentUserId = null;

// Handle runtime messages from content script & dashboard
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  (async () => {
    try {
      switch (message.type) {
        case 'LOGIN': {
          const { email, password } = message.payload;
          
          // 1. Authenticate with Supabase
          const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password });
          if (authError) throw authError;
          
          currentUserId = authData.user.id;
          
          // 2. Fetch or generate user salt from profiles table
          let { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('key_derivation_salt')
            .eq('id', currentUserId)
            .single();
            
          let salt = profile?.key_derivation_salt;
          
          if (!salt) {
            throw new Error('Key derivation salt is missing for this user.');
          }
          
          // 3. Derive the AES session key and keep it in memory
          sessionKey = await deriveKey(password, salt);
          
          sendResponse({ success: true });
          break;
        }

        case 'LOGOUT': {
          await supabase.auth.signOut();
          sessionKey = null;
          currentUserId = null;
          sendResponse({ success: true });
          break;
        }

        case 'GET_SESSION_STATUS': {
          sendResponse({ loggedIn: !!sessionKey && !!currentUserId });
          break;
        }

        case 'SAVE_FIELD': {
          if (!sessionKey || !currentUserId) throw new Error('Session key not initialized. Please log in.');
          
          const { section, fieldKey, plaintext, formatType, sensitivity, source } = message.payload;
          
          // 1. Encrypt field
          const { ciphertext, iv } = await encryptField(plaintext, sessionKey);
          
          // 2. Upsert into profile_fields
          // We check if the field already exists for this user, then update or insert.
          let { data: existingField } = await supabase
            .from('profile_fields')
            .select('id')
            .eq('user_id', currentUserId)
            .eq('field_key', fieldKey)
            .maybeSingle();

          if (existingField) {
            const { error: updateError } = await supabase
              .from('profile_fields')
              .update({
                field_value_ciphertext: ciphertext,
                field_value_iv: iv,
                section,
                format_type: formatType,
                sensitivity: sensitivity || 'low',
                source: source || 'manual'
              })
              .eq('id', existingField.id);
            if (updateError) throw updateError;
          } else {
            const { error: insertError } = await supabase
              .from('profile_fields')
              .insert({
                user_id: currentUserId,
                section,
                field_key: fieldKey,
                field_value_ciphertext: ciphertext,
                field_value_iv: iv,
                format_type: formatType,
                sensitivity: sensitivity || 'low',
                source: source || 'manual'
              });
            if (insertError) throw insertError;
          }
          
          // 3. Log to audit_log
          await supabase.from('audit_log').insert({
            user_id: currentUserId,
            action: 'field_saved',
            field_key: fieldKey,
            details: { formatType, sensitivity, source }
          });
          
          sendResponse({ success: true });
          break;
        }

        case 'GET_PROFILE_FIELDS': {
          if (!sessionKey || !currentUserId) throw new Error('Session key not initialized. Please log in.');
          
          const { data: fields, error: fetchError } = await supabase
            .from('profile_fields')
            .select('*')
            .eq('user_id', currentUserId);
            
          if (fetchError) throw fetchError;
          
          const decryptedFields = await Promise.all(fields.map(async (field) => {
            const plaintext = await decryptField(field.field_value_ciphertext, field.field_value_iv, sessionKey);
            return {
              section: field.section,
              fieldKey: field.field_key,
              plaintext,
              formatType: field.format_type,
              sensitivity: field.sensitivity
            };
          }));
          
          sendResponse({ success: true, fields: decryptedFields });
          break;
        }

        case 'REQUEST_AUTOFILL': {
          if (!sessionKey || !currentUserId) throw new Error('Session key not initialized. Please log in.');
          
          const { siteOrigin, requestedFieldKeys } = message.payload;
          
          // 1. Check for active consent
          const { data: consents, error: consentError } = await supabase
            .from('consents')
            .select('field_keys, expires_at')
            .eq('user_id', currentUserId)
            .eq('site_origin', siteOrigin)
            .eq('status', 'active');
            
          if (consentError) throw consentError;
          
          // Validate expiration dates
          const now = new Date();
          const validConsents = consents.filter(c => !c.expires_at || new Date(c.expires_at) > now);
          
          const consentedKeys = new Set();
          validConsents.forEach(c => {
            if (Array.isArray(c.field_keys)) {
              c.field_keys.forEach(k => consentedKeys.add(k));
            }
          });
          
          const approvedKeys = [];
          const missingConsentKeys = [];
          
          requestedFieldKeys.forEach(k => {
            if (consentedKeys.has(k)) {
              approvedKeys.push(k);
            } else {
              missingConsentKeys.push(k);
            }
          });
          
          // 2. Fetch and decrypt approved fields
          const results = {};
          if (approvedKeys.length > 0) {
             const { data: fields, error: fieldsError } = await supabase
              .from('profile_fields')
              .select('*')
              .eq('user_id', currentUserId)
              .in('field_key', approvedKeys);
              
            if (fieldsError) throw fieldsError;
            
            for (const field of fields) {
              const plaintext = await decryptField(field.field_value_ciphertext, field.field_value_iv, sessionKey);
              results[field.field_key] = plaintext;
              
              // Log filled action
              await supabase.from('audit_log').insert({
                user_id: currentUserId,
                action: 'filled',
                site_origin: siteOrigin,
                field_key: field.field_key
              });
            }
          }
          
          // Log declined actions for missing consent
          for (const key of missingConsentKeys) {
            await supabase.from('audit_log').insert({
              user_id: currentUserId,
              action: 'declined',
              site_origin: siteOrigin,
              field_key: key,
              details: { reason: 'missing_consent' }
            });
          }
          
          sendResponse({ 
            success: true, 
            fields: results, 
            missingConsents: missingConsentKeys 
          });
          break;
        }

        case 'GRANT_CONSENT': {
          if (!currentUserId) throw new Error('Not logged in.');
          const { siteOrigin, purpose, fieldKeys, expiresAt } = message.payload;
          
          const { error: insertError } = await supabase
            .from('consents')
            .insert({
              user_id: currentUserId,
              site_origin: siteOrigin,
              purpose,
              field_keys: fieldKeys,
              status: 'active',
              expires_at: expiresAt || null
            });
            
          if (insertError) throw insertError;
          
          await supabase.from('audit_log').insert({
            user_id: currentUserId,
            action: 'consent_granted',
            site_origin: siteOrigin,
            details: { purpose, fieldKeys, expiresAt }
          });
          
          sendResponse({ success: true });
          break;
        }

        case 'REVOKE_CONSENT': {
          if (!currentUserId) throw new Error('Not logged in.');
          const { consentId } = message.payload;
          
          const { data: consent, error: consentError } = await supabase
            .from('consents')
            .update({
              status: 'revoked',
              revoked_at: new Date().toISOString()
            })
            .eq('id', consentId)
            .eq('user_id', currentUserId)
            .select('site_origin')
            .single();
            
          if (consentError) throw consentError;
          
          await supabase.from('audit_log').insert({
            user_id: currentUserId,
            action: 'consent_revoked',
            site_origin: consent.site_origin,
            details: { consentId }
          });
          
          sendResponse({ success: true });
          break;
        }

        case 'LOG_FORMAT_MISMATCH': {
          // Allows content script to log if a field format mismatch occurs during autofill
          if (!currentUserId) throw new Error('Not logged in.');
          const { siteOrigin, fieldKey, details } = message.payload;
          
          await supabase.from('audit_log').insert({
            user_id: currentUserId,
            action: 'format_mismatch',
            site_origin: siteOrigin,
            field_key: fieldKey,
            details
          });
          
          sendResponse({ success: true });
          break;
        }

        default:
          sendResponse({ success: false, error: `Unknown message type: ${message.type}` });
      }
    } catch (err) {
      console.error('Service worker message error:', err);
      sendResponse({ success: false, error: err.message });
    }
  })();
  return true; // Keep message channel open for async response
});

console.log('MahaSetu background service worker initialized with Supabase logic.');
