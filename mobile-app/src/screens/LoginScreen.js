import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import {
  Text,
  TextInput,
  Button,
  Card,
  Title,
  Paragraph,
  ActivityIndicator,
} from 'react-native-paper';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const { login } = useAuth();
  const { theme, colors } = useTheme();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    const result = await login(email, password);
    setLoading(false);
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <Title style={[styles.title, { color: colors.primary }]}>
            📚 Library Management
          </Title>
          <Paragraph style={[styles.subtitle, { color: colors.onSurface }]}>
            Sign in to access your digital library
          </Paragraph>
        </View>

        <Card style={[styles.card, { backgroundColor: colors.surface }]}>
          <Card.Content style={styles.cardContent}>
            <Title style={[styles.cardTitle, { color: colors.onSurface }]}>
              Welcome Back
            </Title>

            <TextInput
              label="Email"
              value={email}
              onChangeText={setEmail}
              mode="outlined"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              style={styles.input}
              theme={{ colors: { background: colors.surface } }}
            />

            <TextInput
              label="Password"
              value={password}
              onChangeText={setPassword}
              mode="outlined"
              secureTextEntry={!showPassword}
              right={
                <TextInput.Icon
                  icon={showPassword ? 'eye-off' : 'eye'}
                  onPress={() => setShowPassword(!showPassword)}
                />
              }
              style={styles.input}
              theme={{ colors: { background: colors.surface } }}
            />

            <Button
              mode="contained"
              onPress={handleLogin}
              loading={loading}
              disabled={loading}
              style={[styles.button, { backgroundColor: colors.primary }]}
              contentStyle={styles.buttonContent}
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </Button>

            <View style={styles.footer}>
              <Paragraph style={[styles.footerText, { color: colors.onSurface }]}>
                Don't have an account?
              </Paragraph>
              <Button
                mode="text"
                onPress={() => navigation.navigate('Register')}
                compact
                textColor={colors.primary}
              >
                Sign Up
              </Button>
            </View>
          </Card.Content>
        </Card>

        <View style={styles.infoSection}>
          <Paragraph style={[styles.infoText, { color: colors.onSurface }]}>
            Default Admin Account:
          </Paragraph>
          <Paragraph style={[styles.infoText, { color: colors.primary }]}>
            Email:subhamrajx@gmail.com
          </Paragraph>
          <Paragraph style={[styles.infoText, { color: colors.primary }]}>
            Password:1234567890
          </Paragraph>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
  card: {
    elevation: 4,
    borderRadius: 12,
  },
  cardContent: {
    padding: 24,
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 24,
  },
  input: {
    marginBottom: 16,
  },
  button: {
    marginTop: 8,
    borderRadius: 8,
  },
  buttonContent: {
    paddingVertical: 12,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  footerText: {
    marginRight: 4,
  },
  infoSection: {
    marginTop: 30,
    padding: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    alignItems: 'center',
  },
  infoText: {
    fontSize: 12,
    marginBottom: 2,
  },
});

export default LoginScreen;
