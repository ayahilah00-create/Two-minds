# TWO MINDS — Reference-inspired mobile website

This is a mobile-first web app with the visual direction of the supplied reference:
- white and very light-grey content area
- solid black desktop sidebar and black mobile bottom navigation
- white cards, black typography and black buttons
- small green completion indicators only where useful, similar to the reference
- responsive phone layout

## Run locally
1. Install Node.js 18 or newer.
2. Copy `.env.example` to `.env`.
3. Set `REHAN_CODE`, `UBAID_CODE`, and a long random `SESSION_SECRET` in `.env`.
4. Run `npm install`
5. Run `npm start`
6. Open `http://localhost:3000`

## Important
- Do not share `.env` or the secret login codes.
- This package is not deployed to the public internet yet.
- The included server stores shared task state in a local `data.json`. For reliable hosted use, configure persistent database storage and secure production session storage before deployment.
- Real-time updates work while the Node server is running and authenticated sessions are active.
- Prayer times in the sample interface are placeholders; use a trusted local timetable.
- Fitness checklists are flexible reminders, not medical or performance advice.
- Trading area is educational/paper-practice only.
- Book areas are for personal progress and notes, not reproduction of book text.

## Install on Android after deployment
Open the HTTPS website in Chrome, tap the three-dot menu, then choose **Add to Home screen** (or **Install app**, if offered).
