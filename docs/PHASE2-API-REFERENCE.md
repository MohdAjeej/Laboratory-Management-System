# Phase 2 API Reference - Master Data Management

**Base URL:** `/api`  
**Authentication:** Required (Bearer token)  
**Authorization:** RBAC with permission checks

## Quick Reference

| Endpoint | Methods | Permission | Description |
|----------|---------|------------|-------------|
| `/hospitals` | GET, POST | READ_HOSPITAL, CREATE_HOSPITAL | List and create hospitals |
| `/hospitals/[id]` | GET, PUT, DELETE | READ/UPDATE/DELETE_HOSPITAL | Individual hospital operations |
| `/doctors` | GET, POST | READ_DOCTOR, CREATE_DOCTOR | List and create doctors |
| `/doctors/[id]` | GET, PUT, DELETE | READ/UPDATE/DELETE_DOCTOR | Individual doctor operations |
| `/tests` | GET, POST | READ_TEST, CREATE_TEST | List and create tests |
| `/tests/[id]` | GET, PUT, DELETE | READ/UPDATE/DELETE_TEST | Individual test operations |
| `/test-packages` | GET, POST | READ_TEST, CREATE_TEST | List and create packages |
| `/test-packages/[id]` | GET, PUT, DELETE | READ/UPDATE/DELETE_TEST | Individual package operations |
| `/patients` | GET, POST | READ_PATIENT, CREATE_PATIENT | List and create patients |
| `/patients/[id]` | GET, PUT, DELETE | READ/UPDATE/DELETE_PATIENT | Individual patient operations |

## Common Query Parameters

All list endpoints support:
- `page` (default: 1, min: 1)
- `limit` (default: 20, min: 1, max: 100)
- `search` (multi-field text search)
- `isActive` (true/false filter)
- `sort` (field name, default varies)
- `order` (asc/desc, default varies)

## Response Format

### Success (200/201)
```json
{
  "success": true,
  "data": { /* entity or array */ },
  "pagination": { /* if list endpoint */ }
}
```

### Error (400/401/403/404/409/500)
```json
{
  "error": "Error message",
  "details": [ /* optional validation errors */ ]
}
```

## Hospitals API

### List Hospitals
```
GET /api/hospitals?page=1&limit=20&search=city&isActive=true&sort=name&order=asc
```

**Permission:** `READ_HOSPITAL`

**Response:**
```json
{
  "success": true,
  "data": {
    "hospitals": [
      {
        "_id": "...",
        "hospitalId": "HSP-2026-000001",
        "name": "City General Hospital",
        "code": "CGH",
        "email": "contact@citygeneral.com",
        "phone": "02212345678",
        "address": { /* ... */ },
        "isActive": true,
        "createdAt": "...",
        "updatedAt": "..."
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 3,
      "pages": 1
    }
  }
}
```

### Create Hospital
```
POST /api/hospitals
Content-Type: application/json
```

**Permission:** `CREATE_HOSPITAL`

**Request Body:**
```json
{
  "name": "New Hospital",
  "code": "NH",
  "registrationNumber": "REG004",
  "contactPerson": "Dr. Manager",
  "phone": "02212345681",
  "email": "contact@newhospital.com",
  "address": {
    "street": "123 Street",
    "city": "Mumbai",
    "state": "Maharashtra",
    "zipCode": "400001",
    "country": "India"
  },
  "creditLimit": 100000,
  "billingTerms": "30 days"
}
```

**Required Fields:** name, code, email, phone, address

**Validation:**
- code: 2-10 uppercase alphanumeric
- email: valid email format
- phone: 10-15 digits
- address: all subfields required

**Response:** 201 with created hospital

### Get Hospital
```
GET /api/hospitals/[id]
```

**Permission:** `READ_HOSPITAL`

### Update Hospital
```
PUT /api/hospitals/[id]
Content-Type: application/json
```

**Permission:** `UPDATE_HOSPITAL`

**Request Body:** Partial fields allowed

### Deactivate Hospital
```
DELETE /api/hospitals/[id]
```

**Permission:** `DELETE_HOSPITAL`

**Checks:** Existing orders  
**Response:** 409 if orders exist, 200 if successful

## Doctors API

### List Doctors
```
GET /api/doctors?page=1&limit=20&search=smith&hospitalId=xxx&specialization=cardiology&isActive=true&sort=lastName&order=asc
```

**Permission:** `READ_DOCTOR`

**Additional Filters:**
- `hospitalId`: Filter by hospital
- `specialization`: Filter by specialization

**Response:** Includes populated `hospitalIds` with name and code

### Create Doctor
```
POST /api/doctors
Content-Type: application/json
```

**Permission:** `CREATE_DOCTOR`

**Request Body:**
```json
{
  "firstName": "Dr. John",
  "lastName": "Smith",
  "registrationNumber": "MED005",
  "specialization": "Cardiology",
  "phone": "9876543220",
  "email": "john.smith@example.com",
  "hospitalIds": ["hospital_id_1", "hospital_id_2"]
}
```

**Required Fields:** firstName, lastName, registrationNumber, specialization, phone, hospitalIds

**Validation:**
- registrationNumber: unique
- phone: 10-15 digits
- hospitalIds: must exist, min 1

### Get Doctor
```
GET /api/doctors/[id]
```

**Permission:** `READ_DOCTOR`

**Response:** Includes populated hospitals

### Update Doctor
```
PUT /api/doctors/[id]
```

**Permission:** `UPDATE_DOCTOR`

**Validation:** Checks hospital IDs if updated

### Deactivate Doctor
```
DELETE /api/doctors/[id]
```

**Permission:** `DELETE_DOCTOR`

**Checks:** Existing orders

## Tests API

### List Tests
```
GET /api/tests?page=1&limit=20&search=blood&category=Hematology&department=Pathology&sampleType=Blood&isActive=true&sort=name&order=asc
```

**Permission:** `READ_TEST`

**Additional Filters:**
- `category`: Filter by category
- `department`: Filter by department
- `sampleType`: Filter by sample type

**Response:** Includes `filters` object with available categories, departments, sampleTypes

### Create Test
```
POST /api/tests
Content-Type: application/json
```

**Permission:** `CREATE_TEST`

**Request Body:**
```json
{
  "name": "New Blood Test",
  "code": "NBT001",
  "category": "Hematology",
  "department": "Pathology",
  "sampleType": "Blood",
  "price": 500,
  "turnaroundTime": 24,
  "parameters": [
    {
      "name": "Hemoglobin",
      "unit": "g/dL",
      "referenceRange": { "min": 12.0, "max": 15.0 },
      "displayOrder": 1,
      "isActive": true
    }
  ]
}
```

**Required Fields:** name, code, category, department, sampleType, price, turnaroundTime, parameters (min 1)

**Validation:**
- code: 2-20 uppercase alphanumeric, unique
- price: ≥ 0
- turnaroundTime: ≥ 1
- parameters: array with at least one item

### Get Test
```
GET /api/tests/[id]
```

**Permission:** `READ_TEST`

### Update Test
```
PUT /api/tests/[id]
```

**Permission:** `UPDATE_TEST`

### Deactivate Test
```
DELETE /api/tests/[id]
```

**Permission:** `DELETE_TEST`

**Checks:** Orders referencing this test

## Test Packages API

### List Packages
```
GET /api/test-packages?page=1&limit=20&search=health&category=Wellness&isActive=true&sort=name&order=asc
```

**Permission:** `READ_TEST`

**Additional Filters:**
- `category`: Filter by category

**Response:** Includes populated `tests.testId` with test details

### Create Package
```
POST /api/test-packages
Content-Type: application/json
```

**Permission:** `CREATE_TEST`

**Request Body:**
```json
{
  "name": "Executive Health Checkup",
  "code": "EXE001",
  "description": "Comprehensive health screening",
  "category": "Wellness",
  "price": 5000,
  "tests": [
    { "testId": "test_id_1" },
    { "testId": "test_id_2" },
    { "testId": "test_id_3" }
  ]
}
```

**Required Fields:** name, code, price, tests (min 1)

**Validation:**
- code: 2-20 uppercase alphanumeric, unique
- price: ≥ 0
- tests: all testIds must exist

### Get Package
```
GET /api/test-packages/[id]
```

**Permission:** `READ_TEST`

**Response:** Includes populated test details

### Update Package
```
PUT /api/test-packages/[id]
```

**Permission:** `UPDATE_TEST`

**Validation:** Checks test IDs if updated

### Deactivate Package
```
DELETE /api/test-packages/[id]
```

**Permission:** `DELETE_TEST`

## Patients API

### List Patients
```
GET /api/patients?page=1&limit=20&search=patel&isActive=true&sort=lastName&order=asc
```

**Permission:** `READ_PATIENT`

### Create Patient (Enhanced Duplicate Detection)
```
POST /api/patients
Content-Type: application/json
```

**Permission:** `CREATE_PATIENT`

**Request Body:**
```json
{
  "firstName": "Raj",
  "lastName": "Patel",
  "dateOfBirth": "1985-03-15",
  "gender": "MALE",
  "phone": "9876543208",
  "email": "raj.patel@example.com",
  "address": {
    "street": "101 Patient Street",
    "city": "Mumbai",
    "state": "Maharashtra",
    "zipCode": "400001",
    "country": "India"
  }
}
```

**Required Fields:** firstName, lastName, dateOfBirth, gender, phone, address

**Validation:**
- phone: 10-15 digits
- email: valid format (optional)
- gender: MALE/FEMALE/OTHER
- dateOfBirth: valid date, age 0-150
- address: all subfields required

**Duplicate Detection:**
Returns 409 if potential duplicates found:

```json
{
  "error": "Possible duplicate patient(s) found",
  "warning": "Please review the following potential matches...",
  "potentialMatches": [
    {
      "confidence": "HIGH",
      "reason": "Phone number match",
      "patient": {
        "patientId": "PAT-2026-000001",
        "name": "Raj Patel",
        "phone": "9876543208",
        "email": "raj.patel@example.com",
        "dateOfBirth": "1985-03-15T00:00:00.000Z"
      }
    }
  ],
  "action": "If this is a new patient, you can force creation by adding ?force=true"
}
```

**Confidence Levels:**
- **HIGH**: Exact phone or email match
- **MEDIUM**: Name + date of birth match

### Get Patient
```
GET /api/patients/[id]?history=true
```

**Permission:** `READ_PATIENT`

**Query Params:**
- `history`: Include recent orders and reports (optional)

**Response:** Patient with optional history

### Update Patient
```
PUT /api/patients/[id]
```

**Permission:** `UPDATE_PATIENT`

### Deactivate Patient
```
DELETE /api/patients/[id]
```

**Permission:** `DELETE_PATIENT`

**Checks:** Existing orders or reports  
**Response:** 409 if references exist with counts

## Error Codes

| Code | Meaning | When |
|------|---------|------|
| 400 | Bad Request | Validation failed |
| 401 | Unauthorized | Not authenticated |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Entity doesn't exist |
| 409 | Conflict | Duplicate or reference exists |
| 500 | Server Error | Internal error |

## Common Errors

### Validation Failed (400)
```json
{
  "error": "Validation failed",
  "details": [
    { "field": "email", "message": "Valid email address is required" }
  ]
}
```

### Duplicate Found (409)
```json
{
  "error": "Hospital with this code already exists"
}
```

### Cannot Deactivate (409)
```json
{
  "error": "Cannot deactivate hospital with existing orders",
  "details": { "orderCount": 15 }
}
```

### Not Found (404)
```json
{
  "error": "Hospital not found"
}
```

### Permission Denied (403)
```json
{
  "error": "Insufficient permissions"
}
```

## Testing Examples

### cURL Examples

```bash
# List hospitals
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:3000/api/hospitals?page=1&limit=10"

# Create hospital
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Hospital","code":"TH","email":"test@hospital.com","phone":"1234567890","address":{"street":"123 St","city":"Mumbai","state":"MH","zipCode":"400001","country":"India"}}' \
  "http://localhost:3000/api/hospitals"

# Update hospital
curl -X PUT \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Updated Hospital Name"}' \
  "http://localhost:3000/api/hospitals/HOSPITAL_ID"

# Deactivate hospital
curl -X DELETE \
  -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:3000/api/hospitals/HOSPITAL_ID"
```

---

**Last Updated:** October 8, 2026  
**Version:** 1.0  
**Status:** Production Ready
