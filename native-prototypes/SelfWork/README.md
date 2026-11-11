# Self Work — Native Prototype

This folder contains a **SwiftUI scaffold** for the Self Work toolkit. It is not a full migration; it is the smallest native iOS app that demonstrates the pieces a browser/PWA cannot fake:

- **San Francisco** system typography.
- **Real `UINavigationController` edge-swipe back** (free with `NavigationStack`).
- **System materials** (`ultraThinMaterial`) for the dock.
- **Spring-driven push/pop transitions** that match iOS.
- **Safe-area and Dynamic Island** handling that Just Works.

## How to run it

1. Open **Xcode**.
2. Create a new **iOS App** project (SwiftUI interface, Swift language).
3. Replace the generated `ContentView.swift` with `SelfWorkPrototype.swift`.
4. In the project settings, set the app entry point to `SelfWorkApp`.
5. Build and run on a device or simulator.

## Why this looks "proper" in a way the web app cannot

The web app is bounded by the browser: it renders HTML/CSS, polyfills gestures, loads custom fonts, and fights the document scroll model. This prototype uses the actual iOS render tree, so the dock blur, sheet behaviour, swipe-back physics, and font metrics are the ones Apple ships.

## Path to a real app

If you want to ship this as a native app, the real work is:

1. **Data layer** — move `clients`, `appointments`, `voice_bookings`, and session history to a shared backend (Supabase already is) and consume it from Swift with async/await.
2. **Auth** — use Supabase Auth or pass-through anonymous sessions.
3. **Voice/piano lesson booking** — rebuild the Cal.com web booking flow in Swift or keep it as an in-app WebView for the booking step only.
4. **Offline/cache** — SwiftData or Core Data for Self Work history so the toolkit works offline.
5. **Share extension / widgets** — native iOS features that have no web equivalent.

A pragmatic middle ground is **React Native + Expo**, which would let you keep most of the React component structure while getting native navigation, sheets, and gestures. It is slower to polish than SwiftUI but faster than a from-scratch rewrite if you want one codebase for iOS and Android.
