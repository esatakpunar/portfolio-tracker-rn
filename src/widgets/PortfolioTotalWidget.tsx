import { HStack, RoundedRectangle, Spacer, Text, VStack, ZStack } from '@expo/ui/swift-ui';
import {
  background,
  clipShape,
  containerBackground,
  fixedSize,
  font,
  foregroundStyle,
  frame,
  lineLimit,
  minimumScaleFactor,
  padding,
  shapes,
  truncationMode,
} from '@expo/ui/swift-ui/modifiers';
import { createWidget, type WidgetEnvironment } from 'expo-widgets';

export type PortfolioTotalWidgetProps = {
  brandShort: string;
  totalLabel: string;
  totalLine: string;
  updatedFormatted: string;
  assetsLine: string;
  allocationSectionTitle: string;
  holdingsSectionTitle: string;
  allocationLine: string;
  alloc1Label: string;
  alloc1Pct: number;
  alloc1Color: string;
  alloc1BarWidth: number;
  alloc1ValueLine: string;
  alloc2Label: string;
  alloc2Pct: number;
  alloc2Color: string;
  alloc2BarWidth: number;
  alloc2ValueLine: string;
  alloc3Label: string;
  alloc3Pct: number;
  alloc3Color: string;
  alloc3BarWidth: number;
  alloc3ValueLine: string;
  alloc4Label: string;
  alloc4Pct: number;
  alloc4Color: string;
  alloc4BarWidth: number;
  alloc4ValueLine: string;
  holding1Icon: string;
  holding1Color: string;
  holding1Title: string;
  holding1Meta: string;
  holding2Icon: string;
  holding2Color: string;
  holding2Title: string;
  holding2Meta: string;
  holding3Icon: string;
  holding3Color: string;
  holding3Title: string;
  holding3Meta: string;
  holding4Icon: string;
  holding4Color: string;
  holding4Title: string;
  holding4Meta: string;
  holdingLine1: string;
  holdingLine2: string;
  changeLine: string;
  changeLineSmall: string;
};

export default createWidget(
  'PortfolioTotalWidget',
  function (props: PortfolioTotalWidgetProps, environment: WidgetEnvironment) {
    'widget';

    const r = (props ?? {}) as Partial<PortfolioTotalWidgetProps>;
    const changeLine = r.changeLine ?? '';
    const p: PortfolioTotalWidgetProps = {
      brandShort: r.brandShort ?? '',
      totalLabel: r.totalLabel ?? '',
      totalLine: r.totalLine ?? '',
      updatedFormatted: r.updatedFormatted ?? '',
      assetsLine: r.assetsLine ?? '',
      allocationSectionTitle: r.allocationSectionTitle ?? '',
      holdingsSectionTitle: r.holdingsSectionTitle ?? '',
      allocationLine: r.allocationLine ?? '',
      alloc1Label: r.alloc1Label ?? '',
      alloc1Pct: r.alloc1Pct ?? 0,
      alloc1Color: r.alloc1Color ?? '',
      alloc1BarWidth: r.alloc1BarWidth ?? 0,
      alloc1ValueLine: r.alloc1ValueLine ?? '',
      alloc2Label: r.alloc2Label ?? '',
      alloc2Pct: r.alloc2Pct ?? 0,
      alloc2Color: r.alloc2Color ?? '',
      alloc2BarWidth: r.alloc2BarWidth ?? 0,
      alloc2ValueLine: r.alloc2ValueLine ?? '',
      alloc3Label: r.alloc3Label ?? '',
      alloc3Pct: r.alloc3Pct ?? 0,
      alloc3Color: r.alloc3Color ?? '',
      alloc3BarWidth: r.alloc3BarWidth ?? 0,
      alloc3ValueLine: r.alloc3ValueLine ?? '',
      alloc4Label: r.alloc4Label ?? '',
      alloc4Pct: r.alloc4Pct ?? 0,
      alloc4Color: r.alloc4Color ?? '',
      alloc4BarWidth: r.alloc4BarWidth ?? 0,
      alloc4ValueLine: r.alloc4ValueLine ?? '',
      holding1Icon: r.holding1Icon ?? '',
      holding1Color: r.holding1Color ?? '',
      holding1Title: r.holding1Title ?? '',
      holding1Meta: r.holding1Meta ?? '',
      holding2Icon: r.holding2Icon ?? '',
      holding2Color: r.holding2Color ?? '',
      holding2Title: r.holding2Title ?? '',
      holding2Meta: r.holding2Meta ?? '',
      holding3Icon: r.holding3Icon ?? '',
      holding3Color: r.holding3Color ?? '',
      holding3Title: r.holding3Title ?? '',
      holding3Meta: r.holding3Meta ?? '',
      holding4Icon: r.holding4Icon ?? '',
      holding4Color: r.holding4Color ?? '',
      holding4Title: r.holding4Title ?? '',
      holding4Meta: r.holding4Meta ?? '',
      holdingLine1: r.holdingLine1 ?? '',
      holdingLine2: r.holdingLine2 ?? '',
      changeLine,
      changeLineSmall: r.changeLineSmall ?? changeLine,
    };

    const family = environment.widgetFamily;
    const isSmall = family === 'systemSmall';
    const isLarge = family === 'systemLarge';

    const bg = '#161A1E';
    const accent = '#3B82F6';
    const accentSoft = '#3B82F62E';
    const textPrimary = '#F2F4F7';
    const textSecondary = '#9AA0A6';
    const textMuted = '#6B7280';
    const positive = '#2ECC71';
    const negative = '#E74C3C';
    const trackBg = '#FFFFFF14';

    const changeSource = isSmall ? p.changeLineSmall : p.changeLine;
    const changePositive = changeSource.startsWith('+');
    const changeNegative = changeSource.startsWith('−') || changeSource.startsWith('-');
    const changeColor = changePositive ? positive : changeNegative ? negative : textMuted;

    const hasAllocBar =
      p.alloc1BarWidth > 0 ||
      p.alloc2BarWidth > 0 ||
      p.alloc3BarWidth > 0 ||
      p.alloc4BarWidth > 0;

    const contentFrame = [
      padding({ horizontal: 14, top: 12, bottom: 14 }),
      frame({ maxWidth: Infinity, maxHeight: Infinity, alignment: 'topLeading' }),
      fixedSize({ horizontal: false, vertical: true }),
    ];

    const contentFrameSmall = [
      padding({ horizontal: 8, top: 6, bottom: 6 }),
      frame({ maxWidth: Infinity, maxHeight: Infinity, alignment: 'topLeading' }),
      fixedSize({ horizontal: false, vertical: true }),
    ];

    const contentFrameLarge = [
      padding({ horizontal: 14, top: 12, bottom: 14 }),
      frame({ maxWidth: Infinity, maxHeight: Infinity, alignment: 'topLeading' }),
      fixedSize({ horizontal: false, vertical: true }),
    ];

    if (isSmall) {
      return (
        <ZStack
          modifiers={[containerBackground(bg, 'widget'), clipShape('containerRelativeShape')]}
        >
          <VStack alignment="leading" spacing={4} modifiers={contentFrameSmall}>
            <HStack spacing={8} alignment="center">
              <ZStack modifiers={[frame({ width: 26, height: 26 })]}>
                <RoundedRectangle
                  cornerRadius={8}
                  modifiers={[
                    frame({ width: 26, height: 26 }),
                    background(accentSoft, shapes.roundedRectangle({ cornerRadius: 8 })),
                  ]}
                />
                <Text
                  modifiers={[
                    font({ size: 12, weight: 'bold' }),
                    foregroundStyle(accent),
                    lineLimit(1),
                  ]}
                >
                  ₺
                </Text>
              </ZStack>
              <VStack alignment="leading" spacing={1}>
                <Text
                  modifiers={[
                    font({ size: 12, weight: 'semibold' }),
                    foregroundStyle(textPrimary),
                    lineLimit(1),
                  ]}
                >
                  {p.brandShort}
                </Text>
                <Text
                  modifiers={[
                    font({ size: 9, weight: 'medium' }),
                    foregroundStyle(textSecondary),
                    lineLimit(1),
                  ]}
                >
                  {p.totalLabel}
                </Text>
              </VStack>
            </HStack>

            <Text
              modifiers={[
                font({ size: 19, weight: 'bold' }),
                foregroundStyle(textPrimary),
                lineLimit(1),
                minimumScaleFactor(0.35),
                truncationMode('tail'),
              ]}
            >
              {p.totalLine}
            </Text>

            {changeSource.length > 0 && (
              <Text
                modifiers={[
                  font({ size: 11, weight: 'semibold' }),
                  foregroundStyle(changeColor),
                  lineLimit(1),
                  minimumScaleFactor(0.75),
                  truncationMode('tail'),
                ]}
              >
                {changeSource}
              </Text>
            )}

            <Text
              modifiers={[
                font({ size: 9, weight: 'regular' }),
                foregroundStyle(textMuted),
                lineLimit(1),
              ]}
            >
              {p.updatedFormatted}
            </Text>
          </VStack>
        </ZStack>
      );
    }

    if (isLarge) {
      return (
        <ZStack
          modifiers={[containerBackground(bg, 'widget'), clipShape('containerRelativeShape')]}
        >
          <VStack alignment="leading" spacing={8} modifiers={contentFrameLarge}>
            <HStack spacing={10} alignment="center">
              <ZStack modifiers={[frame({ width: 32, height: 32 })]}>
                <RoundedRectangle
                  cornerRadius={10}
                  modifiers={[
                    frame({ width: 32, height: 32 }),
                    background(accentSoft, shapes.roundedRectangle({ cornerRadius: 10 })),
                  ]}
                />
                <Text
                  modifiers={[
                    font({ size: 14, weight: 'bold' }),
                    foregroundStyle(accent),
                    lineLimit(1),
                  ]}
                >
                  ₺
                </Text>
              </ZStack>
              <VStack alignment="leading" spacing={2}>
                <Text
                  modifiers={[
                    font({ size: 15, weight: 'semibold' }),
                    foregroundStyle(textPrimary),
                    lineLimit(1),
                  ]}
                >
                  {p.brandShort}
                </Text>
                <Text
                  modifiers={[
                    font({ size: 11, weight: 'medium' }),
                    foregroundStyle(textSecondary),
                    lineLimit(1),
                  ]}
                >
                  {p.totalLabel}
                </Text>
              </VStack>
              <Spacer />
              {p.changeLine.length > 0 && (
                <Text
                  modifiers={[
                    font({ size: 12, weight: 'semibold' }),
                    foregroundStyle(changeColor),
                    lineLimit(2),
                    minimumScaleFactor(0.75),
                    truncationMode('tail'),
                  ]}
                >
                  {p.changeLine}
                </Text>
              )}
            </HStack>

            <Text
              modifiers={[
                font({ size: 28, weight: 'bold' }),
                foregroundStyle(textPrimary),
                lineLimit(1),
                minimumScaleFactor(0.45),
                truncationMode('tail'),
              ]}
            >
              {p.totalLine}
            </Text>

            {hasAllocBar && (
              <VStack alignment="leading" spacing={3}>
                <ZStack modifiers={[frame({ maxWidth: Infinity, height: 6 })]}>
                  <RoundedRectangle
                    cornerRadius={3}
                    modifiers={[
                      frame({ maxWidth: Infinity, height: 6 }),
                      background(trackBg, shapes.roundedRectangle({ cornerRadius: 3 })),
                    ]}
                  />
                  <HStack spacing={1} alignment="center">
                    {p.alloc1BarWidth > 0 && (
                      <RoundedRectangle
                        cornerRadius={3}
                        modifiers={[
                          frame({ width: p.alloc1BarWidth, height: 6 }),
                          background(
                            p.alloc1Color,
                            shapes.roundedRectangle({ cornerRadius: 3 })
                          ),
                        ]}
                      />
                    )}
                    {p.alloc2BarWidth > 0 && (
                      <RoundedRectangle
                        cornerRadius={3}
                        modifiers={[
                          frame({ width: p.alloc2BarWidth, height: 6 }),
                          background(
                            p.alloc2Color,
                            shapes.roundedRectangle({ cornerRadius: 3 })
                          ),
                        ]}
                      />
                    )}
                    {p.alloc3BarWidth > 0 && (
                      <RoundedRectangle
                        cornerRadius={3}
                        modifiers={[
                          frame({ width: p.alloc3BarWidth, height: 6 }),
                          background(
                            p.alloc3Color,
                            shapes.roundedRectangle({ cornerRadius: 3 })
                          ),
                        ]}
                      />
                    )}
                  </HStack>
                </ZStack>
                {p.allocationLine.length > 0 && (
                  <Text
                    modifiers={[
                      font({ size: 10, weight: 'medium' }),
                      foregroundStyle(textSecondary),
                      lineLimit(1),
                      minimumScaleFactor(0.75),
                      truncationMode('tail'),
                    ]}
                  >
                    {p.allocationLine}
                  </Text>
                )}
              </VStack>
            )}

            <VStack alignment="leading" spacing={8}>
              <Text
                modifiers={[
                  font({ size: 11, weight: 'semibold' }),
                  foregroundStyle(textSecondary),
                  lineLimit(1),
                ]}
              >
                {p.holdingsSectionTitle}
              </Text>
              <VStack alignment="leading" spacing={6}>
                {p.holding1Title.length > 0 && (
                  <HStack spacing={10} alignment="center">
                    <ZStack modifiers={[frame({ width: 28, height: 28 })]}>
                      <RoundedRectangle
                        cornerRadius={8}
                        modifiers={[
                          frame({ width: 28, height: 28 }),
                          background(
                            `${p.holding1Color}33`,
                            shapes.roundedRectangle({ cornerRadius: 8 })
                          ),
                        ]}
                      />
                      <Text
                        modifiers={[
                          font({ size: 13, weight: 'bold' }),
                          foregroundStyle(p.holding1Color),
                          lineLimit(1),
                        ]}
                      >
                        {p.holding1Icon}
                      </Text>
                    </ZStack>
                    <Text
                      modifiers={[
                        font({ size: 12, weight: 'semibold' }),
                        foregroundStyle(textPrimary),
                        lineLimit(1),
                        minimumScaleFactor(0.85),
                        truncationMode('tail'),
                      ]}
                    >
                      {p.holding1Title}
                    </Text>
                    <Spacer />
                    <Text
                      modifiers={[
                        font({ size: 11, weight: 'medium' }),
                        foregroundStyle(textSecondary),
                        lineLimit(1),
                        minimumScaleFactor(0.75),
                        truncationMode('tail'),
                      ]}
                    >
                      {p.holding1Meta}
                    </Text>
                  </HStack>
                )}
                {p.holding2Title.length > 0 && (
                  <HStack spacing={10} alignment="center">
                    <ZStack modifiers={[frame({ width: 28, height: 28 })]}>
                      <RoundedRectangle
                        cornerRadius={8}
                        modifiers={[
                          frame({ width: 28, height: 28 }),
                          background(
                            `${p.holding2Color}33`,
                            shapes.roundedRectangle({ cornerRadius: 8 })
                          ),
                        ]}
                      />
                      <Text
                        modifiers={[
                          font({ size: 13, weight: 'bold' }),
                          foregroundStyle(p.holding2Color),
                          lineLimit(1),
                        ]}
                      >
                        {p.holding2Icon}
                      </Text>
                    </ZStack>
                    <Text
                      modifiers={[
                        font({ size: 12, weight: 'semibold' }),
                        foregroundStyle(textPrimary),
                        lineLimit(1),
                        minimumScaleFactor(0.85),
                        truncationMode('tail'),
                      ]}
                    >
                      {p.holding2Title}
                    </Text>
                    <Spacer />
                    <Text
                      modifiers={[
                        font({ size: 11, weight: 'medium' }),
                        foregroundStyle(textSecondary),
                        lineLimit(1),
                        minimumScaleFactor(0.75),
                        truncationMode('tail'),
                      ]}
                    >
                      {p.holding2Meta}
                    </Text>
                  </HStack>
                )}
                {p.holding3Title.length > 0 && (
                  <HStack spacing={10} alignment="center">
                    <ZStack modifiers={[frame({ width: 28, height: 28 })]}>
                      <RoundedRectangle
                        cornerRadius={8}
                        modifiers={[
                          frame({ width: 28, height: 28 }),
                          background(
                            `${p.holding3Color}33`,
                            shapes.roundedRectangle({ cornerRadius: 8 })
                          ),
                        ]}
                      />
                      <Text
                        modifiers={[
                          font({ size: 13, weight: 'bold' }),
                          foregroundStyle(p.holding3Color),
                          lineLimit(1),
                        ]}
                      >
                        {p.holding3Icon}
                      </Text>
                    </ZStack>
                    <Text
                      modifiers={[
                        font({ size: 12, weight: 'semibold' }),
                        foregroundStyle(textPrimary),
                        lineLimit(1),
                        minimumScaleFactor(0.85),
                        truncationMode('tail'),
                      ]}
                    >
                      {p.holding3Title}
                    </Text>
                    <Spacer />
                    <Text
                      modifiers={[
                        font({ size: 11, weight: 'medium' }),
                        foregroundStyle(textSecondary),
                        lineLimit(1),
                        minimumScaleFactor(0.75),
                        truncationMode('tail'),
                      ]}
                    >
                      {p.holding3Meta}
                    </Text>
                  </HStack>
                )}
              </VStack>
            </VStack>

            <HStack alignment="center" modifiers={[frame({ maxWidth: Infinity })]}>
              <Text
                modifiers={[
                  font({ size: 10, weight: 'regular' }),
                  foregroundStyle(textMuted),
                  lineLimit(1),
                ]}
              >
                {p.updatedFormatted}
              </Text>
              <Spacer />
              <Text
                modifiers={[
                  font({ size: 10, weight: 'medium' }),
                  foregroundStyle(textSecondary),
                  lineLimit(1),
                ]}
              >
                {p.assetsLine}
              </Text>
            </HStack>
          </VStack>
        </ZStack>
      );
    }

    return (
      <ZStack modifiers={[containerBackground(bg, 'widget'), clipShape('containerRelativeShape')]}>
        <VStack alignment="leading" spacing={4} modifiers={contentFrame}>
          <HStack spacing={7} alignment="center">
            <ZStack modifiers={[frame({ width: 24, height: 24 })]}>
              <RoundedRectangle
                cornerRadius={7}
                modifiers={[
                  frame({ width: 24, height: 24 }),
                  background(accentSoft, shapes.roundedRectangle({ cornerRadius: 7 })),
                ]}
              />
              <Text
                modifiers={[
                  font({ size: 11, weight: 'bold' }),
                  foregroundStyle(accent),
                  lineLimit(1),
                ]}
              >
                ₺
              </Text>
            </ZStack>
            <Text
              modifiers={[
                font({ size: 11, weight: 'semibold' }),
                foregroundStyle(textPrimary),
                lineLimit(1),
              ]}
            >
              {p.brandShort}
            </Text>
            <Spacer />
            {p.changeLine.length > 0 && (
              <Text
                modifiers={[
                  font({ size: 9, weight: 'semibold' }),
                  foregroundStyle(changeColor),
                  lineLimit(1),
                  minimumScaleFactor(0.7),
                  truncationMode('tail'),
                ]}
              >
                {p.changeLine}
              </Text>
            )}
          </HStack>

          <Text
            modifiers={[
              font({ size: 15, weight: 'bold' }),
              foregroundStyle(textPrimary),
              lineLimit(1),
              minimumScaleFactor(0.4),
              truncationMode('tail'),
            ]}
          >
            {p.totalLine}
          </Text>

          {hasAllocBar && (
            <VStack alignment="leading" spacing={2}>
              <ZStack modifiers={[frame({ maxWidth: Infinity, height: 5 })]}>
                <RoundedRectangle
                  cornerRadius={2.5}
                  modifiers={[
                    frame({ maxWidth: Infinity, height: 5 }),
                    background(trackBg, shapes.roundedRectangle({ cornerRadius: 2.5 })),
                  ]}
                />
                <HStack spacing={1} alignment="center">
                  {p.alloc1BarWidth > 0 && (
                    <RoundedRectangle
                      cornerRadius={2.5}
                      modifiers={[
                        frame({ width: p.alloc1BarWidth, height: 5 }),
                        background(
                          p.alloc1Color,
                          shapes.roundedRectangle({ cornerRadius: 2.5 })
                        ),
                      ]}
                    />
                  )}
                  {p.alloc2BarWidth > 0 && (
                    <RoundedRectangle
                      cornerRadius={2.5}
                      modifiers={[
                        frame({ width: p.alloc2BarWidth, height: 5 }),
                        background(
                          p.alloc2Color,
                          shapes.roundedRectangle({ cornerRadius: 2.5 })
                        ),
                      ]}
                    />
                  )}
                  {p.alloc3BarWidth > 0 && (
                    <RoundedRectangle
                      cornerRadius={2.5}
                      modifiers={[
                        frame({ width: p.alloc3BarWidth, height: 5 }),
                        background(
                          p.alloc3Color,
                          shapes.roundedRectangle({ cornerRadius: 2.5 })
                        ),
                      ]}
                    />
                  )}
                </HStack>
              </ZStack>
              {p.allocationLine.length > 0 && (
                <Text
                  modifiers={[
                    font({ size: 8, weight: 'medium' }),
                    foregroundStyle(textSecondary),
                    lineLimit(1),
                    minimumScaleFactor(0.75),
                    truncationMode('tail'),
                  ]}
                >
                  {p.allocationLine}
                </Text>
              )}
            </VStack>
          )}

          {p.holding1Title.length > 0 && (
            <HStack spacing={6} alignment="center">
              <ZStack modifiers={[frame({ width: 20, height: 20 })]}>
                <RoundedRectangle
                  cornerRadius={5}
                  modifiers={[
                    frame({ width: 20, height: 20 }),
                    background(
                      `${p.holding1Color}33`,
                      shapes.roundedRectangle({ cornerRadius: 5 })
                    ),
                  ]}
                />
                <Text
                  modifiers={[
                    font({ size: 10, weight: 'bold' }),
                    foregroundStyle(p.holding1Color),
                    lineLimit(1),
                  ]}
                >
                  {p.holding1Icon}
                </Text>
              </ZStack>
              <Text
                modifiers={[
                  font({ size: 9, weight: 'semibold' }),
                  foregroundStyle(textPrimary),
                  lineLimit(1),
                  minimumScaleFactor(0.75),
                  truncationMode('tail'),
                ]}
              >
                {p.holding1Title}
              </Text>
              <Spacer />
              <Text
                modifiers={[
                  font({ size: 8, weight: 'medium' }),
                  foregroundStyle(textSecondary),
                  lineLimit(1),
                  minimumScaleFactor(0.7),
                  truncationMode('tail'),
                ]}
              >
                {p.holding1Meta}
              </Text>
            </HStack>
          )}

          {p.holding2Title.length > 0 && (
            <HStack spacing={6} alignment="center">
              <ZStack modifiers={[frame({ width: 20, height: 20 })]}>
                <RoundedRectangle
                  cornerRadius={5}
                  modifiers={[
                    frame({ width: 20, height: 20 }),
                    background(
                      `${p.holding2Color}33`,
                      shapes.roundedRectangle({ cornerRadius: 5 })
                    ),
                  ]}
                />
                <Text
                  modifiers={[
                    font({ size: 10, weight: 'bold' }),
                    foregroundStyle(p.holding2Color),
                    lineLimit(1),
                  ]}
                >
                  {p.holding2Icon}
                </Text>
              </ZStack>
              <Text
                modifiers={[
                  font({ size: 9, weight: 'semibold' }),
                  foregroundStyle(textPrimary),
                  lineLimit(1),
                  minimumScaleFactor(0.75),
                  truncationMode('tail'),
                ]}
              >
                {p.holding2Title}
              </Text>
              <Spacer />
              <Text
                modifiers={[
                  font({ size: 8, weight: 'medium' }),
                  foregroundStyle(textSecondary),
                  lineLimit(1),
                  minimumScaleFactor(0.7),
                  truncationMode('tail'),
                ]}
              >
                {p.holding2Meta}
              </Text>
            </HStack>
          )}

          <Text
            modifiers={[
              font({ size: 8, weight: 'regular' }),
              foregroundStyle(textMuted),
              lineLimit(1),
              minimumScaleFactor(0.8),
              truncationMode('tail'),
              padding({ top: 1 }),
            ]}
          >
            {p.updatedFormatted} · {p.assetsLine}
          </Text>
        </VStack>
      </ZStack>
    );
  }
);
