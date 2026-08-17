import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ShieldCheck } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { TYPOGRAPHY, SPACING, RADIUS } from '@/constants/theme';
import { AnimatedPressable } from '@/components/AnimatedPressable';

const NAVY = '#0B1220';
const TEAL = '#14B8A6';
const WHITE = '#FFFFFF';
const SLATE = 'rgba(255,255,255,0.65)';
const WHITE_BORDER = 'rgba(255,255,255,0.35)';

export default function WelcomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { enterGuestMode } = useAuth();
  const [guestLoading, setGuestLoading] = React.useState(false);

  const handleCreateAccount = () => {
    console.log('[WelcomeScreen] Create Account pressed');
    router.push('/(auth)/sign-up');
  };

  const handleSignIn = () => {
    console.log('[WelcomeScreen] Sign In pressed');
    router.push('/(auth)/sign-in');
  };

  const handleGuest = async () => {
    console.log('[WelcomeScreen] Continue as guest pressed');
    setGuestLoading(true);
    try {
      await enterGuestMode();
      router.replace('/(tabs)/(scan)');
    } finally {
      setGuestLoading(false);
    }
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: NAVY }}
      contentContainerStyle={{
        flexGrow: 1,
        paddingTop: insets.top + SPACING.xxl,
        paddingBottom: insets.bottom + SPACING.xl,
        paddingHorizontal: SPACING.lg,
        justifyContent: 'space-between',
      }}
      showsVerticalScrollIndicator={false}
    >
      {/* Hero */}
      <View style={{ alignItems: 'center', gap: SPACING.lg }}>
        <ShieldCheck size={64} color={TEAL} />
        <View style={{ alignItems: 'center', gap: SPACING.sm }}>
          <Text style={[TYPOGRAPHY.display, { color: WHITE, textAlign: 'center' }]}>
            InvisiProof
          </Text>
          <Text
            style={[
              TYPOGRAPHY.h3,
              { color: TEAL, textAlign: 'center', fontWeight: '500' },
            ]}
          >
            Verify before you trust, meet, or pay.
          </Text>
        </View>
        <Text
          style={[
            TYPOGRAPHY.body,
            {
              color: SLATE,
              textAlign: 'center',
              maxWidth: 320,
              lineHeight: 24,
            },
          ]}
        >
          Create a private account to securely save reports, manage proof requests, and access your information across devices.
        </Text>
      </View>

      {/* Actions */}
      <View style={{ gap: SPACING.md, marginTop: SPACING.xxl }}>
        {/* Primary: Create Account */}
        <AnimatedPressable
          onPress={handleCreateAccount}
          accessibilityRole="button"
          accessibilityLabel="Create Account"
          style={{
            backgroundColor: TEAL,
            height: 52,
            borderRadius: RADIUS.md,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={[TYPOGRAPHY.bodyMedium, { color: WHITE, fontWeight: '600' }]}>
            Create Account
          </Text>
        </AnimatedPressable>

        {/* Secondary: Sign In */}
        <AnimatedPressable
          onPress={handleSignIn}
          accessibilityRole="button"
          accessibilityLabel="Sign In"
          style={{
            backgroundColor: 'transparent',
            height: 52,
            borderRadius: RADIUS.md,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 1.5,
            borderColor: WHITE_BORDER,
          }}
        >
          <Text style={[TYPOGRAPHY.bodyMedium, { color: WHITE, fontWeight: '600' }]}>
            Sign In
          </Text>
        </AnimatedPressable>

        {/* Guest link */}
        <TouchableOpacity
          onPress={handleGuest}
          disabled={guestLoading}
          accessibilityRole="button"
          accessibilityLabel="Continue without an account"
          style={{
            alignItems: 'center',
            paddingVertical: SPACING.sm,
            minHeight: 44,
            justifyContent: 'center',
          }}
        >
          {guestLoading ? (
            <ActivityIndicator color={SLATE} size="small" />
          ) : (
            <Text style={[TYPOGRAPHY.body, { color: SLATE }]}>
              Continue without an account
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
