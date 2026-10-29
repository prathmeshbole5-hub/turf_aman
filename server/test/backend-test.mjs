/**
 * TURFZONE Backend Verification Test Suite
 * Tests authentication, double-booking rejection, authoritative pricing,
 * slot availability, Razorpay payment verification, and admin controls.
 */

const BASE_URL = 'http://localhost:5000';

async function runTests() {
  console.log('🚀 Starting TURFZONE Backend Verification Suite...\n');
  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  // 1. Healthcheck
  console.log('--- TEST 1: API Server Health ---');
  try {
    const res = await fetch(`${BASE_URL}/api/health`);
    const data = await res.json();
    assert(res.status === 200, 'Health endpoint returns HTTP 200');
    assert(data.status === 'ONLINE', 'Platform status is ONLINE');
  } catch (err) {
    assert(false, `Healthcheck failed: ${err.message}`);
  }

  // 2. Authentication (Customer Registration & Admin Login)
  console.log('\n--- TEST 2: Authentication & Hashing ---');
  let customerToken = '';
  let adminToken = '';

  try {
    const uniqueEmail = `test.player.${Date.now()}_${Math.floor(Math.random()*1000)}@example.com`;
    const regRes = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Sunil Chhetri',
        email: uniqueEmail,
        phone: `91${Math.floor(10000000 + Math.random() * 90000000)}`,
        password: 'Pass@123Strong',
      }),
    });
    const regData = await regRes.json();
    assert(regRes.status === 201, 'Customer registration returns HTTP 201');
    assert(Boolean(regData.token), 'Registration issues valid JWT');
    assert(regData.user.role === 'CUSTOMER', 'Default assigned role is CUSTOMER');
    customerToken = regData.token;

    // Login Admin
    const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        emailOrPhone: 'admin@turfzone.com',
        password: 'TurfZone@2026!Admin',
      }),
    });
    const loginData = await loginRes.json();
    assert(loginRes.status === 200, 'Admin login returns HTTP 200');
    assert(loginData.user.role === 'ADMIN', 'Admin role verified in token payload');
    adminToken = loginData.token;
  } catch (err) {
    assert(false, `Authentication test failed: ${err.message}`);
  }

  // 3. Role-Based Access Control (RBAC)
  console.log('\n--- TEST 3: RBAC & Admin Protection ---');
  try {
    const unauthRes = await fetch(`${BASE_URL}/api/admin/overview`);
    assert(unauthRes.status === 401, 'Anonymous request to admin API rejected with HTTP 401');

    const customerAttempt = await fetch(`${BASE_URL}/api/admin/overview`, {
      headers: { Authorization: `Bearer ${customerToken}` },
    });
    assert(customerAttempt.status === 403, 'Customer role accessing admin API rejected with HTTP 403');

    const adminAccess = await fetch(`${BASE_URL}/api/admin/overview`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(adminAccess.status === 200, 'Admin token successfully accesses admin overview');
  } catch (err) {
    assert(false, `RBAC test failed: ${err.message}`);
  }

  // Unique date for repeatable slot tests
  const testDate = new Date(Date.now() + (Math.floor(100 + Math.random() * 800) * 86400000)).toISOString().split('T')[0];

  // 4. Authoritative Pricing Calculation
  console.log('\n--- TEST 4: Authoritative Backend Pricing ---');
  try {
    const priceRes = await fetch(`${BASE_URL}/api/pricing/calculate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sportId: 'sport_football',
        groundId: 'ground_main_arena',
        date: testDate,
        startTime: '08:00 PM', // Peak hour
        durationMinutes: 120, // 2 hours
        selectedAddOns: [{ id: 'add_fb', name: 'Match Football', price: 50, quantity: 2 }],
        paymentOption: 'advance',
      }),
    });
    const priceData = await priceRes.json();
    assert(priceRes.status === 200, 'Pricing calculation returns HTTP 200');
    assert(priceData.pricing.durationMinutes === 120, 'Duration 120 minutes verified');
    assert(priceData.pricing.peakSurcharge === 0, 'No floodlight surcharge applied (flat rate verified)');
    assert(priceData.pricing.advancePercentage === 25, '25% advance deposit computed');
    assert(priceData.pricing.remainingBalance > 0, 'Remaining venue balance calculated');
  } catch (err) {
    assert(false, `Pricing calculation failed: ${err.message}`);
  }

  // 5. CRITICAL DOUBLE-BOOKING PROTECTION
  console.log('\n--- TEST 5: Critical Double-Booking Conflict Protection ---');
  try {
    // 1. Establish baseline booking: Main Arena, 7:00 PM to 8:30 PM (1140 to 1230)
    const baseRes = await fetch(`${BASE_URL}/api/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerName: 'Baseline Player',
        customerPhone: `99${Math.floor(10000000 + Math.random() * 90000000)}`,
        sportId: 'sport_football',
        groundId: 'ground_main_arena',
        date: testDate,
        startTime: '07:00 PM',
        durationMinutes: 90, // 7:00 PM to 8:30 PM
        paymentMethod: 'RAZORPAY',
      }),
    });
    assert(baseRes.status === 201, 'Baseline booking established (7:00 PM to 8:30 PM)');

    // 2. Attempt overlapping reservation: 8:00 PM to 9:00 PM (1200 to 1260) -> OVERLAPS 8:00 PM to 8:30 PM!
    const conflictRes = await fetch(`${BASE_URL}/api/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerName: 'Clashing Player',
        customerPhone: `99${Math.floor(10000000 + Math.random() * 90000000)}`,
        sportId: 'sport_football',
        groundId: 'ground_main_arena',
        date: testDate,
        startTime: '08:00 PM',
        durationMinutes: 60, // 8:00 PM to 9:00 PM
        paymentMethod: 'RAZORPAY',
      }),
    });
    const conflictData = await conflictRes.json();
    assert(conflictRes.status === 409, 'Overlapping booking (8:00-9:00 PM vs 7:00-8:30 PM) REJECTED with HTTP 409 Conflict');
    assert(conflictData.error.includes('already reserved'), 'Error message details ground reservation conflict');

    // 3. Attempt adjacent non-overlapping reservation: 8:30 PM to 9:30 PM (1230 to 1290) -> Boundary matches, MUST SUCCEED!
    const adjacentRes = await fetch(`${BASE_URL}/api/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerName: 'Adjacent Player',
        customerPhone: `99${Math.floor(10000000 + Math.random() * 90000000)}`,
        sportId: 'sport_football',
        groundId: 'ground_main_arena',
        date: testDate,
        startTime: '08:30 PM',
        durationMinutes: 60, // 8:30 PM to 9:30 PM
        paymentMethod: 'RAZORPAY',
      }),
    });
    assert(adjacentRes.status === 201, 'Adjacent booking (8:30-9:30 PM) immediately following 8:30 PM SUCCEEDS with HTTP 201');

    // 4. Attempt booking on different ground: 7:00 PM to 8:30 PM on The Box Cage -> MUST SUCCEED!
    const otherGroundRes = await fetch(`${BASE_URL}/api/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerName: 'Cage Futsal Player',
        customerPhone: `99${Math.floor(10000000 + Math.random() * 90000000)}`,
        sportId: 'sport_futsal',
        groundId: 'ground_box_cage',
        date: testDate,
        startTime: '07:00 PM',
        durationMinutes: 90,
        paymentMethod: 'VENUE_CASH',
      }),
    });
    assert(otherGroundRes.status === 201, 'Concurrent slot on different ground SUCCEEDS with HTTP 201');
  } catch (err) {
    assert(false, `Double-booking test failed: ${err.message}`);
  }

  // 6. Razorpay Payment Verification & Idempotency
  console.log('\n--- TEST 6: Razorpay Server Verification & Idempotency ---');
  try {
    const bookRes = await fetch(`${BASE_URL}/api/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerName: 'Payment Test User',
        customerPhone: `99${Math.floor(10000000 + Math.random() * 90000000)}`,
        sportId: 'sport_cricket',
        groundId: 'ground_main_arena',
        date: testDate,
        startTime: '10:00 PM',
        durationMinutes: 60,
        paymentMethod: 'RAZORPAY',
        paymentOption: 'advance',
      }),
    });
    const bookData = await bookRes.json();
    assert(bookRes.status === 201, 'Fresh booking for payment test created with HTTP 201');
    const bId = bookData.booking.id;

    // Create Razorpay order
    const orderRes = await fetch(`${BASE_URL}/api/payments/create-order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bookingId: bId,
        amount: bookData.booking.pricing.advanceAmount,
      }),
    });
    const orderData = await orderRes.json();
    assert(orderRes.status === 200, 'Razorpay order creation returns HTTP 200');
    assert(Boolean(orderData.order.orderId), 'Order ID generated successfully');

    // Verify signature
    const paymentId = `pay_${Date.now()}`;
    const verifyRes = await fetch(`${BASE_URL}/api/payments/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bookingId: bId,
        razorpayOrderId: orderData.order.orderId,
        razorpayPaymentId: paymentId,
        razorpaySignature: 'sig_test_valid_signature',
      }),
    });
    const verifyData = await verifyRes.json();
    assert(verifyRes.status === 200, 'Payment signature verified successfully');
    assert(verifyData.success === true, 'Payment status updated to verified');

    // Duplicate submission (Idempotency)
    const duplicateRes = await fetch(`${BASE_URL}/api/payments/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bookingId: bId,
        razorpayOrderId: orderData.order.orderId,
        razorpayPaymentId: paymentId,
        razorpaySignature: 'sig_test_valid_signature',
      }),
    });
    assert(duplicateRes.status === 200, 'Duplicate submission handled gracefully (idempotent)');
  } catch (err) {
    assert(false, `Payment test failed: ${err.message}`);
  }

  // 7. Maintenance Period Block Check
  console.log('\n--- TEST 7: Maintenance Blocker Verification ---');
  try {
    const blockRes = await fetch(`${BASE_URL}/api/admin/blocked-slots`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        groundId: 'ground_box_cage',
        date: testDate,
        startTime: '02:00 PM',
        endTime: '04:00 PM',
        reason: 'Perimeter Netting Inspection',
      }),
    });
    assert(blockRes.status === 201, 'Maintenance window blocked by admin');

    const blockConflictRes = await fetch(`${BASE_URL}/api/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerName: 'Blocked Slot Customer',
        customerPhone: `99${Math.floor(10000000 + Math.random() * 90000000)}`,
        sportId: 'sport_futsal',
        groundId: 'ground_box_cage',
        date: testDate,
        startTime: '02:30 PM',
        durationMinutes: 60,
        paymentMethod: 'VENUE_CASH',
      }),
    });
    assert(blockConflictRes.status === 409, 'Customer booking in maintenance window REJECTED with HTTP 409');
    const blockConflictData = await blockConflictRes.json();
    assert(blockConflictRes.status === 409, 'Customer booking in maintenance window REJECTED with HTTP 409');

    // 8. Availability Endpoint Verification
    console.log('\n--- TEST 8: Live Slot Availability & Ground Aliasing ---');
    const availRes = await fetch(`${BASE_URL}/api/availability?groundId=ground-beta&date=${testDate}&step=60`);
    const availData = await availRes.json();
    assert(availRes.status === 200, 'Availability endpoint returns HTTP 200 with alias ground-beta');
    assert(Array.isArray(availData.slots) && availData.slots.length > 0, 'Returns list of 1-hour slots');
    const afternoonSlot = availData.slots.find((s) => s.startTime === '02:00 PM');
    assert(afternoonSlot && afternoonSlot.status === 'MAINTENANCE', 'Blocked maintenance window reflected as MAINTENANCE in availability');

    // 9. Cancellation Releases Slot Interval
    console.log('\n--- TEST 9: Booking Cancellation Releases Interval ---');
    // Create temporary booking for 11:00 AM - 12:00 PM
    const tempBookRes = await fetch(`${BASE_URL}/api/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerName: 'Cancel Test User',
        customerPhone: '9988776655',
        sportId: 'sport_cricket',
        groundId: 'ground_main_arena',
        date: testDate,
        startTime: '11:00 AM',
        durationMinutes: 60,
        paymentMethod: 'VENUE_CASH',
      }),
    });
    const tempBookData = await tempBookRes.json();
    assert(tempBookRes.status === 201, 'Temp booking created for 11:00 AM');
    const tempBookingId = tempBookData.booking.id;

    // Verify 11:00 AM slot is BOOKED
    const availCheck1 = await fetch(`${BASE_URL}/api/availability?groundId=ground_main_arena&date=${testDate}&step=60`);
    const availCheck1Data = await availCheck1.json();
    const slot11 = availCheck1Data.slots.find((s) => s.startTime === '11:00 AM');
    assert(slot11 && slot11.status === 'BOOKED', '11:00 AM slot status is now BOOKED');

    // Cancel booking
    const cancelRes = await fetch(`${BASE_URL}/api/bookings/${tempBookingId}/cancel`, {
      method: 'POST',
    });
    assert(cancelRes.status === 200, 'Booking cancelled successfully via API');

    // Verify 11:00 AM slot is now AVAILABLE again
    const availCheck2 = await fetch(`${BASE_URL}/api/availability?groundId=ground_main_arena&date=${testDate}&step=60`);
    const availCheck2Data = await availCheck2.json();
    const slot11After = availCheck2Data.slots.find((s) => s.startTime === '11:00 AM');
    assert(slot11After && slot11After.status === 'AVAILABLE', '11:00 AM slot released and returned to AVAILABLE');

    // 10. Multi-Hour Booking Checks Every Part of Interval
    console.log('\n--- TEST 10: Multi-Hour Booking Interval Encasement ---');
    // Book 05:00 PM to 07:00 PM (120 minutes)
    const multiHourRes = await fetch(`${BASE_URL}/api/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerName: 'Multi Hour Booker',
        customerPhone: '9123456780',
        sportId: 'sport_cricket',
        groundId: 'ground_main_arena',
        date: testDate,
        startTime: '05:00 PM',
        durationMinutes: 120, // 5:00 PM to 7:00 PM
        paymentMethod: 'VENUE_CASH',
      }),
    });
    assert(multiHourRes.status === 201, '2-hour booking (05:00 PM - 07:00 PM) created');

    // Attempt overlapping 06:00 PM - 07:00 PM (second hour)
    const secondHourRes = await fetch(`${BASE_URL}/api/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerName: 'Second Hour Clashing',
        customerPhone: '9123456781',
        sportId: 'sport_cricket',
        groundId: 'ground_main_arena',
        date: testDate,
        startTime: '06:00 PM',
        durationMinutes: 60,
        paymentMethod: 'VENUE_CASH',
      }),
    });
    assert(secondHourRes.status === 409, 'Overlapping second hour (06:00 PM - 07:00 PM) REJECTED with 409');

    // Attempt overlapping straddle 04:00 PM - 06:00 PM
    const straddleRes = await fetch(`${BASE_URL}/api/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerName: 'Straddle Clashing',
        customerPhone: '9123456782',
        sportId: 'sport_cricket',
        groundId: 'ground_main_arena',
        date: testDate,
        startTime: '04:00 PM',
        durationMinutes: 120, // 4:00 PM - 6:00 PM
        paymentMethod: 'VENUE_CASH',
      }),
    });
    assert(straddleRes.status === 409, 'Overlapping straddle (04:00 PM - 06:00 PM) REJECTED with 409');

    // 11. Simultaneous Parallel Overlapping Requests Concurrency Race
    console.log('\n--- TEST 11: High-Concurrency Simultaneous Overlapping Requests ---');
    const raceSlotTime = '09:00 AM';
    const req1 = fetch(`${BASE_URL}/api/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerName: 'Racer A',
        customerPhone: '9876543210',
        sportId: 'sport_cricket',
        groundId: 'ground_main_arena',
        date: testDate,
        startTime: raceSlotTime,
        durationMinutes: 60,
        paymentMethod: 'VENUE_CASH',
      }),
    });
    const req2 = fetch(`${BASE_URL}/api/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerName: 'Racer B',
        customerPhone: '9876543211',
        sportId: 'sport_cricket',
        groundId: 'ground_main_arena',
        date: testDate,
        startTime: raceSlotTime,
        durationMinutes: 60,
        paymentMethod: 'VENUE_CASH',
      }),
    });

    const [raceRes1, raceRes2] = await Promise.all([req1, req2]);
    const statuses = [raceRes1.status, raceRes2.status].sort();
    assert(
      statuses[0] === 201 && statuses[1] === 409,
      `Parallel race condition: Exactly one request succeeded (201) and one rejected (409). Got: [${statuses.join(', ')}]`
    );

    // 12. Unblock Maintenance Releases Period
    console.log('\n--- TEST 12: Admin Unblock Releases Period ---');
    const blockData = await blockRes.json();
    const blockId = blockData.block.id;
    const unblockRes = await fetch(`${BASE_URL}/api/admin/blocked-slots/${blockId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(unblockRes.status === 200, 'Maintenance block removed via admin API');

    const availCheck3 = await fetch(`${BASE_URL}/api/availability?groundId=ground_box_cage&date=${testDate}&step=60`);
    const availCheck3Data = await availCheck3.json();
    const slot2pm = availCheck3Data.slots.find((s) => s.startTime === '02:00 PM');
    assert(slot2pm && slot2pm.status === 'AVAILABLE', 'Unblocked slot returns to AVAILABLE');
  } catch (err) {
    assert(false, `Maintenance/Availability test failed: ${err.message}`);
  }

  // Final Summary
  console.log('\n========================================');
  console.log(`🎯 Test Results: ${passed} Passed, ${failed} Failed`);
  console.log('========================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
