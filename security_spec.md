# Security Specification — Wedding RSVP App

## Data Invariants
1. Guests do not need to be authenticated to submit their RSVP.
2. An RSVP can only be created with appropriate schema validation (correct field types, boundaries on guests between 0 and 10, messages no longer than 300 characters, name no longer than 100 characters).
3. The server timestamp `submittedAt` must match `request.time` exactly.
4. Existing RSVPs are strictly read-only and immutable. No update or delete operations are permitted from the client.
5. Querying (listing) is only allowed for the purpose of checking duplicates with a strict query limit of 1.

## The "Dirty Dozen" Payloads
The following payloads should be rejected by the security rules:

1. **Missing Required Fields on Create**
   ```json
   {
     "name": "Maria"
   }
   ```
2. **Invalid Guest Count (Too High)**
   ```json
   {
     "name": "João Silva",
     "phone": "+244923456789",
     "attending": "yes",
     "guests": 15,
     "submittedAt": "request.time"
   }
   ```
3. **Invalid Guest Count (Negative)**
   ```json
   {
     "name": "João Silva",
     "phone": "+244923456789",
     "attending": "yes",
     "guests": -1,
     "submittedAt": "request.time"
   }
   ```
4. **Invalid Attending Value**
   ```json
   {
     "name": "João Silva",
     "phone": "+244923456789",
     "attending": "maybe",
     "guests": 0,
     "submittedAt": "request.time"
   }
   ```
5. **Name Too Long (Junk Data Injection)**
   ```json
   {
     "name": "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
     "phone": "+244923456789",
     "attending": "yes",
     "guests": 1,
     "submittedAt": "request.time"
   }
   ```
6. **Phone Too Long**
   ```json
   {
     "name": "João Silva",
     "phone": "1234567890123456789012345678901",
     "attending": "yes",
     "guests": 1,
     "submittedAt": "request.time"
   }
   ```
7. **Message Too Long**
   ```json
   {
     "name": "João Silva",
     "phone": "+244923456789",
     "attending": "yes",
     "guests": 1,
     "message": "A".repeat(301),
     "submittedAt": "request.time"
   }
   ```
8. **Client Tampered Timestamp**
   ```json
   {
     "name": "João Silva",
     "phone": "+244923456789",
     "attending": "yes",
     "guests": 1,
     "submittedAt": "2026-06-06T11:23:45Z"
   }
   ```
9. **Attempt to Update (Write Blocked)**
   ```json
   {
     "name": "João Silva Altered",
     "phone": "+244923456789",
     "attending": "no",
     "guests": 0,
     "submittedAt": "request.time"
   }
   ```
10. **Attempt to Delete (Write Blocked)**
    ```json
    {}
    ```
11. **Abusive Bulk Listing Query**
    ```json
    {}
    ```
12. **Malicious Document ID Injection**
    ```json
    {
      "name": "João Silva",
      "phone": "+244923456789",
      "attending": "yes",
      "guests": 1,
      "submittedAt": "request.time"
    }
    ```
