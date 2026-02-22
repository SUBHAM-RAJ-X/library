import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import {
  Text,
  Card,
  Title,
  Paragraph,
  Button,
  List,
  Avatar,
  Chip,
  ActivityIndicator,
  Divider,
} from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { apiService } from '../services/supabase';
import Toast from 'react-native-toast-message';

const ProfileScreen = () => {
  const [userStats, setUserStats] = useState({
    booksUploaded: 0,
    downloadsMade: 0,
    recentActivity: [],
  });
  const [loading, setLoading] = useState(true);
  const [appVersion, setAppVersion] = useState('1.0.0');
  
  const { user, logout, isAdmin } = useAuth();
  const { theme, colors, isDarkMode, toggleTheme } = useTheme();

  useEffect(() => {
    loadUserStats();
  }, []);

  const loadUserStats = async () => {
    try {
      setLoading(true);
      
      // Get download history
      const { downloads } = await apiService.getDownloadHistory({ limit: 10 });
      
      // Get user's uploaded books
      const { books } = await apiService.getBooks({ 
        uploaded_by: user.id, 
        limit: 10 
      });

      setUserStats({
        booksUploaded: books?.length || 0,
        downloadsMade: downloads?.length || 0,
        recentActivity: [
          ...downloads?.map(d => ({
            id: d.id,
            type: 'download',
            title: d.books?.title || 'Unknown Book',
            date: d.downloaded_at,
            icon: 'download',
          })) || [],
          ...books?.map(b => ({
            id: b.id,
            type: 'upload',
            title: b.title,
            date: b.created_at,
            icon: 'upload',
          })) || [],
        ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5),
      });
    } catch (error) {
      console.error('Error loading user stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: logout,
        },
      ]
    );
  };

  const handleThemeToggle = () => {
    toggleTheme();
    Toast.show({
      type: 'success',
      text1: 'Theme Changed',
      text2: isDarkMode ? 'Switched to light mode' : 'Switched to dark mode',
    });
  };

  const handleOpenAdminPanel = () => {
    // This would navigate to admin panel or open web dashboard
    Toast.show({
      type: 'info',
      text1: 'Admin Panel',
      text2: 'Admin dashboard will open in web browser',
    });
  };

  const renderActivityItem = (activity) => (
    <List.Item
      key={activity.id}
      title={activity.title}
      description={`${activity.type === 'download' ? 'Downloaded' : 'Uploaded'} • ${new Date(activity.date).toLocaleDateString()}`}
      left={(props) => (
        <List.Icon
          {...props}
          icon={activity.icon}
          color={colors.primary}
        />
      )}
      style={styles.activityItem}
    />
  );

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.onSurface }]}>
          Loading profile...
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Profile Header */}
      <Card style={[styles.profileCard, { backgroundColor: colors.surface }]}>
        <Card.Content style={styles.profileContent}>
          <Avatar.Text
            size={80}
            label={user?.email?.charAt(0).toUpperCase() || 'U'}
            style={[styles.avatar, { backgroundColor: colors.primary }]}
            labelStyle={{ color: '#ffffff' }}
          />
          <Title style={[styles.userName, { color: colors.onSurface }]}>
            {user?.email?.split('@')[0] || 'User'}
          </Title>
          <Paragraph style={[styles.userEmail, { color: colors.onSurface }]}>
            {user?.email}
          </Paragraph>
          <Chip style={[styles.roleChip, { backgroundColor: colors.primary }]}>
            {user?.role || 'student'}
          </Chip>
        </Card.Content>
      </Card>

      {/* Statistics */}
      <Card style={[styles.statsCard, { backgroundColor: colors.surface }]}>
        <Card.Content>
          <Title style={[styles.sectionTitle, { color: colors.onSurface }]}>
            📊 Your Statistics
          </Title>
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: colors.primary }]}>
                {userStats.booksUploaded}
              </Text>
              <Text style={[styles.statLabel, { color: colors.onSurface }]}>
                Books Uploaded
              </Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: colors.primary }]}>
                {userStats.downloadsMade}
              </Text>
              <Text style={[styles.statLabel, { color: colors.onSurface }]}>
                Downloads Made
              </Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Recent Activity */}
      {userStats.recentActivity.length > 0 && (
        <Card style={[styles.activityCard, { backgroundColor: colors.surface }]}>
          <Card.Content>
            <Title style={[styles.sectionTitle, { color: colors.onSurface }]}>
              🕐 Recent Activity
            </Title>
            {userStats.recentActivity.map(renderActivityItem)}
          </Card.Content>
        </Card>
      )}

      {/* Settings */}
      <Card style={[styles.settingsCard, { backgroundColor: colors.surface }]}>
        <Card.Content>
          <Title style={[styles.sectionTitle, { color: colors.onSurface }]}>
            ⚙️ Settings
          </Title>

          <List.Item
            title="Dark Mode"
            description={isDarkMode ? 'Currently enabled' : 'Currently disabled'}
            left={(props) => (
              <List.Icon
                {...props}
                icon={isDarkMode ? 'moon-waning-crescent' : 'white-balance-sunny'}
                color={colors.primary}
              />
            )}
            right={(props) => (
              <List.Icon
                {...props}
                icon={isDarkMode ? 'toggle-switch' : 'toggle-switch-off'}
                color={colors.primary}
              />
            )}
            onPress={handleThemeToggle}
            style={styles.settingItem}
          />

          {isAdmin && (
            <List.Item
              title="Admin Panel"
              description="Manage library settings"
              left={(props) => (
                <List.Icon
                  {...props}
                  icon="shield-account"
                  color={colors.primary}
                />
              )}
              right={(props) => (
                <List.Icon
                  {...props}
                  icon="chevron-right"
                  color={colors.onSurface}
                />
              )}
              onPress={handleOpenAdminPanel}
              style={styles.settingItem}
            />
          )}

          <Divider style={styles.divider} />

          <List.Item
            title="About"
            description={`Library Management v${appVersion}`}
            left={(props) => (
              <List.Icon
                {...props}
                icon="information"
                color={colors.primary}
              />
            )}
            style={styles.settingItem}
          />

          <List.Item
            title="Privacy Policy"
            description="View our privacy policy"
            left={(props) => (
              <List.Icon
                {...props}
                icon="shield-check"
                color={colors.primary}
              />
            )}
            style={styles.settingItem}
          />

          <List.Item
            title="Terms of Service"
            description="View our terms of service"
            left={(props) => (
              <List.Icon
                {...props}
                icon="file-document"
                color={colors.primary}
              />
            )}
            style={styles.settingItem}
          />
        </Card.Content>
      </Card>

      {/* Logout Button */}
      <View style={styles.logoutContainer}>
        <Button
          mode="outlined"
          onPress={handleLogout}
          style={[styles.logoutButton, { borderColor: '#ef4444' }]}
          textColor="#ef4444"
          icon="logout"
        >
          Logout
        </Button>
      </View>

      <View style={styles.footer}>
        <Text style={[styles.footerText, { color: colors.onSurface }]}>
          Made with ❤️ for book lovers
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  profileCard: {
    margin: 16,
    elevation: 4,
  },
  profileContent: {
    alignItems: 'center',
    padding: 24,
  },
  avatar: {
    marginBottom: 16,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    marginBottom: 12,
  },
  roleChip: {
    height: 32,
  },
  statsCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 14,
    marginTop: 4,
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    height: 60,
    backgroundColor: '#e5e7eb',
  },
  activityCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    elevation: 2,
  },
  activityItem: {
    paddingVertical: 4,
  },
  settingsCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    elevation: 2,
  },
  settingItem: {
    paddingVertical: 4,
  },
  divider: {
    marginVertical: 8,
  },
  logoutContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  logoutButton: {
    borderRadius: 8,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  footerText: {
    fontSize: 12,
    fontStyle: 'italic',
  },
});

export default ProfileScreen;
