import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Chip, IconButton } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useNetInfo } from '@react-native-community/netinfo';
import { useTheme } from '../contexts/ThemeContext';

const OfflineIndicator = ({ onSyncPress, syncStatus }) => {
  const netInfo = useNetInfo();
  const { colors } = useTheme();

  if (netInfo.isConnected) {
    return null;
  }

  return (
    <View style={[styles.container, { backgroundColor: '#fef2f2' }]}>
      <View style={styles.content}>
        <Ionicons name="wifi-off" size={20} color="#dc2626" />
        <Text style={[styles.text, { color: '#dc2626' }]}>
          You're offline
        </Text>
        <Text style={[styles.subtext, { color: '#7f1d1d' }]}>
          Showing cached data
        </Text>
      </View>
      
      {syncStatus?.queueLength > 0 && (
        <Chip
          style={[styles.syncChip, { backgroundColor: '#dc2626' }]}
          textStyle={{ color: '#ffffff' }}
          onPress={onSyncPress}
        >
          {syncStatus.queueLength} pending
        </Chip>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#fecaca',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  text: {
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  subtext: {
    fontSize: 12,
    marginLeft: 8,
    fontStyle: 'italic',
  },
  syncChip: {
    height: 28,
  },
});

export default OfflineIndicator;
