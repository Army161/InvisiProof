import React from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { Redirect } from 'expo-router';
import { ShieldCheck } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';

export default function AuthGate() {
  const { user, isGuest, loading, sessionExpired } = useAuth();

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: '#0B1220',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 24,
        }}
      >
        <ShieldCheck size={64} color="#14B8A6" />
        <Text
          style={{
            fontSize: 30,
            fontWeight: '700',
            color: '#FFFFFF',
            letterSpacing: -0.5,
          }}
        >
          ProofLoop
        </Text>
        <ActivityIndicator color="#14B8A6" size="large" />
      </View>
    );
  }

  if (user) {
    return <Redirect href="/(tabs)/(scan)" />;
  }

  if (isGuest) {
    return <Redirect href="/(tabs)/(scan)" />;
  }

  if (sessionExpired) {
    return <Redirect href="/(auth)/sign-in?expired=1" />;
  }

  return <Redirect href="/(auth)/welcome" />;
}
