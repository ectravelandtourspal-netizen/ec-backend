# EC Travel and Tours - Backend Server

Backend server for sending WhatsApp messages via Twilio and managing bookings.

## Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Variables
Create a `.env` file in the backend directory:
```
TWILIO_ACCOUNT_SID=AC65bcac4ab8b5f20d2e71bf84d3a069ea
TWILIO_AUTH_TOKEN=5ec45760af6e9a225f6a5b073d4715ef
TWILIO_WHATSAPP_NUMBER=+14155238886
PORT=3000
```

### 3. Run the Server

**Development mode (with auto-reload):**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

The server will start on `http://localhost:3000`

## API Endpoints

### Health Check
```
GET /health
```
Returns server status.

### Send WhatsApp Message
```
POST /send-whatsapp
Content-Type: application/json

{
  "to": "639163542921",
  "message": "Your booking message here",
  "type": "guest" or "company"
}
```

**Response:**
```json
{
  "success": true,
  "messageSid": "SMxxx...",
  "type": "guest",
  "timestamp": "2026-01-20T..."
}
```

## Notes

- The Twilio sandbox number can only send to numbers that have joined the sandbox
- Numbers must reply with "join ectravel" to receive messages from the sandbox
- For production, upgrade to a full Twilio WhatsApp Business Account
- All timestamps are in UTC

## Troubleshooting

1. **"Missing Twilio Credentials"** - Ensure `.env` file is properly configured
2. **"Invalid phone number"** - Ensure phone numbers are in E.164 format (e.g., +639163542921)
3. **"Sandbox error"** - Ensure the recipient has joined the WhatsApp sandbox by responding with "join ectravel"
