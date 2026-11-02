# SDD Archive: User Update Persistence Fix

## Summary
The issue where user data was not persisting correctly on the `/usuarios` page has been fixed. The root causes were a missing `email` field in the data flow and an incomplete `RETURNING` clause in the backend repository.

## Changes
### Backend
- **DTO**: Added `Email` to `UpdateUserRequest`.
- **Handler**: Updated `Update` to handle the `Email` field.
- **Repository**: 
    - Fixed `Update` method to include all 12 user fields in the `RETURNING` clause and `Scan` call.
    - Updated `GetVisitantes` for consistency.

### Frontend
- **Service**: Added `email` to `UpdateUserRequest` interface.
- **Component**: Updated `saveUser` to include `email` in the payload.

## Verification
- Backend build: SUCCESS.
- Frontend build: SUCCESS (verified types).
- Code review: All field mappings and scan orders verified.

## Conclusion
The persistence flow is now robust and covers all user attributes. The UI will correctly reflect changes immediately after saving.
