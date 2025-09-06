import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Switch, Button } from 'react-native';
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

  if (loading) return <View style={styles.container}><Text>Loading...</Text></View>;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Settings</Text>
      <View style={styles.settingRow}>
        <Text style={styles.label}>Enable Timer</Text>
        <Switch value={!!settings.timerEnabled} onValueChange={v => updateSetting('timerEnabled', v)} />
      </View>
      <View style={styles.settingRow}>
        <Text style={styles.label}>SOS Timer ({settings.timerSeconds} sec)</Text>
        <Button title="-" onPress={() => updateSetting('timerSeconds', Math.max(5, (settings.timerSeconds ?? 30) - 5))} />
        <Button title="+" onPress={() => updateSetting('timerSeconds', Math.min(300, (settings.timerSeconds ?? 30) + 5))} />
      </View>
      <View style={styles.settingRow}>
        <Text style={styles.label}>Play Buzzer on SOS</Text>
        <Switch value={!!settings.playBuzzerOnSOS} onValueChange={v => updateSetting('playBuzzerOnSOS', v)} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f6f3ff',
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#7c3aed',
    marginBottom: 16,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    color: '#1f2937',
  },
});

export default SettingsScreen;
