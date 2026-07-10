import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { DataSource } from 'typeorm';

async function runTests() {
  console.log('--- Starting Integration Test Suite ---');
  
  // 1. Boot NestJS programmatically on port 3001
  const app = await NestFactory.create(AppModule, { logger: false });
  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalFilters(new HttpExceptionFilter());
  await app.listen(3001);
  console.log('✔ Test server booted on http://localhost:3001/api');

  const baseUrl = 'http://localhost:3001/api';
  let accessToken = '';
  let refreshToken = '';
  let serviceId = '';
  let bookingId = '';

  const testEmail = `test-manager-${Date.now()}@en2h.com`;
  const testPassword = 'Password123!';
  const testName = 'Test Manager';

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowDateStr = tomorrow.toISOString().split('T')[0];

  try {
    // --- 1. REGISTER MANAGER ---
    console.log('\nTesting: POST /auth/register');
    const registerRes = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail, password: testPassword, fullName: testName }),
    });
    console.log(`Status: ${registerRes.status}`);
    const registerJson = await registerRes.json();
    if (registerRes.status !== 201) throw new Error(`Registration failed: ${JSON.stringify(registerJson)}`);
    console.log('✔ Manager registered successfully');

    // --- 2. REGISTER CONFLICT ---
    console.log('\nTesting: POST /auth/register (Conflict)');
    const registerConflictRes = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail, password: testPassword, fullName: testName }),
    });
    console.log(`Status: ${registerConflictRes.status}`);
    const registerConflictJson = await registerConflictRes.json();
    if (registerConflictRes.status !== 409) throw new Error('Failed to block duplicate registration');
    console.log('✔ Correctly blocked duplicate registration (409 Conflict)');

    // --- 3. LOGIN ---
    console.log('\nTesting: POST /auth/login');
    const loginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail, password: testPassword }),
    });
    console.log(`Status: ${loginRes.status}`);
    const loginJson = await loginRes.json();
    if (loginRes.status !== 200) throw new Error(`Login failed: ${JSON.stringify(loginJson)}`);
    accessToken = loginJson.tokens.accessToken;
    refreshToken = loginJson.tokens.refreshToken;
    console.log('✔ Logged in successfully and saved tokens');

    // --- 4. CREATE SERVICE ---
    console.log('\nTesting: POST /services');
    const createServiceRes = await fetch(`${baseUrl}/services`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify({
        title: 'Spa Massage',
        description: 'Deep tissue relaxing massage',
        duration: 60,
        price: 85.50
      }),
    });
    console.log(`Status: ${createServiceRes.status}`);
    const createServiceJson = await createServiceRes.json();
    if (createServiceRes.status !== 201) throw new Error(`Service creation failed: ${JSON.stringify(createServiceJson)}`);
    serviceId = createServiceJson.id;
    console.log(`✔ Service created successfully with ID: ${serviceId}`);

    // --- 5. GET SERVICES (PUBLIC) ---
    console.log('\nTesting: GET /services (Public)');
    const getServicesRes = await fetch(`${baseUrl}/services`);
    console.log(`Status: ${getServicesRes.status}`);
    const getServicesJson = await getServicesRes.json();
    if (getServicesRes.status !== 200) throw new Error('Failed to fetch services publicly');
    console.log(`✔ Public services fetched successfully. Count: ${getServicesJson.data.length}`);

    // --- 6. CREATE BOOKING (PUBLIC) ---
    console.log('\nTesting: POST /bookings (Public)');
    const createBookingRes = await fetch(`${baseUrl}/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerName: 'Alice customer',
        customerEmail: 'alice@gmail.com',
        customerPhone: '+199999999',
        serviceId: serviceId,
        bookingDate: tomorrowDateStr,
        bookingTime: '10:00',
        notes: 'Prefers quiet room'
      }),
    });
    console.log(`Status: ${createBookingRes.status}`);
    const createBookingJson = await createBookingRes.json();
    if (createBookingRes.status !== 201) throw new Error(`Booking creation failed: ${JSON.stringify(createBookingJson)}`);
    bookingId = createBookingJson.id;
    console.log(`✔ Booking created successfully with ID: ${bookingId}`);

    // --- 7. PREVENT DUPLICATE BOOKING ---
    console.log('\nTesting: POST /bookings (Duplicate Slot Conflict)');
    const duplicateBookingRes = await fetch(`${baseUrl}/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerName: 'Duplicate customer',
        customerEmail: 'dup@gmail.com',
        customerPhone: '+188888888',
        serviceId: serviceId,
        bookingDate: tomorrowDateStr,
        bookingTime: '10:00'
      }),
    });
    console.log(`Status: ${duplicateBookingRes.status}`);
    const duplicateBookingJson = await duplicateBookingRes.json();
    if (duplicateBookingRes.status !== 409) throw new Error('Duplicate booking was not blocked');
    console.log('✔ Correctly blocked duplicate booking slot (409 Conflict)');

    // --- 8. PREVENT PAST BOOKINGS ---
    console.log('\nTesting: POST /bookings (Past Date validation)');
    const pastBookingRes = await fetch(`${baseUrl}/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerName: 'Past customer',
        customerEmail: 'past@gmail.com',
        customerPhone: '+177777777',
        serviceId: serviceId,
        bookingDate: '2020-01-01',
        bookingTime: '10:00'
      }),
    });
    console.log(`Status: ${pastBookingRes.status}`);
    const pastBookingJson = await pastBookingRes.json();
    if (pastBookingRes.status !== 400) throw new Error('Past booking was not blocked');
    console.log('✔ Correctly blocked booking in the past (400 Bad Request)');

    // --- 9. GET BOOKINGS (AUTH REQUIRED) ---
    console.log('\nTesting: GET /bookings (Auth Required)');
    const getBookingsRes = await fetch(`${baseUrl}/bookings`, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    console.log(`Status: ${getBookingsRes.status}`);
    const getBookingsJson = await getBookingsRes.json();
    if (getBookingsRes.status !== 200) throw new Error('Failed to fetch bookings as manager');
    console.log(`✔ Bookings list fetched successfully. Count: ${getBookingsJson.data.length}`);

    // --- 10. GET BOOKING BY ID (AUTH REQUIRED) ---
    console.log('\nTesting: GET /bookings/:id');
    const getBookingByIdRes = await fetch(`${baseUrl}/bookings/${bookingId}`, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    console.log(`Status: ${getBookingByIdRes.status}`);
    const getBookingByIdJson = await getBookingByIdRes.json();
    if (getBookingByIdRes.status !== 200) throw new Error('Failed to fetch single booking');
    console.log(`✔ Booking fetched by ID successfully. Customer: ${getBookingByIdJson.customerName}`);

    // --- 11. UPDATE STATUS (CONFIRMED) ---
    console.log('\nTesting: PATCH /bookings/:id/status (CONFIRMED)');
    const updateStatusRes = await fetch(`${baseUrl}/bookings/${bookingId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify({ status: 'CONFIRMED' })
    });
    console.log(`Status: ${updateStatusRes.status}`);
    const updateStatusJson = await updateStatusRes.json();
    if (updateStatusRes.status !== 200) throw new Error(`Status update failed: ${JSON.stringify(updateStatusJson)}`);
    console.log(`✔ Booking status successfully set to: ${updateStatusJson.status}`);

    // --- 12. CANCEL BOOKING ---
    console.log('\nTesting: PATCH /bookings/:id/cancel');
    const cancelRes = await fetch(`${baseUrl}/bookings/${bookingId}/cancel`, {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    console.log(`Status: ${cancelRes.status}`);
    const cancelJson = await cancelRes.json();
    if (cancelRes.status !== 200) throw new Error(`Cancellation failed: ${JSON.stringify(cancelJson)}`);
    console.log(`✔ Booking status successfully set to: ${cancelJson.status}`);

    // --- 13. PREVENT COMPLETING CANCELLED BOOKING ---
    console.log('\nTesting: PATCH /bookings/:id/status (Block Completed state on Cancelled bookings)');
    const completeCancelledRes = await fetch(`${baseUrl}/bookings/${bookingId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify({ status: 'COMPLETED' })
    });
    console.log(`Status: ${completeCancelledRes.status}`);
    const completeCancelledJson = await completeCancelledRes.json();
    if (completeCancelledRes.status !== 400) throw new Error('Allowed completing a cancelled booking');
    console.log('✔ Correctly blocked changing cancelled booking to completed (400 Bad Request)');

    // --- 14. REFRESH TOKEN ---
    console.log('\nTesting: POST /auth/refresh');
    const refreshRes = await fetch(`${baseUrl}/auth/refresh`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${refreshToken}` }
    });
    console.log(`Status: ${refreshRes.status}`);
    const refreshJson = await refreshRes.json();
    if (refreshRes.status !== 200) throw new Error(`Token refresh failed: ${JSON.stringify(refreshJson)}`);
    accessToken = refreshJson.accessToken;
    refreshToken = refreshJson.refreshToken;
    console.log('✔ Refreshed access tokens successfully');

    // --- 15. LOGOUT ---
    console.log('\nTesting: POST /auth/logout');
    const logoutRes = await fetch(`${baseUrl}/auth/logout`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    console.log(`Status: ${logoutRes.status}`);
    if (logoutRes.status !== 200) throw new Error('Logout failed');
    console.log('✔ Logged out successfully');

    // --- 16. PREVENT USING REFRESH TOKEN AFTER LOGOUT ---
    console.log('\nTesting: POST /auth/refresh (Revoked token verification)');
    const refreshPostLogoutRes = await fetch(`${baseUrl}/auth/refresh`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${refreshToken}` }
    });
    console.log(`Status: ${refreshPostLogoutRes.status}`);
    if (refreshPostLogoutRes.status !== 401) throw new Error('Allowed refreshing tokens after logout');
    console.log('✔ Correctly rejected revoked refresh token (401 Unauthorized)');

    console.log('\n-----------------------------------------');
    console.log('🎉 ALL INTEGRATION API TESTS PASSED! 🎉');
    console.log('-----------------------------------------');
  } catch (error) {
    console.error('\n❌ INTEGRATION TEST FAILED:', error);
  } finally {
    // --- 17. CLEANUP DATABASE ---
    console.log('\nCleaning up database test records...');
    const dataSource = app.get(DataSource);
    await dataSource.query(`DELETE FROM bookings WHERE id = $1`, [bookingId]);
    await dataSource.query(`DELETE FROM services WHERE id = $1`, [serviceId]);
    await dataSource.query(`DELETE FROM users WHERE email = $1`, [testEmail]);
    console.log('✔ Test data deleted successfully.');

    // Shutdown app
    await app.close();
    console.log('✔ Server shut down. Test runner finished.');
  }
}

runTests();
