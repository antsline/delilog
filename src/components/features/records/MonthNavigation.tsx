import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors } from '@/constants/colors';
import { getMonthName } from '@/utils/dateUtils';

interface MonthNavigationProps {
  year: number;
  month: number;
  onPrevious: () => void;
  onNext: () => void;
  onToday?: () => void;
}

export function MonthNavigation({ 
  year, 
  month, 
  onPrevious, 
  onNext, 
  onToday 
}: MonthNavigationProps) {
  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.navButton}
        onPress={onPrevious}
        hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}
      >
        <Text style={styles.navButtonText}>‹</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.monthContainer}
        onPress={onToday}
        hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}
      >
        <Text style={styles.monthText}>
          {year}年 {getMonthName(month)}
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.navButton}
        onPress={onNext}
        hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}
      >
        <Text style={styles.navButtonText}>›</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: colors.cream,
    borderBottomWidth: 1,
    borderBottomColor: colors.beige,
  },
  navButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.cream,
    borderWidth: 1.5,
    borderColor: colors.beige,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navButtonText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.charcoal,
  },
  monthContainer: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  monthText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.charcoal,
  },
});