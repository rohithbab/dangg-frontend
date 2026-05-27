import { type RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { type NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useEffect, useRef, useState } from 'react';
import {
  BackHandler,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import { AppColors } from '@theme/colors';
import { AppRadii } from '@theme/radii';
import { AppShadows } from '@theme/shadows';
import { AppSpacing } from '@theme/spacing';
import { AppTypography } from '@theme/typography';

import CoinIcon from '@core/components/CoinIcon';

import { type MaleAppStackParamList } from '@navigation/types';

type Nav = NativeStackNavigationProp<MaleAppStackParamList, 'ChatSession'>;
type Route = RouteProp<MaleAppStackParamList, 'ChatSession'>;

// ─── Mock data ───────────────────────────────────────────────────────────────

type MessageKind = 'sent' | 'received';

type MockMessage = {
  id: string;
  kind: MessageKind;
  text: string;
  time: string;
};

const MOCK_MESSAGES: ReadonlyArray<MockMessage> = [
  { id: '1', kind: 'received', text: 'Hey! 👋 I just accepted your chat request', time: '2:30 PM' },
  {
    id: '2',
    kind: 'sent',
    text: 'Hi! So glad you accepted 😊 How are you doing today?',
    time: '2:31 PM',
  },
  {
    id: '3',
    kind: 'received',
    text: "I'm doing great, thanks for asking! What would you like to talk about? 💬",
    time: '2:31 PM',
  },
  { id: '4', kind: 'sent', text: "I'd love to know more about you 😊", time: '2:32 PM' },
  {
    id: '5',
    kind: 'received',
    text: 'Sure! Ask me anything. I love good conversations ✨',
    time: '2:33 PM',
  },
  {
    id: '6',
    kind: 'sent',
    text: 'What do you do in your free time?',
    time: '2:33 PM',
  },
];

const MOCK_FEMALE_NAME = 'Priya';
const COINS_PER_MESSAGE = 5;

// ─── Icons ───────────────────────────────────────────────────────────────────

function BackIcon(): React.ReactElement {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24">
      <Path
        d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"
        fill={AppColors.primaryDark}
      />
    </Svg>
  );
}

function SendIcon(): React.ReactElement {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24">
      <Path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" fill={AppColors.onPrimary} />
    </Svg>
  );
}

// ─── Typing indicator ─────────────────────────────────────────────────────────

function TypingDot({ delay }: { delay: number }): React.ReactElement {
  const y = useSharedValue(0);
  useEffect(() => {
    const t = setTimeout(() => {
      y.value = withRepeat(
        withSequence(
          withTiming(-5, { duration: 300, easing: Easing.out(Easing.quad) }),
          withTiming(0, { duration: 300, easing: Easing.in(Easing.quad) }),
        ),
        -1,
        false,
      );
    }, delay);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const style = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }] }));
  return <Animated.View style={[styles.typingDot, style]} />;
}

function TypingIndicator(): React.ReactElement {
  return (
    <View style={styles.typingBubble}>
      <TypingDot delay={0} />
      <TypingDot delay={180} />
      <TypingDot delay={360} />
    </View>
  );
}

// ─── Message bubble ───────────────────────────────────────────────────────────

function MessageBubble({ msg, index }: { msg: MockMessage; index: number }): React.ReactElement {
  const opacity = useSharedValue(0);
  const tx = useSharedValue(msg.kind === 'sent' ? 20 : -20);

  useEffect(() => {
    const t = setTimeout(() => {
      opacity.value = withTiming(1, { duration: 320 });
      tx.value = withSpring(0, { damping: 16, stiffness: 140 });
    }, index * 80);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateX: tx.value }],
  }));

  const isSent = msg.kind === 'sent';

  return (
    <Animated.View
      style={[styles.msgRow, isSent ? styles.msgRowSent : styles.msgRowReceived, style]}
    >
      <View style={[styles.bubble, isSent ? styles.bubbleSent : styles.bubbleReceived]}>
        <Text
          style={[styles.bubbleText, isSent ? styles.bubbleTextSent : styles.bubbleTextReceived]}
        >
          {msg.text}
        </Text>
        <Text style={[styles.timeText, isSent ? styles.timeTextSent : styles.timeTextReceived]}>
          {msg.time}
        </Text>
      </View>
    </Animated.View>
  );
}

// ─── Header ──────────────────────────────────────────────────────────────────

function ChatHeader({
  name,
  secondsElapsed,
  coinsSpent,
  onBack,
}: {
  name: string;
  secondsElapsed: number;
  coinsSpent: number;
  onBack: () => void;
}): React.ReactElement {
  const mm = String(Math.floor(secondsElapsed / 60)).padStart(2, '0');
  const ss = String(secondsElapsed % 60).padStart(2, '0');

  return (
    <View style={[styles.header, AppShadows.e1]}>
      <Pressable onPress={onBack} hitSlop={12} style={styles.backBtn}>
        <BackIcon />
      </Pressable>

      <View style={styles.headerCenter}>
        {/* Female avatar placeholder */}
        <View style={styles.femaleAvatarWrap}>
          <View style={styles.femaleAvatar}>
            <Text style={styles.femaleAvatarText}>{name[0]}</Text>
          </View>
          <View style={styles.onlineDot} />
        </View>
        <View>
          <Text style={styles.headerName}>{name}</Text>
          <Text style={styles.headerOnline}>Online • {`${mm}:${ss}`}</Text>
        </View>
      </View>

      <View style={styles.headerRight}>
        <CoinIcon size={16} />
        <Text style={styles.coinsSpentText}>{coinsSpent}</Text>
      </View>
    </View>
  );
}

function StarIcon({ filled, size = 32 }: { filled: boolean; size?: number }): React.ReactElement {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {filled ? (
        <Path
          d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"
          fill={AppColors.coinGold}
        />
      ) : (
        <Path
          d="M12 15.39l-3.76 2.27 1-4.28-3.32-2.88 4.38-.37L12 6.09l1.71 4.04 4.38.37-3.32 2.88 1 4.28L12 15.39z M22 9.24l-7.19-.62L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21 12 17.27 18.18 21l-1.63-7.03L22 9.24z"
          fill={AppColors.onSurfaceDisabled}
        />
      )}
    </Svg>
  );
}

type AnimatedStarProps = {
  scale: Animated.SharedValue<number>;
  filled: boolean;
  onPress: () => void;
};

function AnimatedStar({ scale, filled, onPress }: AnimatedStarProps): React.ReactElement {
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Pressable onPress={onPress} hitSlop={8} style={styles.starBtn}>
      <Animated.View style={animatedStyle}>
        <StarIcon filled={filled} size={36} />
      </Animated.View>
    </Pressable>
  );
}

// ─── Main screen ─────────────────────────────────────────────────────────────

/**
 * DEV MODE — mock chat UI for building and testing the chat experience.
 * No backend connection. Static messages, animated bubbles, live session timer.
 */
function ChatSessionScreen(): React.ReactElement {
  const navigation = useNavigation<Nav>();
  useRoute<Route>();

  const scrollRef = useRef<ScrollView>(null);
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState<MockMessage[]>([...MOCK_MESSAGES]);
  const [isTyping, setIsTyping] = useState(true);
  const [secondsElapsed, setSecondsElapsed] = useState(0);

  const [chatEndState, setChatEndState] = useState<'active' | 'confirm' | 'rating' | 'success'>(
    'active',
  );
  const [rating, setRating] = useState(0);

  // Animated values for modal container
  const backdropOpacity = useSharedValue(0);
  const cardScale = useSharedValue(0.3);
  const cardTranslateY = useSharedValue(100);

  // Animated values for rating stars
  const star1Scale = useSharedValue(0);
  const star2Scale = useSharedValue(0);
  const star3Scale = useSharedValue(0);
  const star4Scale = useSharedValue(0);
  const star5Scale = useSharedValue(0);

  const starScales = [star1Scale, star2Scale, star3Scale, star4Scale, star5Scale];

  // Initiate exit flow
  const handleInitiateEndChat = () => {
    setChatEndState('confirm');
    backdropOpacity.value = withTiming(1, { duration: 300 });
    cardScale.value = withSpring(1, { damping: 15, stiffness: 120 });
    cardTranslateY.value = withSpring(0, { damping: 15, stiffness: 120 });
  };

  // Cancel exit flow
  const handleCancelEndChat = () => {
    backdropOpacity.value = withTiming(0, { duration: 250 });
    cardScale.value = withTiming(0.85, { duration: 250 });
    cardTranslateY.value = withTiming(150, { duration: 250 }, finished => {
      if (finished) {
        runOnJS(setChatEndState)('active');
      }
    });
  };

  // Confirm and proceed to rating screen
  const handleConfirmEndChat = () => {
    cardScale.value = withSequence(
      withTiming(0.95, { duration: 100 }),
      withSpring(1, { damping: 12 }),
    );
    setChatEndState('rating');
  };

  // Stagger star entrance
  useEffect(() => {
    if (chatEndState === 'rating') {
      starScales.forEach((scale, i) => {
        scale.value = withDelay(100 + i * 80, withSpring(1, { damping: 12, stiffness: 150 }));
      });
    } else if (chatEndState === 'active') {
      starScales.forEach(scale => {
        scale.value = 0;
      });
      setRating(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatEndState]);

  // Handle star rating selection
  const handleSelectStar = (idx: number) => {
    const starNum = idx + 1;
    setRating(starNum);

    starScales.forEach((scale, i) => {
      if (i < starNum) {
        scale.value = withSequence(
          withTiming(1.35, { duration: 120 }),
          withSpring(1.0, { damping: 10 }),
        );
      }
    });
  };

  // Submit and show success screen
  const handleSubmitRating = () => {
    setChatEndState('success');
    cardScale.value = withSequence(
      withTiming(0.95, { duration: 100 }),
      withSpring(1, { damping: 12 }),
    );

    setTimeout(() => {
      backdropOpacity.value = withTiming(0, { duration: 250 });
      cardScale.value = withTiming(0.8, { duration: 250 }, finished => {
        if (finished) {
          runOnJS(handleNavigationExit)();
        }
      });
    }, 1800);
  };

  const handleNavigationExit = () => {
    navigation.popToTop();
  };

  // Intercept back gesture/press
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (chatEndState === 'active') {
        handleInitiateEndChat();
        return true;
      }
      return true;
    });
    return () => sub.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatEndState]);

  const backdropAnimatedStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const cardAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cardScale.value }, { translateY: cardTranslateY.value }],
  }));

  const renderModalContent = () => {
    switch (chatEndState) {
      case 'confirm':
        return (
          <View style={styles.modalContent}>
            <View style={styles.warningIconCircle}>
              <Svg width={36} height={36} viewBox="0 0 24 24">
                <Path
                  d="M12 2C6.48 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"
                  fill={AppColors.primary}
                />
              </Svg>
            </View>
            <Text style={styles.modalTitle}>End Chat Session?</Text>
            <Text style={styles.modalBody}>
              Are you sure you want to end your chat with {MOCK_FEMALE_NAME}? Remaining time will be
              stopped immediately.
            </Text>
            <View style={styles.modalButtons}>
              <Pressable
                onPress={handleCancelEndChat}
                style={[styles.modalButton, styles.modalButtonOutline]}
              >
                <Text style={styles.modalButtonTextOutline}>Keep Chatting</Text>
              </Pressable>
              <Pressable
                onPress={handleConfirmEndChat}
                style={[styles.modalButton, styles.modalButtonPrimary]}
              >
                <Text style={styles.modalButtonTextPrimary}>End Chat</Text>
              </Pressable>
            </View>
          </View>
        );
      case 'rating': {
        const ratingTexts = [
          'Select rating',
          'Terrible 😟',
          'Mediocre 😐',
          'Good 😊',
          'Great! 💖',
          'Awesome! 😍',
        ];
        return (
          <View style={styles.modalContent}>
            <View style={styles.modalAvatarCircle}>
              <View style={styles.modalAvatar}>
                <Text style={styles.modalAvatarText}>{MOCK_FEMALE_NAME[0]}</Text>
              </View>
            </View>
            <Text style={styles.modalTitle}>How was the chat?</Text>
            <Text style={styles.modalSubTitle}>Rate your conversation with {MOCK_FEMALE_NAME}</Text>

            <View style={styles.starRow}>
              {starScales.map((scale, idx) => (
                <AnimatedStar
                  key={idx}
                  scale={scale}
                  filled={idx < rating}
                  onPress={() => handleSelectStar(idx)}
                />
              ))}
            </View>

            <Text
              style={[
                styles.ratingFeedbackText,
                rating > 0 ? styles.ratingFeedbackTextSelected : null,
              ]}
            >
              {ratingTexts[rating]}
            </Text>

            <View style={styles.modalButtons}>
              <Pressable
                onPress={handleNavigationExit}
                style={[styles.modalButton, styles.modalButtonTextOnly]}
              >
                <Text style={styles.modalButtonTextOnlyLabel}>Skip</Text>
              </Pressable>
              <Pressable
                onPress={handleSubmitRating}
                disabled={rating === 0}
                style={[
                  styles.modalButton,
                  styles.modalButtonPrimary,
                  rating === 0 ? styles.modalButtonDisabled : null,
                ]}
              >
                <Text style={styles.modalButtonTextPrimary}>Submit</Text>
              </Pressable>
            </View>
          </View>
        );
      }
      case 'success':
        return (
          <View style={styles.modalContent}>
            <View style={styles.successIconCircle}>
              <Svg width={40} height={40} viewBox="0 0 24 24">
                <Path
                  d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"
                  fill={AppColors.success}
                />
              </Svg>
            </View>
            <Text style={styles.modalTitle}>Feedback Sent!</Text>
            <Text style={styles.modalBody}>
              Thank you for sharing your experience. We hope you had a great time!
            </Text>
          </View>
        );
      default:
        return null;
    }
  };

  // Session timer
  useEffect(() => {
    const t = setInterval(() => setSecondsElapsed(s => s + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const coinsSpent = messages.filter(m => m.kind === 'sent').length * COINS_PER_MESSAGE;

  const handleSend = (): void => {
    const text = inputText.trim();
    if (!text) {
      return;
    }
    const newMsg: MockMessage = {
      id: String(Date.now()),
      kind: 'sent',
      text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages(prev => [...prev, newMsg]);
    setInputText('');
    setIsTyping(true);

    // Mock female response after 1.8s
    setTimeout(() => {
      setIsTyping(false);
      const replies = [
        "That's so interesting! Tell me more 😊",
        "Haha, you're fun to talk to! 💫",
        'I totally agree with you on that ✨',
        "Wow, really? I didn't know that 🙈",
        'You seem like a really nice person 😊',
      ];
      const reply: MockMessage = {
        id: String(Date.now() + 1),
        kind: 'received',
        text: replies[Math.floor(Math.random() * replies.length)] ?? replies[0]!,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages(prev => [...prev, reply]);
      setIsTyping(true);
    }, 1800);

    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      {/* DEV MODE banner */}
      <View style={styles.devBanner}>
        <Text style={styles.devBannerText}>⚡ DEV MODE — Mock Chat UI</Text>
      </View>

      <ChatHeader
        name={MOCK_FEMALE_NAME}
        secondsElapsed={secondsElapsed}
        coinsSpent={coinsSpent}
        onBack={handleInitiateEndChat}
      />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        {/* Coin cost pill */}
        <View style={styles.coinPill}>
          <CoinIcon size={12} />
          <Text style={styles.coinPillText}>{COINS_PER_MESSAGE} coins per message</Text>
        </View>

        {/* Messages */}
        <ScrollView
          ref={scrollRef}
          style={styles.msgList}
          contentContainerStyle={styles.msgListContent}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.dateSeparator}>
            <View style={styles.dateLine} />
            <Text style={styles.dateLabel}>Today</Text>
            <View style={styles.dateLine} />
          </View>

          {messages.map((msg, idx) => (
            <MessageBubble key={msg.id} msg={msg} index={idx} />
          ))}

          {isTyping ? (
            <View style={styles.msgRowReceived}>
              <TypingIndicator />
            </View>
          ) : null}
        </ScrollView>

        {/* Input bar */}
        <View style={[styles.inputBar, AppShadows.e2]}>
          <TextInput
            style={styles.input}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Type a message…"
            placeholderTextColor={AppColors.onSurfaceMuted}
            multiline
            maxLength={200}
            onSubmitEditing={handleSend}
            returnKeyType="send"
          />
          <Pressable
            onPress={handleSend}
            style={({ pressed }) => [styles.sendBtn, pressed && styles.sendBtnPressed]}
          >
            <SendIcon />
          </Pressable>
        </View>
      </KeyboardAvoidingView>

      {/* Exit Modal Overlay */}
      {chatEndState !== 'active' && (
        <View style={styles.modalOverlay} pointerEvents="auto">
          <Animated.View style={[styles.backdrop, backdropAnimatedStyle]} />
          <View style={styles.modalContainer}>
            <Animated.View style={[styles.modalCard, cardAnimatedStyle]}>
              {renderModalContent()}
            </Animated.View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: AppColors.background },
  flex: { flex: 1 },

  devBanner: {
    backgroundColor: AppColors.coinGoldDark,
    paddingVertical: 4,
    alignItems: 'center',
  },
  devBannerText: {
    ...AppTypography.labelSmall,
    color: '#fff',
    fontWeight: '700',
    letterSpacing: 0.4,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: AppSpacing.md,
    paddingVertical: AppSpacing.sm + 2,
    backgroundColor: AppColors.surface,
    gap: AppSpacing.sm,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: AppSpacing.sm,
  },
  femaleAvatarWrap: { position: 'relative' },
  femaleAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: AppColors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: AppColors.primary,
  },
  femaleAvatarText: {
    ...AppTypography.titleMedium,
    color: AppColors.primaryDark,
    fontWeight: '700',
  },
  onlineDot: {
    position: 'absolute',
    bottom: 1,
    right: 1,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: AppColors.onlineGreen,
    borderWidth: 1.5,
    borderColor: AppColors.surface,
  },
  headerName: {
    ...AppTypography.titleMedium,
    color: AppColors.primaryDark,
    fontWeight: '700',
  },
  headerOnline: {
    ...AppTypography.labelSmall,
    color: AppColors.success,
    fontWeight: '600',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: AppColors.primarySubtle,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: AppRadii.sm,
  },
  coinsSpentText: {
    ...AppTypography.labelSmall,
    color: AppColors.primaryDark,
    fontWeight: '700',
  },

  // Coin cost pill
  coinPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'center',
    marginTop: AppSpacing.sm,
    marginBottom: AppSpacing.xs,
    backgroundColor: AppColors.surface,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: AppRadii.full,
    borderWidth: 1,
    borderColor: AppColors.border,
  },
  coinPillText: {
    ...AppTypography.labelSmall,
    color: AppColors.onSurfaceMuted,
    fontSize: 11,
  },

  // Messages list
  msgList: { flex: 1 },
  msgListContent: {
    paddingHorizontal: AppSpacing.md,
    paddingBottom: AppSpacing.md,
    gap: AppSpacing.xs,
  },

  dateSeparator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: AppSpacing.md,
    gap: AppSpacing.sm,
  },
  dateLine: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: AppColors.border },
  dateLabel: {
    ...AppTypography.labelSmall,
    color: AppColors.onSurfaceMuted,
    fontWeight: '600',
  },

  // Bubbles
  msgRow: { maxWidth: '78%' },
  msgRowSent: { alignSelf: 'flex-end' },
  msgRowReceived: { alignSelf: 'flex-start' },

  bubble: {
    borderRadius: AppRadii.lg,
    paddingHorizontal: AppSpacing.md,
    paddingVertical: AppSpacing.sm,
    gap: 2,
  },
  bubbleSent: {
    backgroundColor: AppColors.primary,
    borderBottomRightRadius: 4,
    shadowColor: AppColors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.22,
    shadowRadius: 6,
    elevation: 4,
  },
  bubbleReceived: {
    backgroundColor: AppColors.surface,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: AppColors.primaryLight,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  bubbleText: { ...AppTypography.bodyMedium, lineHeight: 20 },
  bubbleTextSent: { color: AppColors.onPrimary },
  bubbleTextReceived: { color: AppColors.onSurface },
  timeText: { ...AppTypography.labelSmall, fontSize: 10, alignSelf: 'flex-end' },
  timeTextSent: { color: 'rgba(255,255,255,0.65)' },
  timeTextReceived: { color: AppColors.onSurfaceMuted },

  // Typing indicator
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: AppColors.surface,
    borderRadius: AppRadii.lg,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: AppColors.primaryLight,
    paddingHorizontal: AppSpacing.md,
    paddingVertical: AppSpacing.sm + 2,
    alignSelf: 'flex-start',
    marginTop: AppSpacing.xs,
  },
  typingDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: AppColors.primary,
    opacity: 0.7,
  },

  // Input bar
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: AppSpacing.md,
    paddingVertical: AppSpacing.sm,
    backgroundColor: AppColors.surface,
    gap: AppSpacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: AppColors.border,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 100,
    backgroundColor: AppColors.background,
    borderRadius: AppRadii.xl,
    paddingHorizontal: AppSpacing.md,
    paddingVertical: AppSpacing.sm,
    borderWidth: 1.5,
    borderColor: AppColors.primaryLight,
    ...AppTypography.bodyMedium,
    color: AppColors.onSurface,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: AppColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: AppColors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  sendBtnPressed: { opacity: 0.82, transform: [{ scale: 0.96 }] },

  // Modal container & backdrop
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: AppColors.scrim,
  },
  modalContainer: {
    width: '100%',
    paddingHorizontal: AppSpacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCard: {
    width: '100%',
    backgroundColor: AppColors.surface,
    borderRadius: AppRadii.xl,
    padding: AppSpacing.lg,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 10,
  },
  modalContent: {
    width: '100%',
    alignItems: 'center',
  },
  modalTitle: {
    ...AppTypography.headlineMedium,
    color: AppColors.primaryDark,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: AppSpacing.md,
    marginBottom: AppSpacing.xs,
  },
  modalSubTitle: {
    ...AppTypography.bodyMedium,
    color: AppColors.onSurfaceMuted,
    textAlign: 'center',
    marginBottom: AppSpacing.md,
  },
  modalBody: {
    ...AppTypography.bodyMedium,
    color: AppColors.onSurfaceMuted,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: AppSpacing.lg,
    paddingHorizontal: AppSpacing.sm,
  },
  modalButtons: {
    flexDirection: 'row',
    width: '100%',
    gap: AppSpacing.md,
    marginTop: AppSpacing.md,
  },
  modalButton: {
    flex: 1,
    height: 48,
    borderRadius: AppRadii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonPrimary: {
    backgroundColor: AppColors.primary,
  },
  modalButtonOutline: {
    borderWidth: 1.5,
    borderColor: AppColors.borderStrong,
    backgroundColor: AppColors.transparent,
  },
  modalButtonTextOnly: {
    backgroundColor: AppColors.transparent,
  },
  modalButtonDisabled: {
    backgroundColor: AppColors.onSurfaceDisabled,
    opacity: 0.7,
  },
  modalButtonTextPrimary: {
    ...AppTypography.labelLarge,
    color: AppColors.onPrimary,
    fontWeight: '700',
  },
  modalButtonTextOutline: {
    ...AppTypography.labelLarge,
    color: AppColors.primary,
    fontWeight: '700',
  },
  modalButtonTextOnlyLabel: {
    ...AppTypography.labelLarge,
    color: AppColors.onSurfaceMuted,
    fontWeight: '600',
  },

  // Icon/Avatar styles
  warningIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: AppColors.primarySubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: AppColors.successLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: AppSpacing.md,
  },
  modalAvatarCircle: {
    padding: 3,
    borderRadius: 36,
    borderWidth: 2,
    borderColor: AppColors.primary,
  },
  modalAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: AppColors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalAvatarText: {
    ...AppTypography.headlineMedium,
    color: AppColors.primaryDark,
    fontWeight: '700',
  },

  // Star Rating
  starRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: AppSpacing.sm,
    marginVertical: AppSpacing.md,
  },
  starBtn: {
    padding: AppSpacing.xs,
  },
  ratingFeedbackText: {
    ...AppTypography.bodyLarge,
    fontWeight: '700',
    color: AppColors.onSurfaceDisabled,
    minHeight: 24,
    textAlign: 'center',
    marginBottom: AppSpacing.md,
  },
  ratingFeedbackTextSelected: {
    color: AppColors.coinGoldDark,
  },
});

export default ChatSessionScreen;
