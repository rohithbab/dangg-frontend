import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AppColors } from '@theme/colors';
import { moderateScale, scaleFont } from '@theme/responsive';
import { AppSpacing } from '@theme/spacing';
import { InterFont } from '@theme/typography';

/**
 * Minimal, dependency-free Markdown renderer for the bundled legal documents.
 *
 * The policy source is deliberately simple and uniform, so we only support what
 * those documents actually use:
 *   * `#` / `##` / `###` / `####` headings
 *   * `- ` / `* ` bullet list items
 *   * `---` horizontal rules
 *   * `**bold**` inline spans (incl. leading `**Label:**` runs)
 *   * blank-line-separated paragraphs
 *
 * Anything else renders as plain paragraph text. Keeping this in-house avoids a
 * native dependency (react-native-webview) and a JS Markdown lib, and lets the
 * output inherit the Neue type scale + responsive scaling.
 */

type Block =
  | { kind: 'h1' | 'h2' | 'h3' | 'h4' | 'p' | 'li'; text: string }
  | { kind: 'hr' };

function parse(markdown: string): Block[] {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n');
  const blocks: Block[] = [];
  let paragraph: string[] = [];

  const flush = (): void => {
    if (paragraph.length > 0) {
      blocks.push({ kind: 'p', text: paragraph.join(' ').trim() });
      paragraph = [];
    }
  };

  for (const raw of lines) {
    const line = raw.trimEnd();
    const trimmed = line.trim();

    if (trimmed === '') {
      flush();
      continue;
    }
    if (/^---+$/.test(trimmed)) {
      flush();
      blocks.push({ kind: 'hr' });
      continue;
    }
    const heading = /^(#{1,4})\s+(.*)$/.exec(trimmed);
    if (heading) {
      flush();
      const level = heading[1].length;
      const kind = (['h1', 'h2', 'h3', 'h4'] as const)[level - 1];
      blocks.push({ kind, text: heading[2].trim() });
      continue;
    }
    const bullet = /^[-*]\s+(.*)$/.exec(trimmed);
    if (bullet) {
      flush();
      blocks.push({ kind: 'li', text: bullet[1].trim() });
      continue;
    }
    paragraph.push(trimmed);
  }
  flush();
  return blocks;
}

/** Splits a line into plain / bold runs on `**...**`. */
function renderInline(text: string, keyPrefix: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g).filter(Boolean);
  return parts.map((part, i) => {
    const bold = /^\*\*([^*]+)\*\*$/.exec(part);
    if (bold) {
      return (
        <Text key={`${keyPrefix}-b${i}`} style={styles.bold}>
          {bold[1]}
        </Text>
      );
    }
    return <React.Fragment key={`${keyPrefix}-t${i}`}>{part}</React.Fragment>;
  });
}

export type PolicyMarkdownProps = {
  markdown: string;
};

function PolicyMarkdown({ markdown }: PolicyMarkdownProps): React.ReactElement {
  const blocks = useMemo(() => parse(markdown), [markdown]);

  return (
    <View>
      {blocks.map((block, i) => {
        const key = `blk-${i}`;
        switch (block.kind) {
          case 'hr':
            return <View key={key} style={styles.hr} />;
          case 'h1':
            return (
              <Text key={key} style={styles.h1}>
                {renderInline(block.text, key)}
              </Text>
            );
          case 'h2':
            return (
              <Text key={key} style={styles.h2}>
                {renderInline(block.text, key)}
              </Text>
            );
          case 'h3':
            return (
              <Text key={key} style={styles.h3}>
                {renderInline(block.text, key)}
              </Text>
            );
          case 'h4':
            return (
              <Text key={key} style={styles.h4}>
                {renderInline(block.text, key)}
              </Text>
            );
          case 'li':
            return (
              <View key={key} style={styles.liRow}>
                <Text style={styles.bullet}>{'•'}</Text>
                <Text style={styles.liText}>{renderInline(block.text, key)}</Text>
              </View>
            );
          default:
            return (
              <Text key={key} style={styles.p}>
                {renderInline(block.text, key)}
              </Text>
            );
        }
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  h1: {
    fontFamily: InterFont.semibold,
    fontSize: scaleFont(26),
    lineHeight: scaleFont(32),
    letterSpacing: -0.5,
    color: AppColors.onSurface,
    marginBottom: AppSpacing.sm,
  },
  h2: {
    fontFamily: InterFont.semibold,
    fontSize: scaleFont(19),
    lineHeight: scaleFont(26),
    letterSpacing: -0.2,
    color: AppColors.onSurface,
    marginTop: AppSpacing.lg,
    marginBottom: AppSpacing.xs,
  },
  h3: {
    fontFamily: InterFont.medium,
    fontSize: scaleFont(16),
    lineHeight: scaleFont(22),
    color: AppColors.onSurface,
    marginTop: AppSpacing.md,
    marginBottom: moderateScale(2),
  },
  h4: {
    fontFamily: InterFont.medium,
    fontSize: scaleFont(15),
    lineHeight: scaleFont(21),
    color: AppColors.onSurfaceMuted,
    marginTop: AppSpacing.sm,
  },
  p: {
    fontFamily: InterFont.regular,
    fontSize: scaleFont(15),
    lineHeight: scaleFont(23),
    color: AppColors.onSurfaceMuted,
    marginTop: AppSpacing.sm,
  },
  liRow: {
    flexDirection: 'row',
    marginTop: moderateScale(6),
    paddingRight: AppSpacing.sm,
  },
  bullet: {
    fontFamily: InterFont.regular,
    fontSize: scaleFont(15),
    lineHeight: scaleFont(23),
    color: AppColors.primary,
    width: moderateScale(18),
  },
  liText: {
    flex: 1,
    fontFamily: InterFont.regular,
    fontSize: scaleFont(15),
    lineHeight: scaleFont(23),
    color: AppColors.onSurfaceMuted,
  },
  bold: {
    fontFamily: InterFont.semibold,
    color: AppColors.onSurface,
  },
  hr: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: AppColors.divider,
    marginVertical: AppSpacing.lg,
  },
});

export default PolicyMarkdown;
