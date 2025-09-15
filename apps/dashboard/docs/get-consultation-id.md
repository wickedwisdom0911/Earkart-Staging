# Getting a Real Consultation ID for Recording Tests

## Quick Methods to Get Valid Consultation IDs

### Method 1: Database Query (Fastest)
If you have database access, run this query:
```sql
SELECT id, createdAt FROM consultations ORDER BY createdAt DESC LIMIT 5;
```

### Method 2: API Endpoint
If your backend is running, call:
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/api/v1/consultations
```

### Method 3: Network Tab (Browser)
1. Open any working consultation page
2. Open DevTools → Network tab
3. Look for API calls containing consultation IDs
4. Copy the ID from the URL or response

### Method 4: Create a Test Consultation
If you can create consultations, use the API:
```bash
curl -X POST -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"patientId":"test","centreId":"test"}' \
  http://localhost:3000/api/v1/consultations
```

## Using Real Consultation ID in Recording Test

### Option A: URL Parameter
Visit: `http://localhost:3001/dashboard/recording-test?consultationId=YOUR_REAL_ID`

### Option B: Input Field
1. Go to: `http://localhost:3001/dashboard/recording-test`
2. Enter the real consultation ID in the input field
3. Press Enter

## Testing Scenarios

### With Real Consultation ID:
- ✅ Tests real backend integration
- ✅ Tests actual S3 uploads
- ✅ Tests database recording metadata
- ✅ Full end-to-end validation

### With Test ID (Mock Mode):
- ✅ Tests frontend recording logic
- ✅ Tests IndexedDB persistence
- ✅ Tests refresh/crash recovery
- ✅ Tests UI state management

## Error Handling

The system will automatically detect:
- **Invalid consultation ID** → Switch to mock mode
- **Backend unavailable** → Switch to mock mode  
- **Database constraint errors** → Switch to mock mode

This ensures you can always test the recording functionality!
