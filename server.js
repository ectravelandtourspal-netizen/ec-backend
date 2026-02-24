const express = require('express');
const twilio = require('twilio');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(express.json());

// ⚠️ CORS Configuration - Allow Netlify domains (CRITICAL FOR PRODUCTION)
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:5500',
      'http://localhost:8000',
      'https://ectravelandtour.netlify.app',  // Netlify deployment
      'https://ectravelandtour.com',            // Custom domain
      'https://www.ectravelandtour.com',        // www custom domain
    ];
    
    // Allow requests with no origin (like mobile apps)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`❌ CORS rejected request from origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }

// Google Apps Script Web App URL for updating Google Sheet
const GOOGLE_APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbw24aAnZVmTQN48j7iFxB-JwrMPlgvoqmxho-oTkpalQ8JloPJmEs_e3Or7xFtI0fSQ/exec';
// Note: Using single URL for both coupon and booking operations - differentiated by "action" field

// Update Google Sheet using Google Apps Script - Mark coupon as used
async function markCouponAsUsedInSheet(couponCode, guestName, guestEmail) {
  try {
    console.log(`\n📝 Updating Google Sheet via Apps Script for coupon: ${couponCode}`);
    console.log(`   Guest: ${guestName}`);
    console.log(`   Email: ${guestEmail}`);
    
    const response = await fetch(GOOGLE_APPS_SCRIPT_URL, {
      method: 'POST',
      mode: 'cors',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'mark_coupon',
        couponCode: couponCode,
        guestName: guestName,
        guestEmail: guestEmail,
        remark: 'website',
        newStatus: 'used'
      })
    });

    const result = await response.json();
    
    if (result.success && result.updated) {
      console.log(`✅ Sheet updated successfully!`);
      console.log(`   Coupon: ${couponCode} marked as used by ${guestName}`);
      return true;
    } else {
      console.error(`❌ Sheet update failed:`, result.error || 'Unknown error');
      return false;
    }
  } catch (error) {
    console.error('❌ Error updating Google Sheet via Apps Script:');
    console.error('   Message:', error.message);
    return false;
  }
}

// Save booking data to Google Sheet
async function saveBookingToSheet(bookingData) {
  try {
    console.log(`\n📋 Saving booking to Google Sheet...`);
    console.log(`   Guest: ${bookingData.firstName} ${bookingData.lastName}`);
    console.log(`   Email: ${bookingData.email}`);
    console.log(`   Package: ${bookingData.package}`);
    
    const response = await fetch(GOOGLE_APPS_SCRIPT_URL, {
      method: 'POST',
      mode: 'cors',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'save_booking',
        bookingDateSubmitted: bookingData.bookingDateSubmitted || new Date().toISOString(),
        travelDate: bookingData.travelDate,
        firstName: bookingData.firstName,
        lastName: bookingData.lastName,
        email: bookingData.email,
        phone: bookingData.phone,
        address: bookingData.address,
        city: bookingData.city,
        country: bookingData.country,
        numberOfGuests: bookingData.numberOfGuests,
        package: bookingData.package,
        foodRestriction: bookingData.foodRestriction,
        specialRequests: bookingData.specialRequests,
        emergencyTitle: bookingData.emergencyTitle,
        emergencyFirstName: bookingData.emergencyFirstName,
        emergencyLastName: bookingData.emergencyLastName,
        emergencyPhone: bookingData.emergencyPhone,
        emergencyRelationship: bookingData.emergencyRelationship,
        couponCode: bookingData.couponCode,
        discountAmount: bookingData.discountAmount,
        paymentMethod: bookingData.paymentMethod,
        paymentFee: bookingData.paymentFee,
        totalPrice: bookingData.totalPrice
      })
    });

    const result = await response.json();
    
    if (result.success && result.saved) {
      console.log(`✅ Booking saved successfully!`);
      console.log(`   Guest: ${bookingData.firstName} ${bookingData.lastName}`);
      return true;
    } else {
      console.error(`❌ Booking save failed:`, result.error || 'Unknown error');
      return false;
    }
  } catch (error) {
    console.error('❌ Error saving booking to Google Sheet:');
    console.error('   Message:', error.message);
    return false;
  }
}

// Twilio Configuration
const accountSid = 'AC7a4e1b73055e46fa7274e4e60adc6aa8';
const authToken = '2e13f0f20a340423ca20650b3898c433';
const client = twilio(accountSid, authToken);
const twilioPhoneNumber = 'whatsapp:+14155238886'; // Twilio sandbox number

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'Server is running', timestamp: new Date() });
});

// Send WhatsApp message
app.post('/send-whatsapp', async (req, res) => {
  const { to, message, type } = req.body;

  // Validate inputs
  if (!to || !message) {
    return res.status(400).json({
      success: false,
      error: 'Missing required fields: to, message'
    });
  }

  try {
    console.log(`\n📱 [${new Date().toISOString()}] Sending ${type} WhatsApp`);
    console.log(`   To: +${to}`);
    console.log(`   From: ${twilioPhoneNumber}`);
    console.log(`   Message preview: ${message.substring(0, 60)}...`);

    const result = await client.messages.create({
      from: twilioPhoneNumber,
      to: `whatsapp:+${to}`,
      body: message
    });

    console.log(`✅ SUCCESS! ${type} WhatsApp sent!`);
    console.log(`   Message SID: ${result.sid}`);
    console.log(`   Status: ${result.status}`);
    console.log(`   Account: ${result.accountSid.substring(0, 8)}...`);

    res.json({
      success: true,
      messageSid: result.sid,
      status: result.status,
      type: type,
      timestamp: new Date()
    });

  } catch (error) {
    console.error(`\n❌ FAILED! Error sending ${type} WhatsApp:`);
    console.error(`   Error Code: ${error.code}`);
    console.error(`   Error Message: ${error.message}`);
    console.error(`   To Number: +${to}`);
    console.error(`   Full Error:`, error);
    
    // Check for common Twilio errors
    if (error.message.includes('phone number is not registered')) {
      console.error('\n⚠️  SANDBOX ERROR: Phone number +' + to + ' is NOT registered!');
      console.error('   FIX: Send "join ectravel" to +14155238886 from WhatsApp');
    }
    
    if (error.message.includes('Invalid')) {
      console.error('\n⚠️  INVALID PHONE NUMBER: ' + to);
      console.error('   FORMAT: Must be 12 digits with country code (e.g., 639163542921)');
    }

    res.status(500).json({
      success: false,
      error: error.message,
      code: error.code,
      type: type,
      details: error.toString()
    });
  }
});

// Mark coupon as used endpoint
app.post('/mark-coupon-used', async (req, res) => {
  const { couponCode, guestName, guestEmail } = req.body;

  if (!couponCode || !guestName) {
    return res.status(400).json({
      success: false,
      error: 'Missing required fields: couponCode, guestName'
    });
  }

  try {
    console.log(`\n🎫 Marking Coupon as Used:`);
    console.log(`   Code: ${couponCode}`);
    console.log(`   Used by: ${guestName}`);
    console.log(`   Email: ${guestEmail || 'N/A'}`);
    console.log(`   Timestamp: ${new Date().toISOString()}`);

    // Update Google Sheet
    const updated = await markCouponAsUsedInSheet(couponCode, guestName, guestEmail || 'Unknown');

    if (updated) {
      res.json({
        success: true,
        message: 'Coupon marked as used in Google Sheet',
        couponCode: couponCode,
        usedBy: guestName,
        timestamp: new Date(),
        sheetUpdated: true
      });
    } else {
      res.json({
        success: true,
        message: 'Coupon usage recorded (sheet update may have failed)',
        couponCode: couponCode,
        usedBy: guestName,
        timestamp: new Date(),
        sheetUpdated: false
      });
    }
  } catch (error) {
    console.error('❌ Error marking coupon as used:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Save booking endpoint
app.post('/save-booking', async (req, res) => {
  const bookingData = req.body;

  if (!bookingData.firstName || !bookingData.lastName || !bookingData.email) {
    return res.status(400).json({
      success: false,
      error: 'Missing required fields: firstName, lastName, email'
    });
  }

  try {
    console.log(`\n📝 Saving Booking:`);
    console.log(`   Guest: ${bookingData.firstName} ${bookingData.lastName}`);
    console.log(`   Email: ${bookingData.email}`);
    
    const sheetUpdated = await saveBookingToSheet(bookingData);
    
    if (sheetUpdated) {
      res.json({
        success: true,
        message: 'Booking saved successfully',
        timestamp: new Date(),
        sheetUpdated: true
      });
    } else {
      res.json({
        success: true,
        message: 'Booking recorded (sheet update may have failed)',
        timestamp: new Date(),
        sheetUpdated: false
      });
    }
  } catch (error) {
    console.error('❌ Error saving booking:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: err.message
  });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 EC Travel Backend Server running on http://localhost:${PORT}`);
  console.log(`📱 Twilio WhatsApp Sandbox: ${twilioPhoneNumber}`);
  console.log(`📊 Account SID: ${accountSid.substring(0, 8)}...`);
  console.log('\n✅ Endpoints:');
  console.log(`  - GET  /health`);
  console.log(`  - POST /send-whatsapp`);
  console.log(`  - POST /mark-coupon-used (Updates Google Sheet via Apps Script)`);
  console.log(`  - POST /save-booking (Saves booking to Google Sheet)`);
});

