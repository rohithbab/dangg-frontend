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
  useAnimatedStyle,
  useSharedValue,
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

import ConfirmationDialog from '@core/components/ConfirmationDialog';

import { type FemaleAppStackParamList } from '@navigation/types';

type Nav = NativeStackNavigationProp<FemaleAppStackParamList, 'ChatSession'>;
type Route = RouteProp<FemaleAppStackParamList, 'ChatSession'>;

type MessageKind = 'sent' | 'received';

type MockMessage = {
  id: string;
  kind: MessageKind;
  text: string;
  time: string;
};

const MOCK_MESSAGES: ReadonlyArray<MockMessage> = [
  {
    id: '1',
    kind: 'sent',
    text: 'Hey! 👋 Just accepted your request',
    time: '2:30 PM',
  },
  {
    id: '2',
    kind: 'received',
    text: 'Hi! So glad you accepted 😊 How are you doing today?',
    time: '2:31 PM',
  },
  {
    id: '3',
    kind: 'sent',
    text: "I'm doing great, thanks for asking! What would you like to talk about? 💬",
    time: '2:31 PM',
  },
  {
    id: '4',
    kind: 'received',
    text: "I'd love to know more about you 😊",
    time: '2:32 PM',
  },
  {
    id: '5',
    kind: 'sent',
    text: 'Sure! Ask me anything. I love good conversations ✨',
    time: '2:33 PM',
  },
];

const COINS_PER_MESSAGE_EARNED = 5;
const MOCK_MALE_NAME = 'Amit';

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

function CloseIcon(): React.ReactElement {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24">
      <Path
        d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"
        fill={AppColors.error}
      />
    </Svg>
  );
}

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

function ChatHeader({
  name,
  secondsElapsed,
  coinsEarned,
  onBack,
  onEnd,
}: {
  name: string;
  secondsElapsed: number;
  coinsEarned: number;
  onBack: () => void;
  onEnd: () => void;
}): React.ReactElement {
  const mm = String(Math.floor(secondsElapsed / 60)).padStart(2, '0');
  const ss = String(secondsElapsed % 60).padStart(2, '0');

  return (
    <View style={[styles.header, AppShadows.e1]}>
      <Pressable onPress={onBack} hitSlop={12} style={styles.backBtn}>
        <BackIcon />
      </Pressable>

      <View style={styles.headerCenter}>
        <View style={styles.maleAvatarWrap}>
          <View style={styles.maleAvatar}>
            <Text style={styles.maleAvatarText}>{name[0]}</Text>
          </View>
          <View style={styles.onlineDot} />
        </View>
        <View>
          <Text style={styles.headerName}>{name}</Text>
          <Text style={styles.headerOnline}>{`Active • ${mm}:${ss}`}</Text>
        </View>
      </View>

      <View style={styles.headerRightCol}>
        <View style={styles.earningsPill}>
          <Text style={styles.earningsCurrency}>₹</Text>
          <Text style={styles.earningsValue}>{coinsEarned}</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="End chat"
          hitSlop={6}
          onPress={onEnd}
          style={styles.endBtn}
        >
          <CloseIcon />
        </Pressable>
      </View>
    </View>
  );
}

/**
 * Female-side chat session (DEV MODE mock). Mirrors the male `ChatSessionScreen`
 * but with roles swapped:
 *
 *  - The female’s own messages render on the right (pink "sent" bubbles).
 *  - The male’s messages render on the left (gray "received" bubbles).
 *  - Header shows what she’s earned this session, not what someone spent.
 *  - Replaces the male-side rating step with a confirm-then-pop flow (the
 *    spec keeps rating on the male side).
 */
function FemaleChatSessionScreen(): React.ReactElement {
  const navigation = useNavigation<Nav>();
  useRoute<Route>();

  const scrollRef = useRef<ScrollView>(null);
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState<MockMessage[]>([...MOCK_MESSAGES]);
  const [isTyping, setIsTyping] = useState(true);
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [endDialog, setEndDialog] = useState(false);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => sub.remove();
  }, []);

  useEffect(() => {
    const t = setInterval(() => setSecondsElapsed(s => s + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const coinsEarned = messages.filter(m => m.kind === 'sent').length * COINS_PER_MESSAGE_EARNED;

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

    setTimeout(() => {
      setIsTyping(false);
      const replies = [
        'That sounds wonderful 😊',
        'Tell me more about that!',
        "Haha, you're funny 💕",
        'I see what you mean ✨',
        'That made me smile 🌸',
      ];
      const reply: MockMessage = {
        id: String(Date.now() + 1),
        kind: 'received',
        text: replies[Math.floor(Math.random() * replies.length)] ?? replies[0]!,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages(prev => [...prev, reply]);
      setIsTyping(true);
    }, 1500);

    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const confirmEnd = (): void => {
    setEndDialog(false);
    navigation.reset({
      index: 0,
      routes: [{ name: 'FemaleTabs', params: { screen: 'Home' } }],
    });
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ChatHeader
        name={MOCK_MALE_NAME}
        secondsElapsed={secondsElapsed}
        coinsEarned={coinsEarned}
        onBack={() => setEndDialog(true)}
        onEnd={() => setEndDialog(true)}
      />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <View style={styles.earnPill}>
          <Text
            style={styles.earnPillText}
          >{`+₹${COINS_PER_MESSAGE_EARNED} per reply you send`}</Text>
        </View>

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

        <View style={[styles.inputBar, AppShadows.e2]}>
          <TextInput
            style={styles.input}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Type a reply…"
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

      <ConfirmationDialog
        visible={endDialog}
        title="End chat?"
        body={`You'll keep the ₹${coinsEarned} you earned this session.`}
        confirmLabel="End chat"
        cancelLabel="Keep chatting"
        destructive
        onCancel={() => setEndDialog(false)}
        onConfirm={confirmEnd}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: AppColors.background },
  flex: { flex: 1 },

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
  maleAvatarWrap: { position: 'relative' },
  maleAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: AppColors.primarySubtle,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: AppColors.primary,
  },
  maleAvatarText: {
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
  headerRightCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  earningsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: AppColors.success,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: AppRadii.sm,
  },
  earningsCurrency: {
    ...AppTypography.labelSmall,
    color: AppColors.onPrimary,
    fontWeight: '700',
  },
  earningsValue: {
    ...AppTypography.labelSmall,
    color: AppColors.onPrimary,
    fontWeight: '700',
  },
  endBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: AppColors.errorLight,
    alignItems: 'center',
    justifyContent: 'center',
  },

  earnPill: {
    alignSelf: 'center',
    marginTop: AppSpacing.sm,
    marginBottom: AppSpacing.xs,
    backgroundColor: AppColors.surface,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: AppRadii.full,
    borderWidth: 1,
    borderColor: AppColors.success,
  },
  earnPillText: {
    ...AppTypography.labelSmall,
    color: AppColors.success,
    fontSize: 11,
    fontWeight: '600',
  },

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

  msgRow: { maxWidth: '78%' },
  msgRowSent: { alignSelf: 'flex-end' },
  msgRowReceived: { alignSelf: 'flex-start' },
  bubble: {
    paddingHorizontal: AppSpacing.sm + 2,
    paddingVertical: AppSpacing.xs + 2,
    borderRadius: 16,
  },
  bubbleSent: {
    backgroundColor: AppColors.primary,
    borderBottomRightRadius: 4,
  },
  bubbleReceived: {
    backgroundColor: AppColors.primarySubtle,
    borderBottomLeftRadius: 4,
  },
  bubbleText: {
    ...AppTypography.bodyMedium,
  },
  bubbleTextSent: { color: AppColors.onPrimary },
  bubbleTextReceived: { color: AppColors.onSurface },
  timeText: {
    ...AppTypography.labelSmall,
    fontSize: 10,
    marginTop: 2,
    alignSelf: 'flex-end',
  },
  timeTextSent: { color: AppColors.onPrimary, opacity: 0.8 },
  timeTextReceived: { color: AppColors.onSurfaceMuted },

  typingBubble: {
    flexDirection: 'row',
    backgroundColor: AppColors.primarySubtle,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 16,
    borderBottomLeftRadius: 4,
    gap: 4,
  },
  typingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: AppColors.primary,
    opacity: 0.6,
  },

  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: AppSpacing.sm,
    paddingVertical: AppSpacing.sm,
    backgroundColor: AppColors.surface,
    gap: AppSpacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: AppColors.divider,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    paddingHorizontal: AppSpacing.md,
    paddingVertical: AppSpacing.sm,
    borderRadius: 22,
    backgroundColor: AppColors.background,
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
  },
  sendBtnPressed: { opacity: 0.85 },
});

export default FemaleChatSessionScreen;
