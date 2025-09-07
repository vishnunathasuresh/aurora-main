
# Aurora Safety App

Aurora is a modern safety companion app built with Expo and React Native. It empowers users to quickly alert emergency contacts, share their live location, and find nearby safe spaces such as police stations and hospitals.

## Features

- **SOS Button:** Instantly trigger an SOS alert to notify your emergency contacts with your live location.
- **Emergency Contacts:** Add, edit, and manage a list of trusted contacts to be notified in emergencies.
- **Safe Spaces Map:** Discover nearby police stations, hospitals, and other safe locations using real-time geolocation.
- **Quick Location Sharing:** Share your current location with all emergency contacts via SMS.
- **Customizable Settings:** Adjust SOS timer, enable/disable buzzer, and personalize your safety preferences.
- **Modern UI:** Clean, accessible, and responsive design for a seamless user experience.

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+ recommended)
- [Expo CLI](https://docs.expo.dev/get-started/installation/)
- Android/iOS device or emulator

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/vishnunathasuresh/aurora-main.git
   cd aurora-main
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npx expo start
   ```

4. **Run on your device:**
   - Scan the QR code with [Expo Go](https://expo.dev/go) or use an emulator.

### Scripts

- `npm start` — Start the Expo development server
- `npm run android` — Run on Android emulator/device
- `npm run ios` — Run on iOS simulator/device
- `npm run web` — Run in the browser
- `npm run reset-project` — Reset to a fresh project state

## Project Structure

- `app/` — Main app screens and navigation (file-based routing)
- `components/` — Reusable UI components (SOS button, contacts, map, etc.)
- `services/` — Business logic (SOS, location, safe spots, storage)
- `assets/` — Fonts, images, and audio
- `constants/` — App-wide constants and colors
- `hooks/` — Custom React hooks

## Technologies Used

- React Native & Expo
- Expo Router (file-based navigation)
- Expo Location, SMS, Audio, Haptics
- React Native Maps
- TypeScript

## Contributing

Pull requests are welcome! For major changes, please open an issue first to discuss what you would like to change.

## License

[MIT](LICENSE)

## Community

- [Expo on GitHub](https://github.com/expo/expo)
- [Discord community](https://chat.expo.dev)
