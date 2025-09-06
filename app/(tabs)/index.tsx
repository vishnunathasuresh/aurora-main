import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  StatusBar,
  TouchableOpacity,
  Dimensions,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { databaseService } from '@/services/DatabaseService';
import { sosService } from '@/services/SOSService';

export default function HomeScreen() {
  const [isSOSActive, setIsSOSActive] = useState(false);
  const [timer, setTimer] = useState<number | null>(null);
  const [pulseAnim] = useState(new Animated.Value(1));
  const [showTimer, setShowTimer] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        await databaseService.initDatabase();
        await sosService.syncPendingAlerts();
        // Load timer settings from persistent storage
        const settings = await sosService.loadUserSettings();
        setTimer(settings.timerEnabled ? settings.timerSeconds ?? 30 : null);
      } catch (e) {
        console.error('Init error', e);
      }
    })();
  }, []);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isSOSActive && typeof timer === 'number' && timer > 0) {
      interval = setInterval(() => setTimer(t => (typeof t === 'number' ? t - 1 : 0)), 1000);
      setShowTimer(true);
    } else if (timer === 0) {
      setIsSOSActive(false);
      setShowTimer(false);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isSOSActive, timer]);

  useEffect(() => {
    if (isSOSActive) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.2, duration: 1000, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isSOSActive, pulseAnim]);

  const handleSOSTriggered = async () => {
    setIsSOSActive(true);
    const settings = await sosService.loadUserSettings();
    setTimer(settings.timerEnabled ? settings.timerSeconds ?? 30 : null);
    setShowTimer(true);
    Alert.alert('SOS Activated', 'Emergency SOS has been activated. Your location has been sent to emergency contacts.');
  };

  const handleSOSCancelled = () => {
    setIsSOSActive(false);
    setShowTimer(false);
    setTimer(null);
    Alert.alert('SOS Cancelled', 'Emergency SOS has been cancelled.');
  };

  // Quick Actions
  const handleShareLocation = () => Alert.alert('Share Location', 'Location shared!');
  const handleEmergencyCall = () => Alert.alert('Emergency Call', 'Calling 112...');
  const handleSilentAlarm = () => Alert.alert('Silent Alarm', 'Silent alarm triggered!');

  // UI
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f9fafb" />
      <View style={styles.header}>
        <Ionicons name="flower" size={36} color="#a78bfa" style={{ marginRight: 8 }} />
        <View>
          <Text style={styles.appTitle}>Aurora</Text>
          <Text style={styles.appSubtitle}>Your Safety, Our Priority</Text>
        </View>
      </View>
      <View style={styles.sosContainer}>
        <Animated.View style={[styles.sosButtonWrap, { transform: [{ scale: pulseAnim }] }] }>
          <TouchableOpacity
            style={styles.sosButton}
            activeOpacity={0.8}
            onPress={isSOSActive ? handleSOSCancelled : handleSOSTriggered}
            disabled={showTimer}
          >
            <Text style={styles.sosText}>SOS</Text>
          </TouchableOpacity>
          {showTimer && (
            <View style={styles.timerOverlay}>
              <Text style={styles.sendingText}>Sending alert in...</Text>
              <Text style={styles.timerText}>{typeof timer === 'number' ? `${String(Math.floor(timer/60)).padStart(2,'0')}:${String(timer%60).padStart(2,'0')}` : '--:--'}</Text>
              <TouchableOpacity style={styles.cancelBtn} onPress={handleSOSCancelled}>
                <Text style={styles.cancelBtnText}>CANCEL</Text>
              </TouchableOpacity>
            </View>
          )}
        </Animated.View>
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.actionBtn} onPress={handleShareLocation}>
            <MaterialIcons name="location-on" size={28} color="#22c55e" />
            <Text style={styles.actionText}>Share Location</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={handleEmergencyCall}>
            <MaterialIcons name="call" size={28} color="#2563eb" />
            <Text style={styles.actionText}>Emergency Call</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={handleSilentAlarm}>
            <MaterialCommunityIcons name="bell-ring-outline" size={28} color="#a21caf" />
            <Text style={styles.actionText}>Silent Alarm</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const { width } = Dimensions.get('window');
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f6f3ff',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 36,
    marginBottom: 24,
  },
  appTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#7c3aed',
    letterSpacing: 1,
  },
  appSubtitle: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 2,
  },
  sosContainer: {
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 32,
    width: '100%',
  },
  sosButtonWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  sosButton: {
    width: width * 0.55,
    height: width * 0.55,
    borderRadius: width * 0.275,
    backgroundColor: '#ef4444',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  sosText: {
    color: '#fff',
    fontSize: 48,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  timerOverlay: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -width * 0.275 }, { translateY: -width * 0.275 }],
    width: width * 0.55,
    height: width * 0.55,
    borderRadius: width * 0.275,
    backgroundColor: 'rgba(255,255,255,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  sendingText: {
    color: '#ef4444',
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 8,
  },
  timerText: {
    color: '#ef4444',
    fontWeight: 'bold',
    fontSize: 36,
    marginBottom: 12,
  },
  cancelBtn: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#a78bfa',
    borderRadius: 24,
    paddingHorizontal: 32,
    paddingVertical: 8,
  },
  cancelBtnText: {
    color: '#a78bfa',
    fontWeight: 'bold',
    fontSize: 18,
    letterSpacing: 1,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '90%',
    marginTop: 8,
  },
  actionBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 12,
    marginHorizontal: 6,
    flex: 1,
    elevation: 2,
    shadowColor: '#a78bfa',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  actionText: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 4,
    fontWeight: '600',
  },
});
