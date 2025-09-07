import NetInfo from '@react-native-community/netinfo';
import { AudioPlayer } from 'expo-audio'; // Correct import for expo-audio
import * as Linking from 'expo-linking';
import * as SMS from 'expo-sms';
import { databaseService, SOSAlert } from './DatabaseService';
import { LocationData, locationService } from './LocationService';
import { EmergencyContact, storageService, UserSettings } from './StorageService';

class SOSService {
  private isActive = false;
  private cancelTimer: ReturnType<typeof setTimeout> | null = null;
  private emergencyContacts: EmergencyContact[] = [];

  constructor() {
    this.loadEmergencyContacts();
  }

  async loadEmergencyContacts() {
    this.emergencyContacts = await storageService.getEmergencyContacts();
    // If no contacts, set defaults and save
    if (this.emergencyContacts.length === 0) {
      this.emergencyContacts = [
        { name: 'Police', phone: '112', relationship: 'Emergency' },
        { name: 'Ambulance', phone: '108', relationship: 'Emergency' },
      ];
      await storageService.saveEmergencyContacts(this.emergencyContacts);
    }
  }

  async setEmergencyContacts(contacts: EmergencyContact[]) {
    this.emergencyContacts = contacts;
    await storageService.saveEmergencyContacts(contacts);
  }

  async triggerSOS(): Promise<boolean> {
    try {
      if (this.isActive) {
        console.log('SOS already active');
        return false;
      }

      // Get current location
      const location = await locationService.getCurrentLocation();
      if (!location) {
        console.error('Failed to get location for SOS');
        return false;
      }

      await this.loadEmergencyContacts(); // Always use latest contacts
      const settings = await this.loadUserSettings();

      // Check if we have emergency contacts
      if (this.emergencyContacts.length === 0) {
        console.error('No emergency contacts available');
        return false;
      }

      // Play buzzer if enabled in settings
      if (settings.playBuzzerOnSOS) {
        try {
          const player = new AudioPlayer(require('../assets/buzzer.mp3'), 100);
          await player.play();
          console.log('Playing buzzer for SOS');
        } catch (error) {
          console.error('Failed to play buzzer sound:', error);
        }
      }

      // Create SOS alert
      const sosAlert: SOSAlert = {
        latitude: location.latitude,
        longitude: location.longitude,
        timestamp: location.timestamp,
        status: 'pending',
        message: 'SOS Alert - Emergency situation',
        contact_numbers: this.emergencyContacts.map(c => c.phone).join(','),
      };

      // Save to local database
      const alertId = await databaseService.saveSOSAlert(sosAlert);
      console.log('SOS alert saved locally with ID:', alertId);

      // Check if timer is enabled and greater than 0
      if (settings.timerEnabled && (settings.timerSeconds ?? 30) > 0) {
        // Start cancel timer if enabled in settings and timer > 0
        this.startCancelTimer(settings.timerSeconds ?? 30, sosAlert, alertId);
        this.isActive = true;
      } else {
        // Timer is disabled or set to 0 - proceed immediately
        console.log('Timer disabled or set to 0 - sending SOS immediately');
        await this.executeSOS(sosAlert, alertId);
        this.isActive = false; // Don't keep SOS active since it's sent immediately
      }

      return true;
    } catch (error) {
      console.error('Failed to trigger SOS:', error);
      return false;
    }
  }

  // New method to execute SOS (separated for reuse)
  private async executeSOS(sosAlert: SOSAlert, alertId: number): Promise<void> {
    try {
      // Check network status
      const isOnline = await this.checkNetworkStatus();

      if (isOnline) {
        console.log('Online - attempting to send SOS alert to server');
        await this.sendSOSAlert(sosAlert, alertId);
      } else {
        console.log('Offline - sending emergency SMS directly');
        // When offline, always send SMS to emergency contacts
        await this.sendSMSEmergency({
          latitude: sosAlert.latitude,
          longitude: sosAlert.longitude,
          timestamp: sosAlert.timestamp,
        });
        // Update status to sent since SMS was successful
        await databaseService.updateAlertStatus(alertId, 'sent');
      }
    } catch (error) {
      console.error('Failed to execute SOS:', error);
      // Fallback to SMS even if other methods fail
      await this.sendSMSEmergency({
        latitude: sosAlert.latitude,
        longitude: sosAlert.longitude,
        timestamp: sosAlert.timestamp,
      });
    }
  }

  async cancelSOS(): Promise<boolean> {
    try {
      if (!this.isActive) {
        return false;
      }

      if (this.cancelTimer) {
        clearTimeout(this.cancelTimer);
        this.cancelTimer = null;
      }

      this.isActive = false;
      console.log('SOS cancelled by user');
      return true;
    } catch (error) {
      console.error('Failed to cancel SOS:', error);
      return false;
    }
  }

  private startCancelTimer(seconds: number, sosAlert: SOSAlert, alertId: number): void {
    this.cancelTimer = setTimeout(async () => {
      console.log('SOS cancel timer expired - executing SOS');
      this.isActive = false;

      // Execute the SOS alert
      await this.executeSOS(sosAlert, alertId);

      // Also auto-dial police helpline 112 as backup
      try {
        await Linking.openURL('tel:112');
        console.log('Auto-dialed 112 after SOS timer expired');
      } catch (err) {
        console.error('Failed to auto-dial 112:', err);
      }
    }, seconds * 1000);
  }

  private async checkNetworkStatus(): Promise<boolean> {
    try {
      const state = await NetInfo.fetch();
      return state.isConnected === true;
    } catch (error) {
      console.error('Network check failed:', error);
      return false;
    }
  }

  private async sendSOSAlert(alert: SOSAlert, alertId: number): Promise<void> {
    try {
      // TODO: Replace with a a backend API endpoint
      const response = await fetch('https://your-backend-api.com/sos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(alert),
      });
      if (response.ok) {
        await databaseService.updateAlertStatus(alertId, 'sent');
        console.log('SOS alert sent successfully');
      } else {
        throw new Error('Failed to send SOS alert to server');
      }
    } catch (error) {
      console.error('Failed to send SOS alert:', error);
      await databaseService.updateAlertStatus(alertId, 'failed');
      // Fallback to SMS
      await this.sendSMSEmergency({
        latitude: alert.latitude,
        longitude: alert.longitude,
        timestamp: alert.timestamp,
      });
    }
  }

  private async sendSMSEmergency(location: LocationData): Promise<void> {
    try {
      const isAvailable = await SMS.isAvailableAsync();
      if (!isAvailable) {
        console.log('SMS not available on this device');
        return;
      }

      const message = `EMERGENCY SOS: I need help immediately! My location: https://maps.google.com/?q=${location.latitude},${location.longitude} Time: ${new Date(location.timestamp).toLocaleString()}`;
      
      // Send to emergency contacts
      for (const contact of this.emergencyContacts) {
        try {
          await SMS.sendSMSAsync([contact.phone], message);
          console.log(`SMS sent to ${contact.name}: ${contact.phone}`);
        } catch (error) {
          console.error(`Failed to send SMS to ${contact.name}:`, error);
        }
      }
    } catch (error) {
      console.error('SMS emergency failed:', error);
    }
  }

  async syncPendingAlerts(): Promise<void> {
    try {
      const pendingAlerts = await databaseService.getPendingAlerts();
      const isOnline = await this.checkNetworkStatus();

      if (!isOnline || pendingAlerts.length === 0) {
        return;
      }

      console.log(`Syncing ${pendingAlerts.length} pending alerts`);

      for (const alert of pendingAlerts) {
        if (alert.id) {
          await this.sendSOSAlert(alert, alert.id);
        }
      }
    } catch (error) {
      console.error('Failed to sync pending alerts:', error);
    }
  }

  async loadUserSettings(): Promise<UserSettings> {
    const settings = await storageService.getUserSettings();
    // Set defaults if not present
    if (!settings || Object.keys(settings).length === 0) {
      const defaultSettings: UserSettings = {
        timerSeconds: 30,
        timerEnabled: false,
        playBuzzerOnSOS: false,
      };
      await storageService.saveUserSettings(defaultSettings);
      return defaultSettings;
    }
    // Ensure all defaults are present
    return {
      timerSeconds: settings.timerSeconds ?? 30,
      timerEnabled: settings.timerEnabled ?? false,
      playBuzzerOnSOS: settings.playBuzzerOnSOS ?? false,
    };
  }

  isSOSActive(): boolean {
    return this.isActive;
  }

  getEmergencyContacts(): EmergencyContact[] {
    return this.emergencyContacts;
  }

  addEmergencyContact(contact: EmergencyContact): void {
    this.emergencyContacts.push(contact);
  }

  removeEmergencyContact(phone: string): void {
    this.emergencyContacts = this.emergencyContacts.filter(c => c.phone !== phone);
  }
}

export const sosService = new SOSService();
