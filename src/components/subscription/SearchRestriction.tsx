/**
 * 検索機能制限コンポーネント
 * 無料プランはスクロールのみ、ベーシックプランは日付・車両検索可能
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/constants/colors';
import { useFeatureAccess } from '@/utils/featureLimits';
import UpgradePromptModal from './UpgradePromptModal';

interface SearchRestrictionProps {
  onSearch?: (query: string, filters: any) => void;
  placeholder?: string;
  scrollAttempts?: number; // スクロール試行回数
  totalRecords?: number;
  children?: React.ReactNode;
}

export default function SearchRestriction({
  onSearch,
  placeholder = '記録を検索...',
  scrollAttempts = 0,
  totalRecords = 0,
  children,
}: SearchRestrictionProps) {
  const { canAccess, currentPlan } = useFeatureAccess('searchFunction');
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showScrollFrustration, setShowScrollFrustration] = useState(false);

  // スクロール試行回数に基づく不満度表示
  useEffect(() => {
    if (!canAccess && scrollAttempts >= 3) {
      setShowScrollFrustration(true);
    }
  }, [canAccess, scrollAttempts]);

  const handleSearchAttempt = () => {
    if (canAccess && onSearch) {
      onSearch(searchQuery, { type: 'basic' });
    } else {
      setShowModal(true);
    }
  };

  const renderSearchInterface = () => {
    if (canAccess) {
      // ベーシックプランのフル検索機能
      return (
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Ionicons name="search" size={20} color={colors.darkGray} />
            <TextInput
              style={styles.searchInput}
              placeholder={placeholder}
              placeholderTextColor={colors.darkGray}
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearchAttempt}
              returnKeyType="search"
            />
          </View>
          
          <TouchableOpacity
            style={styles.searchButton}
            onPress={handleSearchAttempt}
            accessibilityLabel="検索実行"
          >
            <Text style={styles.searchButtonText}>検索</Text>
          </TouchableOpacity>

          <View style={styles.searchFeatures}>
            <View style={styles.searchFeature}>
              <Ionicons name="calendar" size={16} color={colors.success} />
              <Text style={styles.searchFeatureText}>日付検索</Text>
            </View>
            <View style={styles.searchFeature}>
              <Ionicons name="car" size={16} color={colors.success} />
              <Text style={styles.searchFeatureText}>車両検索</Text>
            </View>
            <View style={styles.searchFeature}>
              <Ionicons name="document-text" size={16} color={colors.success} />
              <Text style={styles.searchFeatureText}>内容検索</Text>
            </View>
          </View>
        </View>
      );
    } else {
      // 無料プランの制限UI
      return (
        <View style={styles.restrictedContainer}>
          <View style={styles.restrictedSearchContainer}>
            <View style={styles.lockedSearchInput}>
              <Ionicons name="lock-closed" size={20} color={colors.darkGray} />
              <Text style={styles.lockedSearchText}>検索機能（ベーシック機能）</Text>
              <View style={styles.planBadge}>
                <Text style={styles.planBadgeText}>ベーシック</Text>
              </View>
            </View>
            
            <TouchableOpacity
              style={styles.lockedSearchButton}
              onPress={() => setShowModal(true)}
              accessibilityLabel="検索機能を有効にする"
            >
              <Text style={styles.lockedSearchButtonText}>有効にする</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.currentMethodContainer}>
            <View style={styles.currentMethodHeader}>
              <Ionicons name="finger-print" size={20} color={colors.warning} />
              <Text style={styles.currentMethodTitle}>現在の探し方</Text>
            </View>
            <Text style={styles.currentMethodDescription}>
              📱 スクロールして目的の記録を探す
            </Text>
            {totalRecords > 0 && (
              <Text style={styles.recordCountText}>
                {totalRecords}件の記録から手動で探索中...
              </Text>
            )}
          </View>

          <View style={styles.comparisonContainer}>
            <Text style={styles.comparisonTitle}>検索機能があれば...</Text>
            <View style={styles.comparisonFeatures}>
              <View style={styles.comparisonFeature}>
                <Ionicons name="flash" size={16} color={colors.orange} />
                <Text style={styles.comparisonFeatureText}>日付を指定して瞬時に発見</Text>
              </View>
              <View style={styles.comparisonFeature}>
                <Ionicons name="flash" size={16} color={colors.orange} />
                <Text style={styles.comparisonFeatureText}>車両ナンバーで絞り込み</Text>
              </View>
              <View style={styles.comparisonFeature}>
                <Ionicons name="flash" size={16} color={colors.orange} />
                <Text style={styles.comparisonFeatureText}>キーワードで内容検索</Text>
              </View>
            </View>
          </View>
        </View>
      );
    }
  };

  const renderScrollFrustration = () => {
    if (canAccess || !showScrollFrustration) return null;

    return (
      <View style={styles.frustrationContainer}>
        <View style={styles.frustrationHeader}>
          <Ionicons name="sad" size={24} color={colors.warning} />
          <Text style={styles.frustrationTitle}>
            お探しの記録、見つかりましたか？
          </Text>
        </View>
        
        <View style={styles.frustrationStats}>
          <Text style={styles.frustrationStatsText}>
            {scrollAttempts}回スクロールされました
          </Text>
          {totalRecords > 10 && (
            <Text style={styles.frustrationDetail}>
              {totalRecords}件から目的の記録を探すのは大変ですね
            </Text>
          )}
        </View>

        <View style={styles.solutionContainer}>
          <Text style={styles.solutionTitle}>💡 ベーシックプランなら...</Text>
          <View style={styles.solutionBenefit}>
            <Ionicons name="search-circle" size={20} color={colors.success} />
            <Text style={styles.solutionText}>
              日付や車両で瞬時に検索
            </Text>
          </View>
          <View style={styles.solutionBenefit}>
            <Ionicons name="time" size={20} color={colors.success} />
            <Text style={styles.solutionText}>
              数十秒のスクロール → 1秒で発見
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.frustrationSolutionButton}
          onPress={() => setShowModal(true)}
        >
          <Text style={styles.frustrationSolutionButtonText}>
            検索機能を試してみる
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {renderSearchInterface()}
      {renderScrollFrustration()}
      {children}
      
      {/* アップグレード促進モーダル */}
      <UpgradePromptModal
        visible={showModal}
        onClose={() => setShowModal(false)}
        title="🔍 過去の記録を簡単に検索"
        message={`スクロール${scrollAttempts}回、お疲れさまでした。\n\nベーシックプランならアプリ内で簡単検索！${
          totalRecords > 0 ? `${totalRecords}件の記録から` : ''
        }瞬時に目的の記録が見つかります。`}
        ctaText="検索機能を試す"
        value="瞬時に記録発見"
        timesSaved="数十秒のスクロール → 1秒で発見"
        scenario="search_frustration"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  searchContainer: {
    backgroundColor: colors.cream,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.beige,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: colors.charcoal,
  },
  searchButton: {
    backgroundColor: colors.orange,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  searchButtonText: {
    color: colors.cream,
    fontSize: 16,
    fontWeight: '600',
  },
  searchFeatures: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  searchFeature: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchFeatureText: {
    marginLeft: 4,
    fontSize: 12,
    color: colors.success,
    fontWeight: '500',
  },
  restrictedContainer: {
    backgroundColor: colors.beige,
    borderRadius: 12,
    padding: 16,
    gap: 16,
  },
  restrictedSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  lockedSearchInput: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cream,
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.darkGray + '40',
  },
  lockedSearchText: {
    marginLeft: 8,
    color: colors.darkGray,
    fontSize: 14,
    flex: 1,
  },
  planBadge: {
    backgroundColor: colors.orange,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  planBadgeText: {
    color: colors.cream,
    fontSize: 10,
    fontWeight: '600',
  },
  lockedSearchButton: {
    backgroundColor: colors.orange,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  lockedSearchButtonText: {
    color: colors.cream,
    fontSize: 12,
    fontWeight: '600',
  },
  currentMethodContainer: {
    backgroundColor: colors.warning + '10',
    borderRadius: 8,
    padding: 12,
  },
  currentMethodHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  currentMethodTitle: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
    color: colors.charcoal,
  },
  currentMethodDescription: {
    fontSize: 14,
    color: colors.charcoal,
    marginBottom: 8,
  },
  recordCountText: {
    fontSize: 12,
    color: colors.warning,
    fontStyle: 'italic',
  },
  comparisonContainer: {
    backgroundColor: colors.orange + '10',
    borderRadius: 8,
    padding: 12,
  },
  comparisonTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.charcoal,
    marginBottom: 12,
  },
  comparisonFeatures: {
    gap: 8,
  },
  comparisonFeature: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  comparisonFeatureText: {
    marginLeft: 6,
    fontSize: 13,
    color: colors.orange,
    fontWeight: '500',
  },
  frustrationContainer: {
    backgroundColor: colors.warning + '10',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: colors.warning + '30',
  },
  frustrationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  frustrationTitle: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
    color: colors.charcoal,
  },
  frustrationStats: {
    backgroundColor: colors.cream,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  frustrationStatsText: {
    fontSize: 14,
    color: colors.charcoal,
    marginBottom: 4,
  },
  frustrationDetail: {
    fontSize: 12,
    color: colors.warning,
    fontWeight: '500',
  },
  solutionContainer: {
    marginBottom: 16,
  },
  solutionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.charcoal,
    marginBottom: 8,
  },
  solutionBenefit: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  solutionText: {
    marginLeft: 6,
    fontSize: 13,
    color: colors.success,
    fontWeight: '500',
  },
  frustrationSolutionButton: {
    backgroundColor: colors.orange,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  frustrationSolutionButtonText: {
    color: colors.cream,
    fontSize: 14,
    fontWeight: '600',
  },
});