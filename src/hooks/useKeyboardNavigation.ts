/**
 * キーボードナビゲーション支援フック
 * 外部キーボード接続時のアクセシビリティ向上
 */

import React from 'react';
import { Platform } from 'react-native';

interface FocusableElement {
  id: string;
  ref: React.RefObject<any>;
  disabled?: boolean;
  onFocus?: () => void;
  onBlur?: () => void;
  onActivate?: () => void; // Enter/Space押下時の動作
}

export function useKeyboardNavigation() {
  const [focusableElements, setFocusableElements] = React.useState<FocusableElement[]>([]);
  const [currentFocusIndex, setCurrentFocusIndex] = React.useState(-1);
  const [isKeyboardNavigationActive, setIsKeyboardNavigationActive] = React.useState(false);

  // 要素を登録
  const registerElement = React.useCallback((element: FocusableElement) => {
    setFocusableElements(prev => {
      const exists = prev.find(el => el.id === element.id);
      if (exists) {
        return prev.map(el => el.id === element.id ? element : el);
      }
      return [...prev, element];
    });
  }, []);

  // 要素を削除
  const unregisterElement = React.useCallback((id: string) => {
    setFocusableElements(prev => prev.filter(el => el.id !== id));
  }, []);

  // フォーカス可能な要素のみ取得
  const getFocusableElements = React.useCallback(() => {
    return focusableElements.filter(el => !el.disabled);
  }, [focusableElements]);

  // 次の要素にフォーカス
  const focusNext = React.useCallback(() => {
    const elements = getFocusableElements();
    if (elements.length === 0) return;

    const nextIndex = (currentFocusIndex + 1) % elements.length;
    const nextElement = elements[nextIndex];
    
    if (nextElement?.ref.current) {
      nextElement.ref.current.focus?.();
      nextElement.onFocus?.();
      setCurrentFocusIndex(nextIndex);
    }
  }, [currentFocusIndex, getFocusableElements]);

  // 前の要素にフォーカス
  const focusPrevious = React.useCallback(() => {
    const elements = getFocusableElements();
    if (elements.length === 0) return;

    const prevIndex = currentFocusIndex <= 0 ? elements.length - 1 : currentFocusIndex - 1;
    const prevElement = elements[prevIndex];
    
    if (prevElement?.ref.current) {
      prevElement.ref.current.focus?.();
      prevElement.onFocus?.();
      setCurrentFocusIndex(prevIndex);
    }
  }, [currentFocusIndex, getFocusableElements]);

  // 最初の要素にフォーカス
  const focusFirst = React.useCallback(() => {
    const elements = getFocusableElements();
    if (elements.length === 0) return;

    const firstElement = elements[0];
    if (firstElement?.ref.current) {
      firstElement.ref.current.focus?.();
      firstElement.onFocus?.();
      setCurrentFocusIndex(0);
    }
  }, [getFocusableElements]);

  // 最後の要素にフォーカス
  const focusLast = React.useCallback(() => {
    const elements = getFocusableElements();
    if (elements.length === 0) return;

    const lastIndex = elements.length - 1;
    const lastElement = elements[lastIndex];
    if (lastElement?.ref.current) {
      lastElement.ref.current.focus?.();
      lastElement.onFocus?.();
      setCurrentFocusIndex(lastIndex);
    }
  }, [getFocusableElements]);

  // 現在フォーカス中の要素をアクティブ化
  const activateCurrentElement = React.useCallback(() => {
    const elements = getFocusableElements();
    const currentElement = elements[currentFocusIndex];
    
    if (currentElement?.onActivate) {
      currentElement.onActivate();
    }
  }, [currentFocusIndex, getFocusableElements]);

  // キーボードイベントハンドラー
  const handleKeyPress = React.useCallback((event: any) => {
    if (Platform.OS !== 'web') return; // Webでのみキーボードナビゲーション対応

    const { key, shiftKey, ctrlKey, metaKey } = event;

    // キーボードナビゲーションの開始を検出
    if (key === 'Tab') {
      setIsKeyboardNavigationActive(true);
    }

    switch (key) {
      case 'Tab':
        event.preventDefault();
        if (shiftKey) {
          focusPrevious();
        } else {
          focusNext();
        }
        break;
        
      case 'ArrowDown':
        if (!ctrlKey && !metaKey) {
          event.preventDefault();
          focusNext();
        }
        break;
        
      case 'ArrowUp':
        if (!ctrlKey && !metaKey) {
          event.preventDefault();
          focusPrevious();
        }
        break;
        
      case 'Home':
        if (ctrlKey || metaKey) {
          event.preventDefault();
          focusFirst();
        }
        break;
        
      case 'End':
        if (ctrlKey || metaKey) {
          event.preventDefault();
          focusLast();
        }
        break;
        
      case 'Enter':
      case ' ':
        event.preventDefault();
        activateCurrentElement();
        break;
        
      case 'Escape':
        // フォーカスをクリア
        const elements = getFocusableElements();
        const currentElement = elements[currentFocusIndex];
        if (currentElement?.ref.current?.blur) {
          currentElement.ref.current.blur();
          currentElement.onBlur?.();
        }
        setCurrentFocusIndex(-1);
        setIsKeyboardNavigationActive(false);
        break;
    }
  }, [
    focusNext, 
    focusPrevious, 
    focusFirst, 
    focusLast, 
    activateCurrentElement, 
    currentFocusIndex, 
    getFocusableElements
  ]);

  // マウスクリック時にキーボードナビゲーションを無効化
  const handleMouseInteraction = React.useCallback(() => {
    setIsKeyboardNavigationActive(false);
  }, []);

  // イベントリスナーの設定（Webプラットフォームのみ）
  React.useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const handleKeyDown = (event: any) => handleKeyPress(event);
      const handleClick = () => handleMouseInteraction();

      document.addEventListener('keydown', handleKeyDown);
      document.addEventListener('click', handleClick);

      return () => {
        document.removeEventListener('keydown', handleKeyDown);
        document.removeEventListener('click', handleClick);
      };
    }
  }, [handleKeyPress, handleMouseInteraction]);

  return {
    // 状態
    isKeyboardNavigationActive,
    currentFocusIndex,
    focusableElements: getFocusableElements(),
    
    // 要素管理
    registerElement,
    unregisterElement,
    
    // ナビゲーション制御
    focusNext,
    focusPrevious,
    focusFirst,
    focusLast,
    activateCurrentElement,
    
    // ユーティリティ
    getFocusableElements,
  };
}

/**
 * フォーカス可能要素用のフック
 */
export function useFocusableElement(
  id: string,
  options: {
    disabled?: boolean;
    onFocus?: () => void;
    onBlur?: () => void;
    onActivate?: () => void;
  } = {}
) {
  const ref = React.useRef<any>(null);
  const { registerElement, unregisterElement } = useKeyboardNavigation();

  React.useEffect(() => {
    const element: FocusableElement = {
      id,
      ref,
      disabled: options.disabled,
      onFocus: options.onFocus,
      onBlur: options.onBlur,
      onActivate: options.onActivate,
    };

    registerElement(element);

    return () => {
      unregisterElement(id);
    };
  }, [id, options.disabled, options.onFocus, options.onBlur, options.onActivate, registerElement, unregisterElement]);

  return { ref };
}

/**
 * スキップリンク用のフック
 */
export function useSkipLinks() {
  const skipToMain = React.useCallback(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const mainElement = document.getElementById('main-content');
      if (mainElement) {
        (mainElement as any).focus();
        mainElement.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, []);

  const skipToNavigation = React.useCallback(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const navElement = document.getElementById('navigation');
      if (navElement) {
        (navElement as any).focus();
        navElement.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, []);

  const skipToFooter = React.useCallback(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const footerElement = document.getElementById('footer');
      if (footerElement) {
        (footerElement as any).focus();
        footerElement.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, []);

  return {
    skipToMain,
    skipToNavigation,
    skipToFooter,
  };
}

/**
 * フォーカストラップ用のフック（モーダルなど）
 */
export function useFocusTrap(isActive: boolean = false) {
  const containerRef = React.useRef<any>(null);
  const [focusableElements, setFocusableElements] = React.useState<Element[]>([]);

  React.useEffect(() => {
    if (!isActive || !containerRef.current || Platform.OS !== 'web' || typeof document === 'undefined') return;

    // フォーカス可能な要素を取得
    const focusableSelector = [
      'button:not([disabled])',
      '[href]',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
    ].join(', ');

    const elements = Array.from(
      containerRef.current.querySelectorAll(focusableSelector)
    ) as any[];
    setFocusableElements(elements);

    // 最初の要素にフォーカス
    if (elements.length > 0) {
      (elements[0] as any).focus();
    }

    const handleKeyDown = (event: any) => {
      if (event.key !== 'Tab') return;

      const firstElement = elements[0] as any;
      const lastElement = elements[elements.length - 1] as any;

      if (event.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isActive]);

  return { containerRef };
}