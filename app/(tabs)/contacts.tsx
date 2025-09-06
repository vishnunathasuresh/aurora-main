import React from 'react';
import { View } from 'react-native';
import EmergencyContacts from '../../components/EmergencyContacts';

const ContactsScreen: React.FC = () => {
  return (
    <View style={{ flex: 1 }}>
      <EmergencyContacts />
    </View>
  );
};

export default ContactsScreen;

