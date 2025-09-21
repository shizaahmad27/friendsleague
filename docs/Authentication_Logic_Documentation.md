# Authentication Logic Implementation - Complete Documentation

**Project**: FriendsLeague  
**Version**: 1.0  
**Date**: January 2024  
**Author**: Development Team

---

## Table of Contents

1. [Overview](#overview)
2. [Database Schema](#database-schema)
3. [Backend Implementation](#backend-implementation)
4. [Frontend Implementation](#frontend-implementation)
5. [Authentication Flow](#authentication-flow)
6. [Security Features](#security-features)
7. [Token Management](#token-management)
8. [Error Handling](#error-handling)
9. [API Reference](#api-reference)
10. [Code Examples](#code-examples)

---

## Overview

The FriendsLeague app implements a comprehensive JWT-based authentication system that provides secure user registration, login, and session management. The system uses access tokens for API authentication and refresh tokens for seamless token renewal.

### Key Features
- **JWT-based Authentication** with access and refresh tokens
- **Secure Password Hashing** using bcryptjs
- **Automatic Token Refresh** with axios interceptors
- **Persistent Authentication State** using Zustand and AsyncStorage
- **Rate Limiting** on sign-in attempts
- **Input Validation** with class-validator
- **Online Status Management** integrated with authentication

---

## Database Schema

### User Model
```prisma
model User {
  id          String   @id @default(cuid())
  username    String   @unique
  email       String?  @unique
  phoneNumber String?  @unique
  password    String   // Hashed with bcryptjs
  avatar      String?
  inviteCode  String?  @unique
  isOnline    Boolean  @default(false)
  lastSeen    DateTime @default(now())
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relations
  friendships      Friendship[]       @relation("UserFriendships")
  friendOf         Friendship[]       @relation("FriendOf")
  sentInvitations  Invitation[]       @relation("Inviter")
  receivedInvitations Invitation[]    @relation("Invitee")
}
```

### Key Fields for Authentication
- **`password`**: Hashed using bcryptjs with salt rounds of 12
- **`isOnline`**: Tracks user's current online status
- **`lastSeen`**: Timestamp of last activity
- **`username`**: Unique identifier for login
- **`email`**: Optional unique identifier
- **`phoneNumber`**: Optional unique identifier

---

## Backend Implementation

### 1. Authentication Service (`auth.service.ts`)

#### Key Methods:

**`signUp(signUpDto: SignUpDto)`**
- Validates username and email uniqueness
- Hashes password with bcryptjs (12 salt rounds)
- Creates user in database
- Generates JWT tokens
- Returns user data (excluding password) with tokens

```typescript
async signUp(signUpDto: SignUpDto): Promise<AuthResponse> {
  const { username, email, phoneNumber, password } = signUpDto;

  // Check if user already exists
  const existingUser = await this.usersService.findByUsername(username);
  if (existingUser) {
    throw new ConflictException('Username already exists');
  }

  if (email) {
    const existingEmail = await this.usersService.findByEmail(email);
    if (existingEmail) {
      throw new ConflictException('Email already exists');
    }
  }

  // Create user (password is hashed in usersService.create)
  const user = await this.usersService.create({
    username,
    email,
    phoneNumber,
    password,
  });

  // Generate tokens
  const tokens = await this.generateTokens(user.id, username);

  return {
    user,
    ...tokens,
  };
}
```

**`signIn(signInDto: SignInDto)`**
- Validates username and password
- Updates user's online status
- Generates JWT tokens
- Returns user data with tokens

```typescript
async signIn(signInDto: SignInDto): Promise<AuthResponse> {
  const { username, password } = signInDto;

  // Find user
  const user = await this.usersService.findByUsername(username);
  if (!user) {
    throw new UnauthorizedException('Invalid credentials');
  }

  // Validate password
  const isPasswordValid = await this.usersService.validatePassword(password, user.password);
  if (!isPasswordValid) {
    throw new UnauthorizedException('Invalid credentials');
  }

  // Update online status
  await this.usersService.updateOnlineStatus(user.id, true);

  // Generate tokens
  const tokens = await this.generateTokens(user.id, username);

  // Return user without password
  const { password: _, ...userWithoutPassword } = user;

  return {
    user: userWithoutPassword,
    ...tokens,
  };
}
```

**`refreshToken(refreshTokenDto: RefreshTokenDto)`**
- Validates refresh token
- Generates new access token
- Maintains user session

```typescript
async refreshToken(refreshTokenDto: RefreshTokenDto): Promise<{ accessToken: string }> {
  try {
    // Verify refresh token
    const payload = this.jwtService.verify(refreshTokenDto.refreshToken);

    const user = await this.usersService.findById(payload.sub);
    if (!user) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Generate new access token
    const accessToken = this.jwtService.sign(
      { sub: user.id, username: user.username },
      { 
        expiresIn: process.env.JWT_EXPIRES_IN || '15m',
      }
    );

    return { accessToken };
  } catch (error) {
    throw new UnauthorizedException('Invalid refresh token');
  }
}
```

**`logout(userId: string)`**
- Updates user's online status to offline
- Updates lastSeen timestamp
- Future: Token blacklisting and Redis cleanup

### 2. Authentication Controller (`auth.controller.ts`)

#### Endpoints:

```typescript
@Controller('auth')
export class AuthController {
  @Post('signup')           // User registration
  @Post('signin')           // User login (with rate limiting)
  @Post('refresh')          // Token refresh
  @Post('logout')           // User logout (protected)
  @Post('test-token')       // Token validation (development)
}
```

#### Rate Limiting:
- **Sign-in**: 5 attempts per minute
- **Other endpoints**: No rate limiting

### 3. JWT Authentication Guard (`jwt-auth.guard.ts`)

#### Key Features:
- Extracts Bearer token from Authorization header
- Validates token using JWT service
- Sets user context on request object
- Handles token verification errors

```typescript
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);
    
    if (!token) {
      throw new UnauthorizedException('No token provided');
    }

    try {
      const payload = this.jwtService.verify(token);
      // Set user context
      request.user = {
        id: payload.sub,
        username: payload.username,
        ...payload,
      };
      return true;
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }

  private extractTokenFromHeader(request: any): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
```

### 4. Data Transfer Objects (DTOs)

#### SignUpDto
```typescript
export class SignUpDto {
  @IsString()
  @MinLength(3)
  username: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @IsString()
  @MinLength(8)
  password: string;
}
```

#### SignInDto
```typescript
export class SignInDto {
  @IsString()
  username: string;

  @IsString()
  password: string;
}
```

#### RefreshTokenDto
```typescript
export class RefreshTokenDto {
  @IsString()
  refreshToken: string;
}
```

---

## Frontend Implementation

### 1. Authentication Store (`authStore.ts`)

#### State Management with Zustand:
```typescript
interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

interface AuthActions {
  setAuth: (authData: AuthResponse) => void;
  setUser: (user: User) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  logout: () => void;
  clearError: () => void;
}
```

#### Key Features:
- **Persistent Storage**: Uses AsyncStorage for token persistence
- **State Management**: Centralized authentication state
- **Type Safety**: Full TypeScript support
- **Actions**: Clean API for state updates

### 2. API Service (`api.ts`)

#### Axios Configuration:
```typescript
const api = axios.create({
  baseURL: __DEV__ 
    ? 'http://192.168.0.110:3000/api'  
    : 'https://api.friendsleague.com/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});
```

#### Request Interceptor:
- Automatically adds Bearer token to all requests
- Uses current access token from auth store

#### Response Interceptor:
- Handles 401 errors automatically
- Attempts token refresh on authentication failure
- Retries original request with new token
- Logs out user if refresh fails

```typescript
// Response interceptor for automatic token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const { refreshToken, setAuth, logout } = useAuthStore.getState();
        
        if (refreshToken) {
          const response = await axios.post(`${api.defaults.baseURL}/auth/refresh`, {
            refreshToken,
          });
          
          const { accessToken } = response.data;
          
          // Update auth store with new token
          const currentState = useAuthStore.getState();
          if (currentState.user && currentState.refreshToken) {
            setAuth({
              user: currentState.user,
              accessToken,
              refreshToken: currentState.refreshToken,
            });
          }
          
          // Retry original request
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return api(originalRequest);
        } else {
          useAuthStore.getState().logout();
        }
      } catch (refreshError) {
        useAuthStore.getState().logout();
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);
```

### 3. Screen Components

#### SignInScreen (`SignInScreen.tsx`)
**Purpose**: User authentication interface

**Key Features**:
- **Form Validation**: Client-side validation before API call
- **Loading States**: Visual feedback during authentication
- **Error Handling**: User-friendly error messages
- **Navigation**: Automatic redirect to SignUp screen

**State Management**:
```typescript
const [formData, setFormData] = useState<SignInData>({
  username: '',
  password: '',
});
const [isLoading, setIsLoading] = useState(false);
```

**Key Functions**:
- `handleSignIn()`: Processes sign-in form submission
- Form validation and error handling
- API call with loading states

#### SignUpScreen (`SignUpScreen.tsx`)
**Purpose**: User registration interface

**Key Features**:
- **Comprehensive Form**: Username, email, phone, password fields
- **Password Confirmation**: Client-side password matching
- **Validation**: Minimum length and format requirements
- **Optional Fields**: Email and phone number are optional

**State Management**:
```typescript
const [formData, setFormData] = useState<SignUpData>({
  username: '',
  email: '',
  phoneNumber: '',
  password: '',
});
const [confirmPassword, setConfirmPassword] = useState('');
const [isLoading, setIsLoading] = useState(false);
```

**Key Functions**:
- `handleSignUp()`: Processes sign-up form submission
- Password confirmation validation
- Comprehensive form validation

### 4. Navigation (`AppNavigator.tsx`)

#### Authentication-based Routing:
```typescript
export default function AppNavigator() {
  const { isAuthenticated } = useAuthStore();

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          // Authenticated screens
          <>
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="Profile" component={ProfileScreen} />
            <Stack.Screen name="Leagues" component={LeaguesScreen} />
            <Stack.Screen name="Friends" component={FriendsScreen} />
            <Stack.Screen name="ActiveFriends" component={ActiveFriendsScreen} />
            <Stack.Screen name="Events" component={EventsScreen} />
            <Stack.Screen name="InviteCode" component={InviteCodeScreen} />
          </>
        ) : (
          // Unauthenticated screens
          <>
            <Stack.Screen name="SignIn" component={SignInScreen} />
            <Stack.Screen name="SignUp" component={SignUpScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
```

### 5. Type Definitions

#### User Interface
```typescript
export interface User {
  id: string;
  username: string;
  email?: string;
  phoneNumber?: string;
  avatar?: string;
  isOnline: boolean;
  lastSeen: string;
  createdAt: string;
  updatedAt: string;
}
```

#### Authentication Response
```typescript
export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}
```

#### Form Data Interfaces
```typescript
export interface SignUpData {
  username: string;
  email?: string;
  phoneNumber?: string;
  password: string;
}

export interface SignInData {
  username: string;
  password: string;
}
```

---

## Authentication Flow

### 1. User Registration Flow
```
User fills sign-up form
    ↓
Client-side validation
    ↓
API call to /auth/signup
    ↓
Backend validates data
    ↓
Password hashed with bcryptjs
    ↓
User created in database
    ↓
JWT tokens generated
    ↓
User data + tokens returned
    ↓
Auth store updated
    ↓
User redirected to main app
```

### 2. User Login Flow
```
User fills sign-in form
    ↓
Client-side validation
    ↓
API call to /auth/signin
    ↓
Backend validates credentials
    ↓
Password verified with bcryptjs
    ↓
User online status updated
    ↓
JWT tokens generated
    ↓
User data + tokens returned
    ↓
Auth store updated
    ↓
User redirected to main app
```

### 3. Token Refresh Flow
```
API request with expired token
    ↓
Backend returns 401 Unauthorized
    ↓
Axios interceptor catches error
    ↓
Refresh token sent to /auth/refresh
    ↓
New access token generated
    ↓
Auth store updated with new token
    ↓
Original request retried with new token
    ↓
Request completes successfully
```

### 4. Logout Flow
```
User initiates logout
    ↓
API call to /auth/logout
    ↓
Backend updates user status
    ↓
Auth store cleared
    ↓
User redirected to sign-in screen
```

---

## Security Features

### 1. Password Security
- **Hashing**: bcryptjs with 12 salt rounds
- **Minimum Length**: 8 characters required
- **Validation**: Server-side validation with class-validator
- **No Plain Text**: Passwords never stored in plain text

### 2. Token Security
- **JWT Tokens**: Signed with secret key
- **Short Expiry**: Access tokens expire in 15 minutes
- **Refresh Tokens**: Long-lived (7 days) for seamless renewal
- **Secure Storage**: Tokens stored in AsyncStorage (encrypted on device)

### 3. Input Validation
- **Client-side**: Immediate feedback for user experience
- **Server-side**: Comprehensive validation with class-validator
- **Sanitization**: Input sanitization before processing
- **Rate Limiting**: Prevents brute force attacks

### 4. Session Management
- **Automatic Refresh**: Seamless token renewal
- **Logout Handling**: Proper session cleanup
- **Online Status**: Integrated with authentication state
- **Error Handling**: Graceful handling of authentication failures

---

## Token Management

### 1. Token Generation
```typescript
private async generateTokens(userId: string, username: string): Promise<{ accessToken: string; refreshToken: string }> {
  const payload = { sub: userId, username };

  const [accessToken, refreshToken] = await Promise.all([
    this.jwtService.signAsync(payload, {
      expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    }),
    this.jwtService.signAsync(payload, {
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    }),
  ]);

  return { accessToken, refreshToken };
}
```

### 2. Token Validation
- **Access Tokens**: Validated on every protected request
- **Refresh Tokens**: Validated during token refresh
- **Expiry Handling**: Automatic refresh before expiration
- **Error Handling**: Graceful fallback to login

### 3. Token Storage
- **Persistent Storage**: AsyncStorage for app restarts
- **Memory Storage**: Zustand store for runtime access
- **Secure Access**: Tokens only accessible through auth store
- **Automatic Cleanup**: Tokens cleared on logout

---

## Error Handling

### Backend Error Handling
- **Validation Errors**: Detailed field-specific messages
- **Authentication Errors**: Generic "Invalid credentials" message
- **Conflict Errors**: Specific messages for duplicate data
- **HTTP Status Codes**: Appropriate status codes for different errors

### Frontend Error Handling
- **User-friendly Messages**: Clear, actionable error messages
- **Loading States**: Visual feedback during operations
- **Network Errors**: Graceful handling of connectivity issues
- **Token Errors**: Automatic refresh or logout on token issues

### Common Error Scenarios
1. **Invalid Credentials**: Clear message, no specific field indication
2. **Username Already Exists**: Specific field error
3. **Email Already Exists**: Specific field error
4. **Network Errors**: Retry mechanism with user feedback
5. **Token Expiry**: Automatic refresh with fallback to login

---

## API Reference

### Authentication Endpoints

| Method | Endpoint | Description | Auth Required | Rate Limited |
|--------|----------|-------------|---------------|--------------|
| POST | `/auth/signup` | User registration | No | No |
| POST | `/auth/signin` | User login | No | Yes (5/min) |
| POST | `/auth/refresh` | Token refresh | No | No |
| POST | `/auth/logout` | User logout | Yes | No |
| POST | `/auth/test-token` | Token validation | No | No |

### Request/Response Examples

#### Sign Up Request
```json
POST /auth/signup
{
  "username": "johndoe",
  "email": "john@example.com",
  "phoneNumber": "+1234567890",
  "password": "securepassword123"
}
```

#### Sign Up Response
```json
{
  "user": {
    "id": "clx1234567890",
    "username": "johndoe",
    "email": "john@example.com",
    "phoneNumber": "+1234567890",
    "avatar": null,
    "isOnline": true,
    "lastSeen": "2024-01-15T10:30:00.000Z",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### Sign In Request
```json
POST /auth/signin
{
  "username": "johndoe",
  "password": "securepassword123"
}
```

#### Token Refresh Request
```json
POST /auth/refresh
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### Token Refresh Response
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

## Code Examples

### Backend: Password Hashing
```typescript
// In users.service.ts
async create(createUserDto: CreateUserDto): Promise<UserWithoutPassword> {
  const { username, email, phoneNumber, password } = createUserDto;
  
  // Hash password with bcryptjs
  const hashedPassword = await bcrypt.hash(password, 12);
  
  const user = await this.prisma.user.create({
    data: {
      username,
      email: normalizedEmail,
      phoneNumber: normalizedPhoneNumber,
      password: hashedPassword,
    },
  });

  // Return user without password
  const { password: _, ...userWithoutPassword } = user;
  return userWithoutPassword;
}
```

### Frontend: Authentication State Management
```typescript
// In authStore.ts
export const useAuthStore = create<AuthState & AuthActions>((set) => ({
  // State
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  // Actions
  setAuth: (authData: AuthResponse) =>
    set({
      user: authData.user,
      accessToken: authData.accessToken,
      refreshToken: authData.refreshToken,
      isAuthenticated: true,
      error: null,
    }),

  logout: () =>
    set({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      error: null,
    }),
}));
```

### Frontend: Form Handling
```typescript
// In SignInScreen.tsx
const handleSignIn = async () => {
  if (!formData.username || !formData.password) {
    Alert.alert('Error', 'Please fill in all fields');
    return;
  }

  try {
    setIsLoading(true);
    clearError();
    
    const authData = await authApi.signIn(formData);
    setAuth(authData);
    
    // Navigation handled by AppNavigator based on auth state
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || 'Sign in failed';
    setError(errorMessage);
    Alert.alert('Error', errorMessage);
  } finally {
    setIsLoading(false);
  }
};
```

### Backend: JWT Guard Implementation
```typescript
// In jwt-auth.guard.ts
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);
    
    if (!token) {
      throw new UnauthorizedException('No token provided');
    }

    try {
      const payload = this.jwtService.verify(token);
      request.user = {
        id: payload.sub,
        username: payload.username,
        ...payload,
      };
      return true;
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }
}
```

---

## Environment Configuration

### Backend Environment Variables
```env
# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Database
DATABASE_URL=postgresql://username:password@localhost:5432/friendsleague

# Server
PORT=3000
NODE_ENV=development
```

### Frontend Configuration
```typescript
// In api.ts
const api = axios.create({
  baseURL: __DEV__ 
    ? 'http://192.168.0.110:3000/api'  // Development
    : 'https://api.friendsleague.com/api',  // Production
  timeout: 10000,
});
```

---

## Conclusion

This authentication system provides a robust, secure, and user-friendly foundation for the FriendsLeague application. The implementation follows security best practices with JWT tokens, secure password hashing, automatic token refresh, and comprehensive error handling. The system is designed to scale and provides a solid foundation for user management and session handling.

### Key Strengths
- **Security**: bcryptjs hashing, JWT tokens, input validation
- **User Experience**: Automatic token refresh, persistent sessions
- **Scalability**: Clean architecture, modular design
- **Maintainability**: TypeScript, clear separation of concerns
- **Error Handling**: Comprehensive error management

---

**Document Information**
- **Last Updated**: January 2024
- **Version**: 1.0
- **Status**: Complete
- **Review Required**: Yes
