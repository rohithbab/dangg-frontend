import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import CoinIcon from '@core/components/CoinIcon';
import { inr } from '@core/utils/formatters';

import { type CoinPackage, totalCoinsFor } from '../constants';
import { WC, WR, WS, WShadow } from '../walletTheme';

import { GradientFill } from './WalletGradients';

export type CoinPurchaseConfirmModalProps = {
  visible: boolean;
  pkg: CoinPackage | null;
  onCancel: () => void;
  onConfirm: () => void;
};

function ShieldIcon(): React.ReactElement {
  return (
    <Svg width={13} height={13} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3Z"
        stroke={WC.successText}
        strokeWidth={1.8}
        strokeLinejoin="round"
      />
      <Path
        d="M9 12l2 2 4-4"
        stroke={WC.successText}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/** Confirms a coin-package purchase before launching the payment flow. */
function CoinPurchaseConfirmModal({
  visible,
  pkg,
  onCancel,
  onConfirm,
}: CoinPurchaseConfirmModalProps): React.ReactElement | null {
  if (!pkg) {
    return null;
  }
  const total = totalCoinsFor(pkg);
  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onCancel}
    >
      <View style={styles.scrim}>
        <View style={[styles.card, WShadow.hero]}>
          <View style={styles.handle} />
          <Text style={styles.title}>Confirm Purchase</Text>

          <View style={styles.summary}>
            <View style={styles.coinRow}>
              <CoinIcon size={26} />
              <Text style={styles.coins}>{total.toLocaleString()}</Text>
              <Text style={styles.coinsUnit}>coins</Text>
            </View>
            {pkg.bonusCoins > 0 ? (
              <Text style={styles.bonus}>{`Includes +${pkg.bonusCoins} bonus`}</Text>
            ) : null}
            <View style={styles.divider} />
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Total price</Text>
              <Text style={styles.priceValue}>{inr(pkg.priceInr)}</Text>
            </View>
          </View>

          <View style={styles.secureRow}>
            <ShieldIcon />
            <Text style={styles.secureText}>Secure payment via Razorpay</Text>
          </View>

          <View style={styles.actions}>
            <Pressable
              accessibilityRole="button"
              onPress={onCancel}
              style={({ pressed }) => [styles.cancelBtn, pressed && styles.pressed]}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={onConfirm}
              style={({ pressed }) => [styles.payBtn, WShadow.primary, pressed && styles.pressed]}
            >
              <GradientFill radius={WR.md} />
              <Text style={styles.payText}>{`Pay ${inr(pkg.priceInr)}`}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: {
    flex: 1,
    backgroundColor: WC.scrim,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  card: {
    width: '100%',
    backgroundColor: WC.card,
    borderTopLeftRadius: WR.xxl,
    borderTopRightRadius: WR.xxl,
    borderWidth: 1,
    borderColor: WC.hairline,
    paddingHorizontal: WS.xl,
    paddingTop: WS.md,
    paddingBottom: WS.huge,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: WC.hairline,
    marginBottom: WS.lg,
  },
  title: { fontSize: 20, fontWeight: '800', color: WC.text, letterSpacing: -0.3 },
  summary: {
    backgroundColor: WC.surface,
    borderWidth: 1,
    borderColor: WC.hairline,
    borderRadius: WR.lg,
    padding: WS.lg,
    marginTop: WS.lg,
  },
  coinRow: { flexDirection: 'row', alignItems: 'center', gap: WS.sm + 2 },
  coins: { fontSize: 28, fontWeight: '800', color: WC.text, letterSpacing: -0.5 },
  coinsUnit: { fontSize: 15, fontWeight: '600', color: WC.textDim },
  bonus: { fontSize: 13, fontWeight: '700', color: WC.successText, marginTop: 6 },
  divider: { height: 1, backgroundColor: WC.divider, marginVertical: WS.md },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  priceLabel: { fontSize: 14, fontWeight: '500', color: WC.textDim },
  priceValue: { fontSize: 18, fontWeight: '800', color: WC.text },
  secureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: WS.md + 2,
  },
  secureText: { fontSize: 12.5, fontWeight: '600', color: WC.textDim },
  actions: { flexDirection: 'row', gap: WS.md, marginTop: WS.lg },
  pressed: { transform: [{ scale: 0.97 }], opacity: 0.94 },
  cancelBtn: {
    flex: 1,
    height: 54,
    borderRadius: WR.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: WC.glass,
    borderWidth: 1,
    borderColor: WC.hairline,
  },
  cancelText: { fontSize: 15, fontWeight: '700', color: WC.text },
  payBtn: {
    flex: 1.4,
    height: 54,
    borderRadius: WR.md,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    backgroundColor: WC.primary,
  },
  payText: { fontSize: 16, fontWeight: '800', color: WC.text },
});

export default CoinPurchaseConfirmModal;
