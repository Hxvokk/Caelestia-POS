# Caelestia POS Mobile

React Native + Expo + TypeScript client following the project plan. Routes live in `src/app`; auth and inventory integration live in `src/features`; API, Supabase, shared types, and UI helpers live in `src/shared`.

## Configure local development

1. Copy `.env.example` to `.env.local`.
2. Set `EXPO_PUBLIC_SUPABASE_URL` to the Supabase Project URL and `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` to the Publishable key (or legacy anon key). These values are public client configuration. Never use `service_role`, secret keys, database passwords, or DeepSeek keys in the app.
3. Set `EXPO_PUBLIC_API_URL`:
   - Android Emulator: `http://10.0.2.2:5141`
   - Physical Android device: `http://<computer-LAN-IP>:5141`
4. Start the API. For an Android Emulator, bind the local API to its host interface:

   ```sh
   ASPNETCORE_ENVIRONMENT=Development dotnet run --no-launch-profile --project ../api/Api.csproj --urls http://0.0.0.0:5141
   ```

   A physical device and the computer must share a trusted network; allow the API port only on that network.
5. In another terminal, start the app:

   ```sh
   npm start
   ```

   Scan the Expo QR code with Expo Go on Android, or press `a` for an installed Android emulator.

The first milestone contains email/password sign-in and a protected available-inventory screen. It only reads the catalog and available units; it does not create inventory or sales. A zero-stock state is expected until real laptop units are registered by an administrator.

## Checks

```sh
npm run lint
npm run typecheck
npx expo-doctor
```
