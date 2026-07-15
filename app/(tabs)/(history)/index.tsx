import React, { useState } from 'react';
import { View, Text, ScrollView, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Search, ListFilter, Layers, ArrowUpDown, FileSearch } from 'lucide-react-native';
import { useAppTheme } from '@/hooks/useAppTheme';
import { TYPOGRAPHY, SPACING, RADIUS } from '@/constants/theme';
import { EmptyStateCard } from '@/components/EmptyStateCard';
import { AnimatedPressable } from '@/components/AnimatedPressable';

export default function HistoryScreen() {
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [searchText, setSearchText] = useState('');

  const handleGoToScan = () => {
    console.log('[HistoryScreen] navigate to scan tab');
    router.navigate('/(tabs)/(scan)');
  };

  const handleFilterPress = (filterName: string) => {
    console.log('[HistoryScreen] filter pressed:', filterName);
  };

  const handleSearchChange = (text: string) => {
    setSearchText(text);
    console.log('[HistoryScreen] search text changed:', text);
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ paddingBottom: 100 }}
      contentInsetAdjustmentBehavior="automatic"
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View
        style={{
          paddingTop: insets.top + SPACING.md,
          paddingHorizontal: SPACING.md,
          paddingBottom: SPACING.md,
        }}
      >
        <Text style={[TYPOGRAPHY.h1, { color: colors.text, marginBottom: SPACING.xs }]}>
          Scan History
        </Text>
        <Text style={[TYPOGRAPHY.body, { color: colors.textSecondary }]}>
          Your completed ProofLoop reports will be available here.
        </Text>
      </View>

      {/* Search bar */}
      <View style={{ paddingHorizontal: SPACING.md, marginBottom: SPACING.sm }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: colors.surfaceSecondary,
            borderRadius: 10,
            height: 44,
            paddingHorizontal: SPACING.sm,
            gap: SPACING.sm,
          }}
        >
          <Search size={16} color={colors.textTertiary} />
          <TextInput
            value={searchText}
            onChangeText={handleSearchChange}
            placeholder="Search reports..."
            placeholderTextColor={colors.textTertiary}
            style={[
              TYPOGRAPHY.body,
              {
                flex: 1,
                color: colors.text,
                padding: 0,
              },
            ]}
            returnKeyType="search"
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>
      </View>

      {/* Filter buttons */}
      <View
        style={{
          paddingHorizontal: SPACING.md,
          flexDirection: 'row',
          gap: SPACING.sm,
          marginBottom: SPACING.lg,
        }}
      >
        {[
          { label: 'Risk level', icon: ListFilter },
          { label: 'Content type', icon: Layers },
          { label: 'Sort', icon: ArrowUpDown },
        ].map(filter => (
          <AnimatedPressable
            key={filter.label}
            onPress={() => handleFilterPress(filter.label)}
            accessibilityRole="button"
            accessibilityLabel={filter.label}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              backgroundColor: colors.surfaceSecondary,
              borderRadius: RADIUS.sm,
              height: 36,
              paddingHorizontal: 12,
            }}
          >
            <filter.icon size={14} color={colors.textSecondary} />
            <Text style={[TYPOGRAPHY.caption, { color: colors.textSecondary }]}>
              {filter.label}
            </Text>
          </AnimatedPressable>
        ))}
      </View>

      {/* Empty state */}
      <View style={{ paddingHorizontal: SPACING.md }}>
        <EmptyStateCard
          icon={FileSearch}
          title="No reports yet"
          subtitle="Complete your first scan to begin building your private report history."
          ctaLabel="Go to Scan"
          onCtaPress={handleGoToScan}
        />
      </View>
    </ScrollView>
  );
}
