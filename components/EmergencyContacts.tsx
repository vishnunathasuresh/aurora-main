import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  TextInput,
  Modal,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { sosService } from '@/services/SOSService';
import { EmergencyContact } from '@/services/StorageService';

const EmergencyContacts = () => {
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [newContact, setNewContact] = useState<Partial<EmergencyContact>>({});
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadContacts();
  }, []);

  const loadContacts = async () => {
    const emergencyContacts = await sosService.loadEmergencyContacts();
    setContacts(sosService.getEmergencyContacts());
  };

  const handleAddContact = async () => {
    if (!newContact.name || !newContact.phone || !newContact.relationship) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    const contact: EmergencyContact = {
      name: newContact.name!,
      phone: newContact.phone!,
      relationship: newContact.relationship!,
    };
    await sosService.setEmergencyContacts([...contacts, contact]);
    setNewContact({});
    setIsAddModalVisible(false);
    loadContacts();
  };

  const handleRemoveContact = (phone: string) => {
    Alert.alert(
      'Remove Contact',
      'Are you sure you want to remove this emergency contact?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            sosService.removeEmergencyContact(phone);
            setContacts(contacts.filter(c => c.phone !== phone));
          },
        },
      ]
    );
  };

  const handleCallContact = (contact: EmergencyContact) => {
    Alert.alert(
      'Call Emergency Contact',
      `Call ${contact.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Call',
          onPress: async () => {
            try {
              await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
              await Linking.openURL(`tel:${contact.phone}`);
            } catch (error) {
              Alert.alert('Error', `Unable to call ${contact.name}. Please dial ${contact.phone} manually.`);
            }
          }
        },
      ]
    );
  };

  // Filter contacts based on search input
  const filteredContacts = contacts.filter(
    c =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.toLowerCase().includes(search.toLowerCase()) ||
      c.relationship.toLowerCase().includes(search.toLowerCase())
  );

  const renderContact = ({ item, index }: { item: EmergencyContact, index: number }) => (
    <View style={styles.contactCard}>
      <View style={styles.avatarWrap}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarNum}>{index + 1}</Text>
        </View>
      </View>
      <View style={styles.contactInfo}>
        <Text style={styles.contactName}>{item.name}</Text>
        <Text style={styles.contactRelation}>{item.relationship}</Text>
      </View>
      <View style={styles.actionWrap}>
        <TouchableOpacity onPress={() => handleCallContact(item)} style={styles.actionBtn}>
          <Ionicons name="call" size={20} color="#a78bfa" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleRemoveContact(item.phone)} style={styles.actionBtn}>
          <Ionicons name="trash" size={20} color="#f87171" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.bg}>
      <View style={styles.topSection}>
        <Text style={styles.appTitle}>Emergency Contacts</Text>
        <View style={styles.searchRow}>
          <Ionicons name="search" size={20} color="#a78bfa" style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search contacts from phonebook"
            value={search}
            onChangeText={setSearch}
            placeholderTextColor="#a78bfa"
          />
        </View>
        <View style={styles.priorityRow}>
          <Text style={styles.priorityTitle}>Priority Order</Text>
          <TouchableOpacity style={styles.sosBadge}>
            <Text style={styles.sosBadgeText}>SOS</Text>
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.listSection}>
        {filteredContacts.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={48} color="#9ca3af" />
            <Text style={styles.emptyStateText}>No emergency contacts added</Text>
            <Text style={styles.emptyStateSubtext}>
              Add contacts to receive SOS alerts
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredContacts}
            renderItem={renderContact}
            keyExtractor={(item) => item.phone}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.contactsList}
          />
        )}
      </View>
      <View style={styles.actionButtonsRow}>
        <TouchableOpacity style={styles.addBtn} onPress={() => setIsAddModalVisible(true)}>
          <Ionicons name="add" size={20} color="#fff" />
          <Text style={styles.addBtnText}>Add New Contact</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.removeBtn} onPress={() => contacts.length > 0 && handleRemoveContact(contacts[contacts.length-1].phone)}>
          <Text style={styles.removeBtnText}>Remove Contact</Text>
        </TouchableOpacity>
      </View>
      {/* Add Contact Modal */}
      <Modal
        visible={isAddModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsAddModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Emergency Contact</Text>
              <TouchableOpacity
                onPress={() => setIsAddModalVisible(false)}
                style={styles.closeModalButton}
              >
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Name</Text>
              <TextInput
                style={styles.textInput}
                value={newContact.name}
                onChangeText={(text) => setNewContact({ ...newContact, name: text })}
                placeholder="Enter contact name"
                placeholderTextColor="#9ca3af"
              />
            </View>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Phone Number</Text>
              <TextInput
                style={styles.textInput}
                value={newContact.phone}
                onChangeText={(text) => setNewContact({ ...newContact, phone: text })}
                placeholder="Enter phone number"
                placeholderTextColor="#9ca3af"
                keyboardType="phone-pad"
              />
            </View>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Relationship</Text>
              <TextInput
                style={styles.textInput}
                value={newContact.relationship}
                onChangeText={(text) => setNewContact({ ...newContact, relationship: text })}
                placeholder="e.g., Family, Friend, Emergency"
                placeholderTextColor="#9ca3af"
              />
            </View>
            <TouchableOpacity
              onPress={handleAddContact}
              style={styles.saveButton}
            >
              <Text style={styles.saveButtonText}>Add Contact</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  bg: {
    flex: 1,
    backgroundColor: '#f6f3ff',
    paddingTop: 0,
  },
  topSection: {
    alignItems: 'center',
    paddingTop: 32,
    paddingBottom: 12,
    backgroundColor: 'transparent',
  },
   appTitle: {
    paddingTop: 20,
    fontWeight: "600",
    paddingBottom: 12,
    fontSize: 32,
    color: '#1f2937',
    marginBottom: 2,
  },
  screenTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 2,
  },
  screenSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 18,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginHorizontal: 24,
    marginBottom: 12,
    shadowColor: '#a78bfa',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#7c3aed',
    backgroundColor: 'transparent',
    borderWidth: 0,
    padding: 0,
  },
  priorityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 24,
    marginBottom: 8,
  },
  priorityTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  sosBadge: {
    backgroundColor: '#f87171',
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 2,
    marginLeft: 8,
  },
  sosBadgeText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 13,
    letterSpacing: 1,
  },
  listSection: {
    flex: 1,
    paddingHorizontal: 0,
    paddingBottom: 0,
  },
  contactsList: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 12,
    marginHorizontal: 8,
    marginBottom: 12,
    shadowColor: '#a78bfa',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  avatarWrap: {
    marginRight: 12,
    position: 'relative',
  },
  avatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  avatarNum: {
    color: '#fff',
    backgroundColor: '#f87171',
    borderRadius: 12,
    width: 24,
    height: 24,
    textAlign: 'center',
    textAlignVertical: 'center',
    fontWeight: 'bold',
    fontSize: 16,
    overflow: 'hidden',
    lineHeight: 24,
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  contactRelation: {
    fontSize: 13,
    color: '#6b7280',
  },
  actionWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionBtn: {
    marginLeft: 8,
    backgroundColor: '#f3f4f6',
    borderRadius: 16,
    padding: 8,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 24,
    marginBottom: 24,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#a78bfa',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 8,
  },
  addBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
    marginLeft: 6,
  },
  removeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f87171',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  removeBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyStateText: {
    fontSize: 18,
    color: '#6b7280',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    lineHeight: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    width: '90%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
  },
  closeModalButton: {
    padding: 4,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1f2937',
    backgroundColor: '#f9fafb',
  },
  saveButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default EmergencyContacts;
