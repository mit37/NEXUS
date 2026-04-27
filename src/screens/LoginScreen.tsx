import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Animated, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as LocalAuthentication from 'expo-local-authentication';
import { Fingerprint } from 'lucide-react-native';

const ScanlineOverlay = () => (
  <View pointerEvents="none" style={styles.scanlineOverlay}>
    {Array.from({ length: 100 }).map((_, i) => (
      <View key={i} style={styles.scanline} />
    ))}
  </View>
);

interface LoginScreenProps {
  onLoginSuccess: () => void;
}

export default function LoginScreen({ onLoginSuccess }: LoginScreenProps) {
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authStatus, setAuthStatus] = useState<'idle' | 'failed'>('idle');
  const pulseAnim = React.useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 0.5, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true })
      ])
    ).start();
    
    // Auto-prompt on mount
    handleBiometricAuth();
  }, []);

  const handleBiometricAuth = async () => {
    try {
      setIsAuthenticating(true);
      setAuthStatus('idle');

      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();

      if (!hasHardware || !isEnrolled) {
        // Fallback for emulators or devices without biometrics
        console.log("No biometrics available, bypassing for dev");
        onLoginSuccess();
        return;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'NEXUS COMMAND AUTHORIZATION REQUIRED',
        cancelLabel: 'CANCEL',
        disableDeviceFallback: false,
      });

      if (result.success) {
        onLoginSuccess();
      } else {
        setAuthStatus('failed');
      }
    } catch (error) {
      console.error('Auth error:', error);
      setAuthStatus('failed');
    } finally {
      setIsAuthenticating(false);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['rgba(0,255,65,0.05)', 'rgba(0,0,0,1)']} style={StyleSheet.absoluteFill} />
      <ScanlineOverlay />
      
      <View style={styles.content}>
        <Text style={styles.title}>NEXUS // MOBILE COMMAND</Text>
        <Text style={styles.subtitle}>RESTRICTED ACCESS</Text>

        <TouchableOpacity 
          style={styles.authContainer} 
          onPress={handleBiometricAuth}
          disabled={isAuthenticating}
        >
          <Animated.View style={[styles.iconWrapper, { opacity: pulseAnim }]}>
            <Fingerprint color="#00FF41" size={80} strokeWidth={1} />
          </Animated.View>
          
          <Text style={[
            styles.authText, 
            authStatus === 'failed' && { color: '#FF003C' }
          ]}>
            {isAuthenticating ? 'VERIFYING IDENTITY...' : 
             authStatus === 'failed' ? 'AUTHORIZATION FAILED. RETRY.' : 
             'TAP TO AUTHORIZE'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  scanlineOverlay: { ...StyleSheet.absoluteFillObject, opacity: 0.05, overflow: 'hidden', zIndex: 10 },
  scanline: { height: 2, backgroundColor: '#000', marginBottom: 2 },
  content: { flex: 1, padding: 20, justifyContent: 'center', alignItems: 'center', zIndex: 20 },
  title: { color: '#00FF41', fontFamily: 'monospace', fontSize: 22, fontWeight: 'bold', letterSpacing: 2, marginBottom: 8, textAlign: 'center' },
  subtitle: { color: '#FF003C', fontFamily: 'monospace', fontSize: 14, letterSpacing: 4, marginBottom: 60, textAlign: 'center' },
  authContainer: { alignItems: 'center', padding: 40, borderWidth: 1, borderColor: 'rgba(0,255,65,0.2)', backgroundColor: 'rgba(0,255,65,0.05)' },
  iconWrapper: { marginBottom: 24 },
  authText: { color: '#00FF41', fontFamily: 'monospace', fontSize: 12, letterSpacing: 2, textAlign: 'center' }
});
