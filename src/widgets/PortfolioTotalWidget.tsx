import { Text, VStack } from '@expo/ui/swift-ui';
import { font, foregroundStyle, padding } from '@expo/ui/swift-ui/modifiers';
import { createWidget, type WidgetEnvironment } from 'expo-widgets';

export type PortfolioTotalWidgetProps = {
  titleLabel: string;
  totalFormatted: string;
  updatedFormatted: string;
};

const PortfolioTotalWidget = (
  props: PortfolioTotalWidgetProps,
  environment: WidgetEnvironment
) => {
  'widget';

  const isSmall = environment.widgetFamily === 'systemSmall';
  const titleSize = isSmall ? 11 : 12;
  const valueSize = isSmall ? 17 : 22;
  const metaSize = 10;
  const isDark = environment.colorScheme === 'dark';
  const muted = isDark ? '#94a3b8' : '#64748b';
  const primary = isDark ? '#f8fafc' : '#0f172a';

  return (
    <VStack modifiers={[padding({ all: 4 })]}>
      <Text modifiers={[font({ size: titleSize, weight: 'semibold' }), foregroundStyle(muted)]}>
        {props.titleLabel}
      </Text>
      <Text modifiers={[font({ size: valueSize, weight: 'bold' }), foregroundStyle(primary)]}>
        {props.totalFormatted} ₺
      </Text>
      <Text modifiers={[font({ size: metaSize, weight: 'regular' }), foregroundStyle(muted)]}>
        {props.updatedFormatted}
      </Text>
    </VStack>
  );
};

const widget = createWidget('PortfolioTotalWidget', PortfolioTotalWidget);

export default widget;
