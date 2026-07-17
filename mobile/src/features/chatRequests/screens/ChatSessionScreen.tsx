import { type RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { type NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Clock, Play, Plus, X } from 'lucide-react-native';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  AppState,
  BackHandler,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import FastImage from 'react-native-fast-image';
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

import Avatar from '@core/components/Avatar';
import ConfirmationDialog from '@core/components/ConfirmationDialog';
import GradientAvatar from '@core/components/GradientAvatar';
import { USE_MOCK_DATA } from '@core/config/env';
import { isBareMediaKey } from '@core/network/mediaService';
import { getSupabaseClient } from '@core/network/supabaseClient';
import { AppPermissionStatus, permissionService } from '@core/services/permissionService';
import { logger } from '@core/utils/logger';

import { type MaleAppStackParamList } from '@navigation/types';

import { submitChatRating } from '@features/maleHome/api/maleHomeApi';

import {
  ensureChatMediaPermission,
  pickChatMedia,
  uploadAndSendChatMedia,
  type ChatMediaSource,
} from '../api/chatMedia';
import {
  type ChatMessage,
  type ChatMessageType,
  chatSessionHeartbeat,
  chatSessionSetBackground,
  endChatSession,
  getChatSessionForRequest,
  getChatSessionLiveness,
  listChatMessages,
  sendChatMessage,
} from '../api/chatRequestApi';
import ChatMediaViewer from '../components/ChatMediaViewer';
import { useSignedChatMedia } from '../hooks/useSignedChatMedia';

type Nav = NativeStackNavigationProp<MaleAppStackParamList, 'ChatSession'>;
type Route = RouteProp<MaleAppStackParamList, 'ChatSession'>;

// ─── Mock data ───────────────────────────────────────────────────────────────

type MessageKind = 'sent' | 'received';

type MockMessage = {
  id: string;
  kind: MessageKind;
  text: string;
  time: string;
  /** 'image' | 'video' for media messages; undefined for plain text. */
  mediaKind?: 'image' | 'video';
  mediaUrl?: string | null;
  /** True while the local optimistic bubble is still uploading. */
  uploading?: boolean;
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
// Presence heartbeat cadence, and how long a peer may be unseen before the
// surviving side treats them as gone (force-closed / crashed) and ends the chat.
const HEARTBEAT_MS = 7000;
// Force-close / crash: peer heartbeat stale past this ends the chat (~1 min).
const PEER_STALE_SECONDS = 60;
// A backgrounded peer is "stepped away" (timer pauses, session held open) until
// this grace elapses; beyond it — or a force-close with no background marker —
// the session is ended.
const PEER_BACKGROUND_GRACE_SECONDS = 60;

function formatMessageTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function mapChatMessage(message: ChatMessage, selfId: string): MockMessage {
  return {
    id: message.id,
    kind: message.senderId === selfId ? 'sent' : 'received',
    text: message.body,
    time: formatMessageTime(message.sentAt),
    mediaKind: message.messageType === 'text' ? undefined : message.messageType,
    mediaUrl: message.mediaUrl,
  };
}

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : '';
  return `${first}${last}`.toUpperCase();
}

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

function MediaContent({
  msg,
  onOpen,
}: {
  msg: MockMessage;
  onOpen: (uri: string, kind: 'image' | 'video') => void;
}): React.ReactElement {
  const openMedia = (): void => {
    if (msg.mediaUrl && !msg.uploading && msg.mediaKind) {
      onOpen(msg.mediaUrl, msg.mediaKind);
    }
  };

  if (msg.mediaKind === 'video') {
    return (
      <Pressable onPress={openMedia} style={styles.mediaTile}>
        <View style={styles.videoTile}>
          {msg.uploading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Play size={26} color="#FFFFFF" fill="#FFFFFF" />
          )}
          <Text style={styles.videoLabel}>{msg.uploading ? 'Uploading…' : 'Video'}</Text>
        </View>
      </Pressable>
    );
  }

  return (
    <Pressable onPress={openMedia} style={styles.mediaTile}>
      {msg.mediaUrl ? (
        <FastImage
          source={{ uri: msg.mediaUrl }}
          style={styles.mediaImage}
          resizeMode={FastImage.resizeMode.cover}
        />
      ) : (
        <View style={[styles.mediaImage, styles.mediaPlaceholder]} />
      )}
      {msg.uploading ? (
        <View style={styles.mediaUploadingOverlay}>
          <ActivityIndicator color="#FFFFFF" />
        </View>
      ) : null}
    </Pressable>
  );
}

function MessageBubble({
  msg,
  index,
  onOpen,
}: {
  msg: MockMessage;
  index: number;
  onOpen: (uri: string, kind: 'image' | 'video') => void;
}): React.ReactElement {
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
  const hasMedia = msg.mediaKind !== undefined;

  return (
    <Animated.View
      style={[styles.msgRow, isSent ? styles.msgRowSent : styles.msgRowReceived, style]}
    >
      <View
        style={[
          styles.bubble,
          isSent ? styles.bubbleSent : styles.bubbleReceived,
          hasMedia && styles.bubbleMedia,
        ]}
      >
        {hasMedia ? <MediaContent msg={msg} onOpen={onOpen} /> : null}
        {msg.text ? (
          <Text
            style={[styles.bubbleText, isSent ? styles.bubbleTextSent : styles.bubbleTextReceived]}
          >
            {msg.text}
          </Text>
        ) : null}
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

// ─── Header ──────────────────────────────────────────────────────────────────

function ChatHeader({
  name,
  avatarUri,
  secondsElapsed,
  onBack,
  onEnd,
  isLive,
}: {
  name: string;
  avatarUri: string | null;
  secondsElapsed: number;
  onBack: () => void;
  /** Explicit "cancel/end this chat" action — shown only while live. */
  onEnd: () => void;
  /** Live session shows the running timer; an ended (history) chat does not. */
  isLive: boolean;
}): React.ReactElement {
  const mm = String(Math.floor(secondsElapsed / 60)).padStart(2, '0');
  const ss = String(secondsElapsed % 60).padStart(2, '0');

  return (
    <View style={styles.header}>
      <Pressable onPress={onBack} hitSlop={12} style={styles.backBtn}>
        <BackIcon />
      </Pressable>

      <View style={styles.headerCenter}>
        <View style={styles.femaleAvatarWrap}>
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

      {isLive ? (
        <View style={styles.headerRightCol}>
          <View style={styles.countdownChip}>
            <Clock size={13} color={AppColors.onSurface} strokeWidth={2} />
            <Text style={styles.countdownText}>{`${mm}:${ss}`}</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Cancel chat"
            hitSlop={6}
            onPress={onEnd}
            style={styles.endBtn}
          >
            <X size={18} color={AppColors.error} strokeWidth={2.4} />
          </Pressable>
        </View>
      ) : null}
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
  const route = useRoute<Route>();

  const scrollRef = useRef<ScrollView>(null);
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState<MockMessage[]>(USE_MOCK_DATA ? [...MOCK_MESSAGES] : []);
  // Chat media is stored as bare R2 object keys (private bucket). Resolve them
  // to short-lived presigned GET URLs so FastImage can display the image/video.
  const signedMedia = useSignedChatMedia(messages.map(m => m.mediaUrl));
  const displayMessages = useMemo(
    () =>
      messages.map(m =>
        isBareMediaKey(m.mediaUrl) && signedMedia[m.mediaUrl]
          ? { ...m, mediaUrl: signedMedia[m.mediaUrl] }
          : m,
      ),
    [messages, signedMedia],
  );
  const [isTyping, setIsTyping] = useState(USE_MOCK_DATA);
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  // The other participant stepped away (backgrounded) — pause the timer and show
  // a waiting banner instead of ending the chat.
  const [peerAway, setPeerAway] = useState(false);
  // Tapped chat image → open the in-app viewer; video falls back to external.
  const [viewerUri, setViewerUri] = useState<string | null>(null);
  const openMediaViewer = (uri: string, kind: 'image' | 'video'): void => {
    if (kind === 'video') {
      void Linking.openURL(uri).catch(e => logger.warn('open video failed', e));
    } else {
      setViewerUri(uri);
    }
  };
  // Which permission was permanently denied → drives the "open Settings" dialog.
  const [permDenied, setPermDenied] = useState<'camera' | 'gallery' | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [selfId, setSelfId] = useState<string | null>(null);
  // The female being chatted with — target of the post-chat star rating.
  const [femaleId, setFemaleId] = useState<string | null>(null);
  // Real counterpart name (resolved from the session); falls back to the mock
  // until the live session loads.
  const [partnerName, setPartnerName] = useState(MOCK_FEMALE_NAME);
  const [partnerAvatarUrl, setPartnerAvatarUrl] = useState<string | null>(null);
  // True only while the session is active. Old chats opened from the inbox/
  // history load as ended → read-only transcript, no timer, no time limit.
  const [isLive, setIsLive] = useState(USE_MOCK_DATA);
  const [loading, setLoading] = useState(!USE_MOCK_DATA);
  // Set when the chat can't be opened (no session, not signed in, network down)
  // so we show an actionable error instead of an infinite spinner.
  const [loadError, setLoadError] = useState<string | null>(null);

  const [chatEndState, setChatEndState] = useState<'active' | 'confirm' | 'rating' | 'success'>(
    'active',
  );
  const [rating, setRating] = useState(0);

  // Mirror chatEndState into a ref so the message-poll closure (created once in
  // the bootstrap effect) reads the latest value. `remoteEndRef` is invoked by
  // the poll when the OTHER participant ends the session.
  const chatEndStateRef = useRef(chatEndState);
  chatEndStateRef.current = chatEndState;
  const remoteEndRef = useRef<() => void>(() => undefined);
  // True while the system camera/gallery picker is open. Opening the picker
  // backgrounds the app, which must NOT be treated as "left the chat" — else we
  // end the live session out from under the pending media upload.
  const pickingMediaRef = useRef(false);

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
    // End the session for BOTH participants. The other side's poll sees
    // status='ended' and disconnects too. Fire-and-forget; idempotent.
    if (!USE_MOCK_DATA && sessionId) {
      void endChatSession(sessionId).catch(e => logger.warn('endChatSession failed', e));
    }
  };

  // Invoked by the poll when the OTHER participant ended the chat: open the
  // rating modal so this user is disconnected the same way. No-op if this user
  // is already mid-end (so the ender doesn't double-trigger off their own end).
  remoteEndRef.current = (): void => {
    if (chatEndStateRef.current !== 'active') {
      return;
    }
    backdropOpacity.value = withTiming(1, { duration: 300 });
    cardScale.value = withSpring(1, { damping: 15, stiffness: 120 });
    cardTranslateY.value = withSpring(0, { damping: 15, stiffness: 120 });
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
    // Persist the male's star rating for the female. Best-effort: a failure
    // must never block the exit animation. The RPC recomputes her rating_avg.
    if (rating > 0 && femaleId && !USE_MOCK_DATA) {
      void submitChatRating(femaleId, rating).catch(e =>
        logger.warn('ChatSession.submitRating failed', e),
      );
    }
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
      // Old chat (read-only history): let the OS pop the screen normally.
      if (!isLive) {
        return false;
      }
      if (chatEndState === 'active') {
        handleInitiateEndChat();
      }
      return true;
    });
    return () => sub.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatEndState, isLive]);

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
              Are you sure you want to end your chat with {partnerName}? Remaining time will be
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
              <Avatar
                uri={partnerAvatarUrl}
                size={60}
                initials={initialsFromName(partnerName)}
                borderColor={AppColors.primary}
                borderWidth={2}
              />
            </View>
            <Text style={styles.modalTitle}>How was the chat?</Text>
            <Text style={styles.modalSubTitle}>Rate your conversation with {partnerName}</Text>

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

  // Session timer — runs ONLY for a live session, and PAUSES while the other
  // person has stepped away (#23), so it resumes from where it left off.
  useEffect(() => {
    if (!isLive || peerAway) {
      return;
    }
    const t = setInterval(() => setSecondsElapsed(s => s + 1), 1000);
    return () => clearInterval(t);
  }, [isLive, peerAway]);

  // Presence heartbeat — while the chat is live and foregrounded, stamp
  // presence every few seconds. A hard force-close (no JS) stops these, letting
  // the female side detect we vanished within PEER_STALE_SECONDS and end the
  // chat (the 5-min message-idle sweep remains a last-resort backstop).
  useEffect(() => {
    if (!isLive || !sessionId) {
      return;
    }
    void chatSessionHeartbeat(sessionId);
    const hb = setInterval(() => {
      void chatSessionHeartbeat(sessionId);
    }, HEARTBEAT_MS);
    return () => clearInterval(hb);
  }, [isLive, sessionId]);

  // Backgrounding the app no longer ENDS the chat (#19) — it marks us "stepped
  // away" so the other side pauses the timer and waits instead of being ejected.
  // We resume on return. A genuine force-close (no JS, no un-mark) is still
  // caught by the presence heartbeat + background grace on the peer side.
  useEffect(() => {
    if (!isLive || !sessionId) {
      return;
    }
    const sub = AppState.addEventListener('change', next => {
      if (next === 'background' && !pickingMediaRef.current) {
        void chatSessionSetBackground(sessionId, true).catch(() => undefined);
      } else if (next === 'active') {
        void chatSessionSetBackground(sessionId, false).catch(() => undefined);
      }
    });
    return () => sub.remove();
  }, [isLive, sessionId]);

  useEffect(() => {
    if (USE_MOCK_DATA) {
      return;
    }

    let mounted = true;
    let channel: ReturnType<ReturnType<typeof getSupabaseClient>['channel']> | null = null;
    let poll: ReturnType<typeof setInterval> | null = null;
    const client = getSupabaseClient();

    async function bootstrap(): Promise<void> {
      let currentUserId: string;
      let session: Awaited<ReturnType<typeof getChatSessionForRequest>>;
      try {
        const { data: userData } = await client.auth.getUser();
        if (!userData.user?.id) {
          if (mounted) {
            setLoadError('You need to be signed in to open this chat.');
            setLoading(false);
          }
          return;
        }
        currentUserId = userData.user.id;

        session = await getChatSessionForRequest(route.params.requestId);
      } catch (e) {
        // Network/DB failure (e.g. server unreachable) — surface it instead of
        // spinning forever. The bootstrap has no other exit for a thrown error.
        logger.error('ChatSession bootstrap failed', e);
        if (mounted) {
          setLoadError("Couldn't open the chat. Check your connection and try again.");
          setLoading(false);
        }
        return;
      }

      if (!mounted) {
        return;
      }
      if (!session) {
        setLoadError('This chat is no longer available.');
        setLoading(false);
        return;
      }

      setSelfId(currentUserId);
      setSessionId(session.id);
      setFemaleId(session.femaleId);
      if (session.partnerName) {
        setPartnerName(session.partnerName);
      }
      setPartnerAvatarUrl(session.partnerAvatarUrl);

      let history: Awaited<ReturnType<typeof listChatMessages>>;
      try {
        history = await listChatMessages(session.id);
      } catch (e) {
        logger.error('ChatSession loadMessages failed', e);
        if (mounted) {
          setLoadError("Couldn't load the conversation. Check your connection and try again.");
          setLoading(false);
        }
        return;
      }
      if (!mounted) {
        return;
      }
      setMessages(history.map(message => mapChatMessage(message, currentUserId)));
      setIsLive(session.status === 'active');
      setLoading(false);

      // Old chat opened from history (already ended): show a read-only
      // transcript and stop. No realtime/poll — and crucially no end-detection,
      // which would otherwise see status='ended' and pop the rating modal.
      if (session.status !== 'active') {
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
              message_type: ChatMessageType | null;
              media_url: string | null;
              sent_at: string;
            };
            const next = mapChatMessage(
              {
                id: row.id,
                sessionId: row.chat_session_id,
                senderId: row.sender_id,
                body: row.body,
                messageType: row.message_type ?? 'text',
                mediaUrl: row.media_url ?? null,
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
            // Reconcile the peer's presence:
            //  • ended                          → disconnect this side too.
            //  • stepped away (backgrounded)     → wait (pause timer, banner).
            //  • gone (bg past grace, OR heartbeat stale with no bg marker =
            //    force-close/crash)              → end + "the other person left".
            //  • present                         → normal.
            const liveness = await getChatSessionLiveness(session.id);
            if (!mounted) {
              return;
            }
            if (liveness.status === 'ended') {
              remoteEndRef.current();
            } else if (liveness.status === 'active') {
              const peerStepped =
                liveness.peerBackgrounded &&
                liveness.peerBackgroundedSecondsAgo < PEER_BACKGROUND_GRACE_SECONDS;
              const peerGone =
                (liveness.peerBackgrounded &&
                  liveness.peerBackgroundedSecondsAgo >= PEER_BACKGROUND_GRACE_SECONDS) ||
                (!liveness.peerBackgrounded && liveness.peerSecondsAgo > PEER_STALE_SECONDS);
              if (peerGone) {
                setPeerAway(false);
                await endChatSession(session.id).catch(() => undefined);
                if (mounted) {
                  Alert.alert('Chat ended', 'The other person left the chat.');
                  remoteEndRef.current();
                }
              } else {
                setPeerAway(peerStepped);
              }
            }
          } catch (e) {
            logger.warn('ChatSessionScreen message poll failed', e);
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

  const sendMediaFrom = async (source: ChatMediaSource): Promise<void> => {
    // Suppress the background-end while the permission prompt / picker is
    // foregrounded (see pickingMediaRef). Reset in finally so a genuine later
    // background still ends the chat.
    pickingMediaRef.current = true;
    let picked: Awaited<ReturnType<typeof pickChatMedia>> = null;
    try {
      const perm = await ensureChatMediaPermission(source);
      if (perm !== AppPermissionStatus.Granted) {
        // Permanently denied → guide the user to Settings; a plain deny this
        // time just aborts silently (the OS prompt already showed).
        if (perm === AppPermissionStatus.PermanentlyDenied) {
          setPermDenied(source === 'gallery' ? 'gallery' : 'camera');
        }
        return;
      }
      picked = await pickChatMedia(source);
    } finally {
      pickingMediaRef.current = false;
    }
    if (!picked) {
      return;
    }
    const tempId = `local-media-${Date.now()}`;
    const optimistic: MockMessage = {
      id: tempId,
      kind: 'sent',
      text: '',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      mediaKind: picked.kind,
      mediaUrl: picked.uri,
      uploading: true,
    };
    setMessages(prev => [...prev, optimistic]);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);

    if (USE_MOCK_DATA) {
      setMessages(prev => prev.map(m => (m.id === tempId ? { ...m, uploading: false } : m)));
      return;
    }

    try {
      const inserted = await uploadAndSendChatMedia(sessionId!, picked);
      const mapped = mapChatMessage(inserted, selfId!);
      setMessages(prev => {
        const withoutTemp = prev.filter(m => m.id !== tempId);
        return withoutTemp.some(m => m.id === mapped.id) ? withoutTemp : [...withoutTemp, mapped];
      });
    } catch (e) {
      logger.warn('Failed to send chat media:', e);
      setMessages(prev => prev.filter(m => m.id !== tempId));
      Alert.alert('Upload failed', 'Could not send that file. Please try again.');
    }
  };

  const handleAttachMedia = (): void => {
    if (!USE_MOCK_DATA && (!sessionId || !selfId)) {
      return;
    }
    Alert.alert('Send media', undefined, [
      {
        text: 'Take photo',
        onPress: () => {
          void sendMediaFrom('camera-photo');
        },
      },
      {
        text: 'Record video',
        onPress: () => {
          void sendMediaFrom('camera-video');
        },
      },
      {
        text: 'Choose from gallery',
        onPress: () => {
          void sendMediaFrom('gallery');
        },
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  if (loadError) {
    return (
      <SafeAreaView style={styles.loading} edges={['top', 'bottom']}>
        <Text style={styles.loadErrorText}>{loadError}</Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => navigation.goBack()}
          style={styles.loadErrorBtn}
        >
          <Text style={styles.loadErrorBtnText}>Go back</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.loading} edges={['top', 'bottom']}>
        <ActivityIndicator size="large" color={AppColors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      {USE_MOCK_DATA ? (
        <View style={styles.devBanner}>
          <Text style={styles.devBannerText}>DEV MODE - Mock Chat UI</Text>
        </View>
      ) : null}

      <ChatHeader
        name={partnerName}
        avatarUri={partnerAvatarUrl}
        secondsElapsed={secondsElapsed}
        isLive={isLive}
        onBack={isLive ? handleInitiateEndChat : () => navigation.goBack()}
        onEnd={handleInitiateEndChat}
      />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        {peerAway ? (
          <View style={styles.awayBanner}>
            <Text style={styles.awayBannerText}>{`${partnerName} stepped away — waiting for them to return…`}</Text>
          </View>
        ) : null}

        {/* Messages */}
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

          {displayMessages.map((msg, idx) => (
            <MessageBubble key={msg.id} msg={msg} index={idx} onOpen={openMediaViewer} />
          ))}

          {isTyping ? (
            <View style={styles.msgRowReceived}>
              <TypingIndicator />
            </View>
          ) : null}
        </ScrollView>

        {/* Composer — live session only. An ended chat is a read-only transcript. */}
        {isLive ? (
          <View style={[styles.inputBar, AppShadows.e2]}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Attach photo or video"
              onPress={handleAttachMedia}
              hitSlop={8}
              style={({ pressed }) => [styles.attachBtn, pressed && { opacity: 0.6 }]}
            >
              <Plus size={22} color={AppColors.onSurfaceMuted} strokeWidth={2.2} />
            </Pressable>
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

      <ChatMediaViewer
        visible={viewerUri !== null}
        uri={viewerUri}
        onClose={() => setViewerUri(null)}
      />
      <ConfirmationDialog
        visible={permDenied !== null}
        title={permDenied === 'gallery' ? 'Photos access needed' : 'Camera access needed'}
        body={
          permDenied === 'gallery'
            ? 'Enable Photos access in Settings to send images from your gallery.'
            : 'Enable Camera access in Settings to take and send photos.'
        }
        confirmLabel="Open Settings"
        cancelLabel="Not now"
        onConfirm={() => {
          setPermDenied(null);
          void permissionService.openAppSettings();
        }}
        onCancel={() => setPermDenied(null)}
      />
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
  femaleAvatarWrap: { position: 'relative' },
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
  endedFooter: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: AppSpacing.md,
    backgroundColor: AppColors.surface,
    borderTopWidth: 1,
    borderTopColor: AppColors.border,
  },
  endedFooterText: {
    ...AppTypography.bodySmall,
    color: AppColors.onSurfaceMuted,
  },
  headerRightCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  endBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: AppColors.errorLight,
    alignItems: 'center',
    justifyContent: 'center',
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

  // Messages list
  msgList: { flex: 1 },
  awayBanner: {
    backgroundColor: AppColors.warningLight,
    paddingVertical: 8,
    paddingHorizontal: AppSpacing.lg,
    alignItems: 'center',
  },
  awayBannerText: {
    ...AppTypography.labelSmall,
    color: AppColors.warning,
    textAlign: 'center',
  },
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
  bubbleMedia: { paddingHorizontal: 4, paddingTop: 4, paddingBottom: 6 },
  mediaTile: {
    width: 200,
    height: 200,
    borderRadius: 14,
    overflow: 'hidden',
  },
  mediaImage: { width: '100%', height: '100%' },
  mediaPlaceholder: { backgroundColor: 'rgba(255,255,255,0.08)' },
  mediaUploadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  videoTile: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#1A1A1F',
  },
  videoLabel: { ...AppTypography.labelSmall, color: '#FFFFFF', fontSize: 11 },
  attachBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
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
  bubbleText: { ...AppTypography.bodyMedium, fontSize: 15, lineHeight: 20 },
  bubbleTextSent: { color: AppColors.onPrimary },
  bubbleTextReceived: { color: AppColors.onSurface },
  bubbleTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    gap: 4,
    marginTop: 2,
  },
  timeText: { ...AppTypography.labelSmall, fontSize: 10 },
  timeTextSent: { color: 'rgba(255,255,255,0.65)' },
  timeTextReceived: { color: AppColors.onSurfaceMuted },

  // Typing indicator
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

  // Input bar
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
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: AppColors.background,
    paddingHorizontal: AppSpacing.xl,
  },
  loadErrorText: {
    ...AppTypography.bodyLarge,
    color: AppColors.onSurfaceMuted,
    textAlign: 'center',
  },
  loadErrorBtn: {
    marginTop: AppSpacing.lg,
    paddingHorizontal: AppSpacing.xl,
    paddingVertical: AppSpacing.sm,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: AppColors.primary,
  },
  loadErrorBtnText: {
    ...AppTypography.labelLarge,
    color: AppColors.primary,
  },
});

export default ChatSessionScreen;
