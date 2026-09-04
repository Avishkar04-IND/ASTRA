import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const mockDigiLockerResponse = {
  provider: 'DigiLocker Mock Sandbox',
  user: {
    id: 'mock-citizen-001',
    name: 'Arya Dilliwale'
  },
  documents: [
    {
      id: 'doc-aadhaar-001',
      type: 'aadhaar',
      issuer: 'UIDAI (Mock)',
      title: 'Aadhaar Card',
      issuedAt: '2025-04-01',
      fields: {
        full_name: 'Arya Dilliwale',
        dob: '2005-06-10',
        aadhaar_number: '123412341234',
        mobile: '9876543210',
        address: 'Pune, Maharashtra'
      }
    },
    {
      id: 'doc-marksheet-001',
      type: 'marksheet',
      issuer: 'Maharashtra State Board (Mock)',
      title: 'Secondary School Certificate',
      issuedAt: '2022-06-15',
      fields: {
        marks_percentage: '87.5'
      }
    }
  ]
}

function mockDigiLockerApi() {
  return {
    name: 'mock-digilocker-api',
    configureServer(server) {
      server.middlewares.use('/api/mock/digilocker/documents', (request, response) => {
        response.setHeader('Content-Type', 'application/json')
        response.end(JSON.stringify(mockDigiLockerResponse))
      })
    }
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), mockDigiLockerApi()],
  server: {
    port: 5175,
    strictPort: true
  }
})
