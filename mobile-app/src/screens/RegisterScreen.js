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
  RadioButton,
} from 'react-native-paper';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

const RegisterScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('student');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const { register } = useAuth();
  const { theme, colors } = useTheme();

  const validateForm = () => {
    if (!email || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return false;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return false;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return false;
    }

    return true;
  };

  const handleRegister = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    const result = await register(email, password, role);
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
            📚 Create Account
          </Title>
          <Paragraph style={[styles.subtitle, { color: colors.onSurface }]}>
            Join our digital library community
          </Paragraph>
        </View>

        <Card style={[styles.card, { backgroundColor: colors.surface }]}>
          <Card.Content style={styles.cardContent}>
            <Title style={[styles.cardTitle, { color: colors.onSurface }]}>
              Sign Up
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

            <TextInput
              label="Confirm Password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              mode="outlined"
              secureTextEntry={!showConfirmPassword}
              right={
                <TextInput.Icon
                  icon={showConfirmPassword ? 'eye-off' : 'eye'}
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                />
              }
              style={styles.input}
              theme={{ colors: { background: colors.surface } }}
            />

            <View style={styles.roleSection}>
              <Text style={[styles.roleLabel, { color: colors.onSurface }]}>
                Account Type:
              </Text>
              <RadioButton.Group
                onValueChange={newValue => setRole(newValue)}
                value={role}
              >
                <View style={styles.radioOption}>
                  <RadioButton value="student" color={colors.primary} />
                  <Text style={[styles.radioText, { color: colors.onSurface }]}>
                    Student
                  </Text>
                </View>
                <View style={styles.radioOption}>
                  <RadioButton value="admin" color={colors.primary} />
                  <Text style={[styles.radioText, { color: colors.onSurface }]}>
                    Administrator
                  </Text>
                </View>
              </RadioButton.Group>
            </View>

            <Button
              mode="contained"
              onPress={handleRegister}
              loading={loading}
              disabled={loading}
              style={[styles.button, { backgroundColor: colors.primary }]}
              contentStyle={styles.buttonContent}
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </Button>

            <View style={styles.footer}>
              <Paragraph style={[styles.footerText, { color: colors.onSurface }]}>
                Already have an account?
              </Paragraph>
              <Button
                mode="text"
                onPress={() => navigation.navigate('Login')}
                compact
                textColor={colors.primary}
              >
                Sign In
              </Button>
            </View>
          </Card.Content>
        </Card>

        <View style={styles.infoSection}>
          <Paragraph style={[styles.infoText, { color: colors.onSurface }]}>
            Note: Admin accounts have additional privileges for managing the library.
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
  roleSection: {
    marginBottom: 20,
  },
  roleLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  radioText: {
    fontSize: 16,
    marginLeft: 8,
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
    textAlign: 'center',
  },
});

export default RegisterScreen;
