import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
  ScrollView,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { storageService, UserSettings } from '@/services/StorageService';

const SettingsScreen: React.FC = () => {
  const [settings, setSettings] = useState<UserSettings>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSettings = async () => {
      const loaded = await storageService.getUserSettings();
      setSettings({
        timerSeconds: loaded.timerSeconds ?? 30,
        timerEnabled: loaded.timerEnabled ?? false,
        playBuzzerOnSOS: loaded.playBuzzerOnSOS ?? false,
      });
      setLoading(false);
    };
    loadSettings();
  }, []);

  const updateSetting = async (key: keyof UserSettings, value: any) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    await storageService.saveUserSettings(newSettings);
  };

  const adjustTimer = (increment: boolean) => {
    const currentSeconds = settings.timerSeconds ?? 30;
    const newSeconds = increment
      ? Math.min(300, currentSeconds + 5)
      : Math.max(5, currentSeconds - 5);
    updateSetting('timerSeconds', newSeconds);
  };

  const showTimerInfo = () => {
    Alert.alert(
      'SOS Timer',
      'When enabled, the SOS button will show a countdown timer before automatically triggering the emergency alert. This gives you time to cancel if activated accidentally.',
      [{ text: 'OK' }]
    );
  };

  const showBuzzerInfo = () => {
    Alert.alert(
      'Emergency Buzzer',
      'When enabled, a loud buzzer sound will play when SOS is activated to attract attention and alert nearby people.',
      [{ text: 'OK' }]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Ionicons name="settings" size={48} color="#a78bfa" />
          <Text style={styles.loadingText}>Loading settings...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Ionicons name="settings" size={32} color="#7c3aed" />
          <Text style={styles.title}>Settings</Text>
        </View>

        {/* Emergency Settings Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Emergency Settings</Text>

          {/* Timer Enable Setting */}
          <View style={styles.settingCard}>
            <View style={styles.settingHeader}>
              <View style={styles.settingIconContainer}>
                <Ionicons name="timer" size={24} color="#7c3aed" />
              </View>
              <View style={styles.settingContent}>
                <Text style={styles.settingLabel}>Enable SOS Timer</Text>
                <Text style={styles.settingDescription}>
                  Add countdown before triggering SOS
                </Text>
              </View>
              <TouchableOpacity onPress={showTimerInfo} style={styles.infoButton}>
                <Ionicons name="information-circle-outline" size={20} color="#6b7280" />
              </TouchableOpacity>
            </View>
            <Switch
              value={!!settings.timerEnabled}
              onValueChange={v => updateSetting('timerEnabled', v)}
              trackColor={{ false: '#e5e7eb', true: '#a78bfa' }}
              thumbColor={settings.timerEnabled ? '#7c3aed' : '#f3f4f6'}
            />
          </View>

          {/* Timer Duration Setting */}
          {settings.timerEnabled && (
            <View style={styles.settingCard}>
              <View style={styles.settingHeader}>
                <View style={styles.settingIconContainer}>
                  <Ionicons name="time" size={24} color="#7c3aed" />
                </View>
                <View style={styles.settingContent}>
                  <Text style={styles.settingLabel}>Timer Duration</Text>
                  <Text style={styles.settingDescription}>
                    {settings.timerSeconds} seconds countdown
                  </Text>
                </View>
              </View>
              <View style={styles.timerControls}>
                <TouchableOpacity
                  style={[styles.timerButton, { opacity: (settings.timerSeconds ?? 30) <= 5 ? 0.5 : 1 }]}
                  onPress={() => adjustTimer(false)}
                  disabled={(settings.timerSeconds ?? 30) <= 5}
                >
                  <Ionicons name="remove" size={20} color="#7c3aed" />
                </TouchableOpacity>
                <Text style={styles.timerValue}>{settings.timerSeconds}s</Text>
                <TouchableOpacity
                  style={[styles.timerButton, { opacity: (settings.timerSeconds ?? 30) >= 300 ? 0.5 : 1 }]}
                  onPress={() => adjustTimer(true)}
                  disabled={(settings.timerSeconds ?? 30) >= 300}
                >
                  <Ionicons name="add" size={20} color="#7c3aed" />
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Buzzer Setting */}
          <View style={styles.settingCard}>
            <View style={styles.settingHeader}>
              <View style={styles.settingIconContainer}>
                <Ionicons name="volume-high" size={24} color="#7c3aed" />
              </View>
              <View style={styles.settingContent}>
                <Text style={styles.settingLabel}>Emergency Buzzer</Text>
                <Text style={styles.settingDescription}>
                  Play alert sound when SOS is triggered
                </Text>
              </View>
              <TouchableOpacity onPress={showBuzzerInfo} style={styles.infoButton}>
                <Ionicons name="information-circle-outline" size={20} color="#6b7280" />
              </TouchableOpacity>
            </View>
            <Switch
              value={!!settings.playBuzzerOnSOS}
              onValueChange={v => updateSetting('playBuzzerOnSOS', v)}
              trackColor={{ false: '#e5e7eb', true: '#a78bfa' }}
              thumbColor={settings.playBuzzerOnSOS ? '#7c3aed' : '#f3f4f6'}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  scrollContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
    marginLeft: 12,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  settingCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  settingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  settingContent: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 18,
  },
  infoButton: {
    padding: 4,
    marginRight: 8,
  },
  timerControls: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    padding: 4,
  },
  timerButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  timerValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginHorizontal: 16,
    minWidth: 32,
    textAlign: 'center',
  },
});

export default SettingsScreen;
