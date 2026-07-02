import { type RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { type NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Clock } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  BackHandler,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
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
import GradientAvatar from '@core/components/GradientAvatar';
import { USE_MOCK_DATA } from '@core/config/env';
import { getSupabaseClient } from '@core/network/supabaseClient';
import { logger } from '@core/utils/logger';

import { type FemaleAppStackParamList } from '@navigation/types';

import {
  type ChatMessage,
  endChatSession,
  getChatSessionForRequest,
  getChatSessionStatus,
  listChatMessages,
  sendChatMessage,
} from '../api/chatRequestApi';

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

function formatMessageTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function mapChatMessage(message: ChatMessage, selfId: string): MockMessage {
  return {
    id: message.id,
    kind: message.senderId === selfId ? 'sent' : 'received',
    text: message.body,
    time: formatMessageTime(message.sentAt),
  };
}

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : '';
  return `${first}${last}`.toUpperCase();
}

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

function DoubleCheckIcon({ size = 12, color = 'rgba(255,255,255,0.7)' }): React.ReactElement {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M18 7l-1.41-1.41-6.34 6.34 1.41 1.41L18 7zm4.24-1.41L11.66 16.17l-4.24-4.24-1.41 1.41 5.66 5.66L23.66 7l-1.42-1.41zM.41 13.41L6.07 19.07l1.41-1.41L1.83 12 .41 13.41z"
        fill={color}
      />
    </Svg>
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
        <View style={styles.bubbleTimeRow}>
          <Text style={[styles.timeText, isSent ? styles.timeTextSent : styles.timeTextReceived]}>
            {msg.time}
          </Text>
          {isSent ? <DoubleCheckIcon /> : null}
        </View>
      </View>
    </Animated.View>
  );
}

function ChatHeader({
  name,
  avatarUri,
  secondsElapsed,
  isLive,
  onBack,
  onEnd,
}: {
  name: string;
  avatarUri: string | null;
  secondsElapsed: number;
  isLive: boolean;
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
          <GradientAvatar
            uri={avatarUri}
            seed={name}
            initials={initialsFromName(name)}
            size={36}
            shape="squircle"
          />
          {isLive ? <View style={styles.onlineDot} /> : null}
        </View>
        <View style={styles.headerTitleBlock}>
          <Text style={styles.headerName} numberOfLines={1}>
            {name}
          </Text>
          {isLive ? (
            <Text style={styles.headerOnline}>online</Text>
          ) : (
            <Text style={styles.headerEnded}>Chat ended</Text>
          )}
        </View>
      </View>

      <View style={styles.headerRightCol}>
        {isLive ? (
          <View style={styles.countdownChip}>
            <Clock size={13} color={AppColors.onSurface} strokeWidth={2} />
            <Text style={styles.countdownText}>{`${mm}:${ss}`}</Text>
          </View>
        ) : null}
        {isLive ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="End chat"
            hitSlop={6}
            onPress={onEnd}
            style={styles.endBtn}
          >
            <CloseIcon />
          </Pressable>
        ) : null}
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
  const route = useRoute<Route>();

  const scrollRef = useRef<ScrollView>(null);
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState<MockMessage[]>(USE_MOCK_DATA ? [...MOCK_MESSAGES] : []);
  const [isTyping, setIsTyping] = useState(USE_MOCK_DATA);
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [endDialog, setEndDialog] = useState(false);
  const [isLive, setIsLive] = useState(USE_MOCK_DATA);
  const [loading, setLoading] = useState(!USE_MOCK_DATA);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [selfId, setSelfId] = useState<string | null>(null);
  // Real counterpart name (resolved from the session); falls back to the mock
  // until the live session loads.
  const [partnerName, setPartnerName] = useState(MOCK_MALE_NAME);
  const [partnerAvatarUrl, setPartnerAvatarUrl] = useState<string | null>(null);

  // Disconnect-to-home, invoked either by this user (confirmEnd) or by the poll
  // when the OTHER participant ends the session. Guarded so it runs once.
  const disconnectedRef = useRef(false);
  const remoteEndRef = useRef<() => void>(() => undefined);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => sub.remove();
  }, []);

  useEffect(() => {
    if (!isLive) {
      return;
    }
    const t = setInterval(() => setSecondsElapsed(s => s + 1), 1000);
    return () => clearInterval(t);
  }, [isLive]);

  useEffect(() => {
    if (USE_MOCK_DATA) {
      return;
    }

    let mounted = true;
    let channel: ReturnType<ReturnType<typeof getSupabaseClient>['channel']> | null = null;
    let poll: ReturnType<typeof setInterval> | null = null;
    const client = getSupabaseClient();

    async function bootstrap(): Promise<void> {
      const { data: userData } = await client.auth.getUser();
      const currentUserId = userData.user?.id;
      if (!currentUserId) {
        return;
      }

      const session = await getChatSessionForRequest(route.params.requestId);
      if (!session || !mounted) {
        return;
      }

      setSelfId(currentUserId);
      setSessionId(session.id);
      if (session.partnerName) {
        setPartnerName(session.partnerName);
      }
      setPartnerAvatarUrl(session.partnerAvatarUrl);

      const live = session.status === 'active';
      setIsLive(live);

      const history = await listChatMessages(session.id);
      if (!mounted) {
        return;
      }
      setMessages(history.map(message => mapChatMessage(message, currentUserId)));
      setLoading(false);

      if (!live) {
        return;
      }

      channel = client
        .channel(`public:chat_messages:chat_session_id=eq.${session.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'chat_messages',
            filter: `chat_session_id=eq.${session.id}`,
          },
          payload => {
            const row = payload.new as {
              id: string;
              chat_session_id: string;
              sender_id: string;
              body: string;
              sent_at: string;
            };
            const next = mapChatMessage(
              {
                id: row.id,
                sessionId: row.chat_session_id,
                senderId: row.sender_id,
                body: row.body,
                sentAt: row.sent_at,
              },
              currentUserId,
            );
            setMessages(prev =>
              prev.some(message => message.id === next.id) ? prev : [...prev, next],
            );
          },
        )
        .subscribe();

      // Polling fallback: this local stack's Realtime pipeline does not reliably
      // deliver postgres_changes, so the realtime INSERT above can silently miss
      // the other participant's messages. Re-fetch the history every few seconds
      // and merge anything new (deduped by DB id — sent messages already carry
      // their real id, so this never duplicates). Guarantees both sides converge.
      poll = setInterval(() => {
        void (async () => {
          if (!mounted) {
            return;
          }
          try {
            const latest = await listChatMessages(session.id);
            if (!mounted) {
              return;
            }
            setMessages(prev => {
              const seen = new Set(prev.map(m => m.id));
              const additions = latest
                .filter(m => !seen.has(m.id))
                .map(m => mapChatMessage(m, currentUserId));
              return additions.length > 0 ? [...prev, ...additions] : prev;
            });
            // If the other participant ended the session, disconnect this side too.
            const status = await getChatSessionStatus(session.id);
            if (mounted && status === 'ended') {
              remoteEndRef.current();
            }
          } catch (e) {
            logger.warn('FemaleChatSessionScreen message poll failed', e);
          }
        })();
      }, 2500);
    }

    void bootstrap();

    return () => {
      mounted = false;
      if (channel) {
        void client.removeChannel(channel);
      }
      if (poll) {
        clearInterval(poll);
      }
    };
  }, [route.params.requestId]);

  const coinsEarned = messages.filter(m => m.kind === 'sent').length * COINS_PER_MESSAGE_EARNED;

  const handleSend = async (): Promise<void> => {
    const text = inputText.trim();
    if (!text) {
      return;
    }
    if (!USE_MOCK_DATA && (!sessionId || !selfId)) {
      return;
    }

    const newMsg: MockMessage = {
      id: String(Date.now()),
      kind: 'sent',
      text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setInputText('');

    if (!USE_MOCK_DATA) {
      try {
        const inserted = await sendChatMessage(sessionId!, text);
        const mapped = mapChatMessage(inserted, selfId!);
        setMessages(prev =>
          prev.some(message => message.id === mapped.id) ? prev : [...prev, mapped],
        );
        setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
      } catch (e) {
        logger.warn('Failed to send chat message:', e);
        setInputText(text);
      }
      return;
    }

    setMessages(prev => [...prev, newMsg]);
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

  // Disconnect this screen to Home. Idempotent via disconnectedRef so the
  // poll and a manual end can't both navigate.
  remoteEndRef.current = (): void => {
    if (disconnectedRef.current) {
      return;
    }
    disconnectedRef.current = true;
    navigation.reset({
      index: 0,
      routes: [{ name: 'FemaleTabs', params: { screen: 'Home' } }],
    });
  };

  const confirmEnd = (): void => {
    setEndDialog(false);
    // End the session for BOTH participants, then disconnect this side. The
    // male's poll sees status='ended' and disconnects too.
    if (!USE_MOCK_DATA && sessionId) {
      void endChatSession(sessionId).catch(e => logger.warn('endChatSession failed', e));
    }
    remoteEndRef.current();
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loading} edges={['top', 'bottom']}>
        <ActivityIndicator size="large" color={AppColors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ChatHeader
        name={partnerName}
        avatarUri={partnerAvatarUrl}
        secondsElapsed={secondsElapsed}
        isLive={isLive}
        onBack={() => {
          if (isLive) {
            setEndDialog(true);
          } else {
            navigation.goBack();
          }
        }}
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
            <View style={styles.datePill}>
              <Text style={styles.dateLabel}>Today</Text>
            </View>
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

        {isLive ? (
          <View style={[styles.inputBar, AppShadows.e2]}>
            <TextInput
              style={styles.input}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Message…"
              placeholderTextColor={AppColors.onSurfaceMuted}
              multiline
              maxLength={200}
              onSubmitEditing={() => {
                void handleSend();
              }}
              returnKeyType="send"
            />
            <Pressable
              onPress={() => {
                void handleSend();
              }}
              style={({ pressed }) => [styles.sendBtn, pressed && styles.sendBtnPressed]}
            >
              <SendIcon />
            </Pressable>
          </View>
        ) : (
          <View style={styles.endedFooter}>
            <Text style={styles.endedFooterText}>This chat has ended</Text>
          </View>
        )}
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
    paddingTop:
      Platform.OS === 'android'
        ? (StatusBar.currentHeight ?? 0) + AppSpacing.sm + 2
        : AppSpacing.sm + 2,
    paddingBottom: AppSpacing.sm + 2,
    backgroundColor: AppColors.background,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: AppColors.border,
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
  onlineDot: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: 11,
    height: 11,
    borderRadius: 5.5,
    backgroundColor: AppColors.onlineGreen,
    borderWidth: 2.5,
    borderColor: AppColors.background,
  },
  headerTitleBlock: { flex: 1, minWidth: 0 },
  headerName: {
    ...AppTypography.titleMedium,
    color: AppColors.onSurface,
  },
  headerOnline: {
    ...AppTypography.labelSmall,
    fontSize: 12,
    color: AppColors.onlineGreen,
  },
  headerEnded: {
    ...AppTypography.labelSmall,
    color: AppColors.onSurfaceMuted,
    fontWeight: '600',
  },
  headerRightCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  countdownChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: AppColors.surface,
    borderWidth: 1,
    borderColor: AppColors.border,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 13,
  },
  countdownText: {
    ...AppTypography.labelLarge,
    fontSize: 14,
    color: AppColors.onSurface,
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'center',
    marginTop: AppSpacing.sm,
    marginBottom: AppSpacing.xs,
    backgroundColor: AppColors.successLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: AppRadii.full,
    borderWidth: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 1,
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
    justifyContent: 'center',
    marginVertical: AppSpacing.md,
  },
  datePill: {
    backgroundColor: AppColors.surface,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  dateLabel: {
    ...AppTypography.labelSmall,
    fontSize: 11,
    letterSpacing: 0.44,
    color: AppColors.onSurfaceMuted,
  },

  // Bubbles
  msgRow: { maxWidth: '78%' },
  msgRowSent: { alignSelf: 'flex-end' },
  msgRowReceived: { alignSelf: 'flex-start' },
  bubble: {
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingTop: 9,
    paddingBottom: 8,
    gap: 3,
  },
  bubbleSent: {
    backgroundColor: AppColors.primary,
    borderBottomRightRadius: 6,
  },
  bubbleReceived: {
    backgroundColor: AppColors.surface,
    borderWidth: 1,
    borderColor: AppColors.border,
    borderBottomLeftRadius: 6,
  },
  bubbleText: {
    ...AppTypography.bodyMedium,
    fontSize: 15,
    lineHeight: 20,
  },
  bubbleTextSent: { color: AppColors.onPrimary },
  bubbleTextReceived: { color: AppColors.onSurface },
  bubbleTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    gap: 4,
    marginTop: 2,
  },
  timeText: {
    ...AppTypography.labelSmall,
    fontSize: 10,
  },
  timeTextSent: { color: 'rgba(255,255,255,0.65)' },
  timeTextReceived: { color: AppColors.onSurfaceMuted },

  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: AppColors.surfaceVariant,
    borderRadius: AppRadii.lg,
    borderBottomLeftRadius: 4,
    borderWidth: 0,
    paddingHorizontal: AppSpacing.md,
    paddingVertical: AppSpacing.sm + 2,
    alignSelf: 'flex-start',
    marginTop: AppSpacing.xs,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 1,
  },
  typingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: AppColors.onSurfaceMuted,
    opacity: 0.6,
  },

  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: AppSpacing.md,
    paddingVertical: AppSpacing.sm,
    backgroundColor: AppColors.background,
    gap: AppSpacing.sm,
  },
  input: {
    flex: 1,
    minHeight: 46,
    maxHeight: 100,
    backgroundColor: AppColors.surface,
    borderRadius: 23,
    borderWidth: 1,
    borderColor: AppColors.border,
    paddingHorizontal: 18,
    paddingVertical: AppSpacing.sm,
    ...AppTypography.bodyMedium,
    fontSize: 15,
    color: AppColors.onSurface,
  },
  sendBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: AppColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnPressed: { opacity: 0.82, transform: [{ scale: 0.96 }] },

  endedFooter: {
    paddingHorizontal: AppSpacing.md,
    paddingVertical: AppSpacing.lg,
    alignItems: 'center',
  },
  endedFooterText: {
    ...AppTypography.bodyMedium,
    color: AppColors.onSurfaceMuted,
    fontWeight: '500',
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: AppColors.background,
  },
});

export default FemaleChatSessionScreen;
