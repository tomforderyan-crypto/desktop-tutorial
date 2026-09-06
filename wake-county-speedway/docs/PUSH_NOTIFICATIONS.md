# Sending a rainout / schedule-change push

Fans opt in from **More → Notifications**, which registers their device and
gets back an Expo push token (`ExponentPushToken[...]`). Store each token in
a small backend table (or even a shared spreadsheet for now) alongside a
`subscribed: true` flag.

Sending a notification to everyone is one HTTP request to Expo's push API —
no dedicated admin app needed for launch:

```bash
curl -X POST https://exp.host/--/api/v2/push/send \
  -H "Content-Type: application/json" \
  -d '{
    "to": ["ExponentPushToken[xxxx]", "ExponentPushToken[yyyy]"],
    "title": "Rainout Tonight",
    "body": "Tonight'\''s races are postponed to next Friday due to rain."
  }'
```

For a friendlier staff flow later, wrap this in a one-page internal form
(title + body + send) backed by the same token list — but the curl call
above is enough to ship the feature today.
