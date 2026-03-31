You can inspect your deployment in the Dashboard: https://supabase.com/dashboard/project/xebtjnvfkroiplyzftas/functions
A new version of Supabase CLI is available: v2.84.2 (currently installed v2.75.0)
We recommend updating regularly for new features and bug fixes: https://supabase.com/docs/guides/cli/getting-started#updating-the-supabase-cli
MacBook-Pro-7:kinesiology-app danielebuatti$ curl -i -X POST "https://xebtjnvfkroiplyzftas.supabase.co/functions/v1/calcom-webhook"   -H "Content-Type: application/json"   -d '{
    "triggerEvent": "BOOKING_CREATED",
    "payload": {
      "title": "Test Kinesiology Session",
      "startTime": "2025-05-01T10:00:00Z",
      "description": "Testing the automation",
      "attendees": [
        {
          "name": "Test User",
          "email": "test@example.com",
          "phoneNumber": "0400111222"
        }
      ],
      "payment": [
        { "amount": 15000 }
      ]
    }
  }'
HTTP/2 400 
date: Tue, 31 Mar 2026 04:43:02 GMT
content-type: application/json
server: cloudflare
cf-ray: 9e4cb0d04847d87d-MEL
cf-cache-status: DYNAMIC
access-control-allow-origin: *
strict-transport-security: max-age=31536000; includeSubDomains; preload
vary: Accept-Encoding
access-control-allow-headers: authorization, x-client-info, apikey, content-type, x-supabase-client-platform
access-control-allow-methods: POST, OPTIONS
sb-gateway-version: 1
sb-project-ref: xebtjnvfkroiplyzftas
sb-request-id: 019d4233-be35-74c2-957d-04523fc279ed
x-deno-execution-id: f429c892-bf47-46d6-a00e-b6ba29c1c273
x-sb-edge-region: ap-southeast-2
x-served-by: supabase-edge-runtime
set-cookie: __cf_bm=fD.hfyLgNPiwnnGg_oVtex.3IvAX6UuM7nrdepfMkrY-1774932182-1.0.1.1-LMs_I0rED6ccBscdnOEim5ZPbCWRec7Invg0BeTl1Gh2RVFSiEeN3xgmz_DcX_hzXUi7QNHDM4r0Gk_WwYTL13FnpxWIvYG.TTMUYcxCK44; path=/; expires=Tue, 31-Mar-26 05:13:02 GMT; domain=.supabase.co; HttpOnly; Secure; SameSite=None
alt-svc: h3=":443"; ma=86400

{"error":"invalid input syntax for type json"}MacBook-Pro-7:kinesiology-app danielebuatti$ 
