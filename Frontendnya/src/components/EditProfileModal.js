import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';

const EditProfileModal = ({ visible, onClose, currentName, currentEmail, onUpdate }) => {
  const [name, setName] = useState(currentName || '');
  const [loading, setLoading] = useState(false);

  // Reset name ketika modal dibuka/ditutup
  React.useEffect(() => {
    if (visible) {
      setName(currentName || '');
    }
  }, [visible, currentName]);

  const handleSave = async () => {
    // Validation
    if (!name.trim()) {
      Alert.alert('Error', 'Name cannot be empty');
      return;
    }

    if (name.trim().length < 2) {
      Alert.alert('Error', 'Name must be at least 2 characters');
      return;
    }

    if (name.length > 50) {
      Alert.alert('Error', 'Name must not exceed 50 characters');
      return;
    }

    if (name.trim() === currentName) {
      Alert.alert('Info', 'No changes made');
      return;
    }

    try {
      setLoading(true);
      await onUpdate(name.trim());
      onClose();
    } catch (error) {
      console.error('Update profile error:', error);
      Alert.alert('Error', error.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setName(currentName || '');
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <View style={styles.overlay}>
          <View style={styles.modalContent}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>Edit Profile</Text>
              <TouchableOpacity 
                onPress={handleClose} 
                disabled={loading}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#0F172A" />
              </TouchableOpacity>
            </View>

            {/* Form */}
            <ScrollView 
              style={styles.form}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Name</Text>
                <TextInput
                  style={styles.input}
                  value={name}
                  onChangeText={setName}
                  placeholder="Enter your name"
                  placeholderTextColor="#94A3B8"
                  maxLength={50}
                  autoFocus
                  editable={!loading}
                />
                <Text style={styles.characterCount}>
                  {name.length}/50 characters
                </Text>
              </View>

              {/* Email Field - READ ONLY */}
              {currentEmail && (
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Email (cannot be changed)</Text>
                  <View style={styles.readOnlyContainer}>
                    <Ionicons name="mail" size={20} color="#64748B" style={{ marginRight: 10 }} />
                    <Text style={styles.readOnlyText}>{currentEmail}</Text>
                  </View>
                </View>
              )}

              {/* Info */}
              <View style={styles.infoBox}>
                <Ionicons name="information-circle" size={20} color="#58CC02" />
                <Text style={styles.infoText}>
                  Only your display name can be updated. Email address cannot be changed for security reasons.
                </Text>
              </View>
            </ScrollView>

            {/* Buttons */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={handleClose}
                disabled={loading}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.saveButton, loading && styles.disabledButton]}
                onPress={handleSave}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.saveButtonText}>Save Changes</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    width: '100%',
    maxWidth: 500,
    maxHeight: '80%',
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  closeButton: {
    padding: 5,
  },
  form: {
    flex: 1,
    marginBottom: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    color: '#0F172A',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  readOnlyContainer: {
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  readOnlyText: {
    fontSize: 16,
    color: '#64748B',
    flex: 1,
  },
  characterCount: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 5,
    textAlign: 'right',
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#58CC0220',
    padding: 12,
    borderRadius: 10,
    alignItems: 'flex-start',
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#64748B',
    marginLeft: 10,
    lineHeight: 18,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  button: {
    flex: 1,
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cancelButtonText: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#58CC02',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  disabledButton: {
    opacity: 0.6,
  },
});

export default EditProfileModal;
