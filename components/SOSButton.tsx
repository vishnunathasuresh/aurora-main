import React, { useState, useEffect } from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  Alert,
  Animated,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { sosService } from '@/services/SOSService';

const { width } = Dimensions.get('window');

interface SOSButtonProps {
  onSOSTriggered?: () => void;
  onSOSCancelled?: () => void;
}

export const SOSButton: React.FC<SOSButtonProps> = ({
  onSOSTriggered,
  onSOSCancelled,
}) => {
  const [isActive, setIsActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes in seconds
  const [pulseAnim] = useState(new Animated.Value(1));

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;

    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsActive(false);
      onSOSCancelled?.();
    }

    return () => {
      if (interval !== undefined) clearInterval(interval);
    };
  }, [isActive, timeLeft, onSOSCancelled]);

  useEffect(() => {
    if (isActive) {
      // Start pulsing animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isActive, pulseAnim]);

  const handleSOSPress = async () => {
    if (isActive) {
      // Cancel SOS
      const success = await sosService.cancelSOS();
      if (success) {
        setIsActive(false);
        setTimeLeft(300);
        onSOSCancelled?.();
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } else {
      // Trigger SOS
      Alert.alert(
        'Emergency SOS',
        'Are you sure you want to trigger an emergency SOS? This will send your location to emergency contacts.',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'SOS',
            style: 'destructive',
            onPress: async () => {
              const success = await sosService.triggerSOS();
              if (success) {
                setIsActive(true);
                setTimeLeft(300);
                onSOSTriggered?.();
                await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
              } else {
                Alert.alert('Error', 'Failed to trigger SOS. Please try again.');
              }
            },
          },
        ]
      );
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.buttonContainer,
          {
            transform: [{ scale: pulseAnim }],
          },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.sosButton,
            isActive ? styles.sosButtonActive : styles.sosButtonInactive,
          ]}
          onPress={handleSOSPress}
          activeOpacity={0.8}
        >
          <Ionicons
            name={isActive ? 'close-circle' : 'warning'}
            size={48}
            color="white"
          />
          <Text style={styles.sosText}>
            {isActive ? 'CANCEL SOS' : 'SOS'}
          </Text>
        </TouchableOpacity>
      </Animated.View>

      {isActive && (
        <View style={styles.timerContainer}>
          <Text style={styles.timerText}>
            Cancel in: {formatTime(timeLeft)}
          </Text>
          <Text style={styles.timerSubtext}>
            Tap SOS button to cancel
          </Text>
        </View>
      )}

      <View style={styles.emergencyInfo}>
        <Text style={styles.emergencyText}>
          Emergency contacts will be notified with your location
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    padding: 20,
  },
  buttonContainer: {
    marginBottom: 20,
  },
  sosButton: {
    width: width * 0.6,
    height: width * 0.6,
    borderRadius: (width * 0.6) / 2,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  sosButtonInactive: {
    backgroundColor: '#dc2626', // Red
  },
  sosButtonActive: {
    backgroundColor: '#059669', // Green
  },
  sosText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 8,
    textAlign: 'center',
  },
  timerContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  timerText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#dc2626',
    marginBottom: 4,
  },
  timerSubtext: {
    fontSize: 14,
    color: '#6b7280',
  },
  emergencyInfo: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  emergencyText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
  },
});