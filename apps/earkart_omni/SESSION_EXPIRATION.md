# Session Expiration Handling

This document explains how the global session expiration feature works in the EarKart Omni Flutter app.

## Overview

When any API responds with a message field containing "Invalid or missing token", the app automatically shows a global dialog informing the user that their session has expired and they need to login again. The user can only logout and cannot perform any other actions until they login again.

## Components

### 1. SessionExpiredDialog (`lib/config/widgets/session_expired_dialog.dart`)
- A modal dialog that appears when session expires
- Cannot be dismissed by tapping outside or pressing back button
- Only allows the user to click "Login Again" button
- Provides haptic feedback when button is pressed

### 2. SessionManager (`lib/config/services/session_manager.dart`)
- Manages global session state
- Handles showing the session expired dialog
- Performs logout operations (clears patient and consultation sessions)
- Navigates to login screen and clears all routes

### 3. SessionInterceptor (`lib/config/services/session_interceptor.dart`)
- Dio interceptor that monitors all API responses
- Detects session expiration messages in both error and success responses
- Triggers session expiration handling when detected
- Prevents error propagation for session expiration cases

### 4. API Client (`lib/config/services/api_client.dart`)
- Updated to include the SessionInterceptor
- Automatically monitors all API calls for session expiration

## How It Works

1. **API Call Monitoring**: All API calls go through the Dio interceptor
2. **Message Detection**: The interceptor checks for specific messages in API responses:
   - "Invalid or missing token"
   - "Invalid token"
   - "Missing token"
   - "Token expired"
   - "Unauthorized"
3. **Case Insensitive**: Message matching is case-insensitive
4. **Global Dialog**: When detected, shows a non-dismissible dialog
5. **Forced Logout**: User can only logout and return to login screen

## Message Detection

The interceptor checks for session expiration messages in:
- Error responses (4xx, 5xx status codes)
- Success responses (2xx status codes) that contain error messages
- Both `message` and `Message` fields in response data

## Supported Message Patterns

```json
{
  "message": "Invalid or missing token"
}
```

```json
{
  "message": "Invalid token"
}
```

```json
{
  "message": "Token expired"
}
```

```json
{
  "message": "Unauthorized"
}
```

## User Experience

1. **Non-dismissible Dialog**: User cannot close the dialog by tapping outside or pressing back
2. **Single Action**: Only "Login Again" button is available
3. **Haptic Feedback**: Provides tactile feedback when button is pressed
4. **Automatic Navigation**: Automatically navigates to login screen and clears all routes
5. **Data Cleanup**: Clears all patient and consultation sessions

## Testing

Run the session expiration tests:
```bash
flutter test test/session_expiration_test.dart
```

## Integration

The feature is automatically integrated into the app through:
1. SessionManager context setup in `main.dart`
2. SessionInterceptor added to API client
3. Global dialog widget available throughout the app

## Error Handling

- Gracefully handles null response data
- Handles non-map response data
- Prevents multiple dialogs from showing simultaneously
- Cleans up context when app is disposed

## Security

- Forces user logout when session expires
- Prevents any further API calls until re-authentication
- Clears all local session data
- Ensures user must login again to continue 