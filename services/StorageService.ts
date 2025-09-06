import AsyncStorage from '@react-native-async-storage/async-storage';

export interface EmergencyContact {
  name: string;
  phone: string;
  relationship: string;
}

export interface UserSettings {
  theme?: string;
  notificationsEnabled?: boolean;
  timerSeconds?: number;
  timerEnabled?: boolean;
  playBuzzerOnSOS?: boolean;
}

const CONTACTS_KEY = 'emergency_contacts';
const SETTINGS_KEY = 'user_settings';

class StorageService {
  async getEmergencyContacts(): Promise<EmergencyContact[]> {
    const contacts = await AsyncStorage.getItem(CONTACTS_KEY);
    return contacts ? JSON.parse(contacts) : [];
  }

  async saveEmergencyContacts(contacts: EmergencyContact[]): Promise<void> {
    await AsyncStorage.setItem(CONTACTS_KEY, JSON.stringify(contacts));
  }

  async getUserSettings(): Promise<UserSettings> {
    const settings = await AsyncStorage.getItem(SETTINGS_KEY);
    return settings ? JSON.parse(settings) : {};
  }

  async saveUserSettings(settings: UserSettings): Promise<void> {
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }
}

export const storageService = new StorageService();
