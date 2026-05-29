import {
    AlertCircle,
    AlertTriangle,
    Check,
    Package,
    X,
} from 'lucide-react-native'
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native'
import { StockAlert, getAlertIcon } from '../types/inventory'

const C = {
  black:      '#0A0A0A',
  charcoal:   '#1A1A1A',
  graphite:   '#2C2C2C',
  muted:      '#6B6B6B',
  border:     '#2E2E2E',
  card:       '#1E1E1E',
  orange:     '#FF6B2C',
  orangeTint: '#2A1A10',
  orangeDim:  '#7A3010',
  white:      '#FFFFFF',
  dim:        '#A0A0A0',
  success:    '#22C55E',
  successDim: '#22C55E18',
  successBdr: '#22C55E44',
  warning:    '#F59E0B',
  warningDim: '#F59E0B18',
  warningBdr: '#F59E0B44',
  error:      '#EF4444',
  errorDim:   '#EF444418',
  errorBdr:   '#EF444444',
}

const radius = { xs: 6, sm: 10, md: 14, lg: 18, pill: 100 }

interface StockAlertsProps {
    alerts: StockAlert[]
    onMarkAsRead: (alertId: string) => void
}

const getAlertTitle = (type: string) => {
    switch (type) {
        case 'out_of_stock':  return 'Out of Stock'
        case 'low_stock':     return 'Low Stock'
        case 'expiring_soon': return 'Expiring Soon'
        case 'expired':       return 'Product Expired'
        default:              return 'Alert'
    }
}

const getAlertPriority = (type: string): 'high' | 'medium' | 'low' => {
    switch (type) {
        case 'out_of_stock':
        case 'expired':       return 'high'
        case 'low_stock':
        case 'expiring_soon': return 'medium'
        default:              return 'low'
    }
}

const priorityStyle = (priority: 'high' | 'medium' | 'low') => {
    switch (priority) {
        case 'high':   return { bg: C.errorDim,   border: C.errorBdr,   text: C.error,   icon: C.error   }
        case 'medium': return { bg: C.orangeTint, border: C.orangeDim,  text: C.orange,  icon: C.orange  }
        default:       return { bg: C.warningDim, border: C.warningBdr, text: C.warning, icon: C.warning }
    }
}

interface AlertGroupProps {
    title: string
    count: number
    alerts: StockAlert[]
    priority: 'high' | 'medium' | 'low'
    onMarkAsRead: (id: string) => void
}

function AlertGroup({ title, count, alerts, priority, onMarkAsRead }: AlertGroupProps) {
    const pStyle = priorityStyle(priority)
    const Icon   = priority === 'high' ? AlertCircle : priority === 'medium' ? AlertTriangle : Package

    return (
        <View style={s.group}>
            <View style={s.groupHeader}>
                <Icon size={16} color={pStyle.icon} />
                <Text style={[s.groupTitle, { color: pStyle.text }]}>{title} ({count})</Text>
            </View>
            {alerts.map(alert => (
                <View key={alert.id} style={[s.alertCard, { backgroundColor: pStyle.bg, borderColor: pStyle.border }]}>
                    <View style={s.alertLeft}>
                        <View style={[s.alertIconBox, { backgroundColor: pStyle.bg, borderColor: pStyle.border, borderWidth: 1 }]}>
                            <Text style={s.alertEmoji}>{getAlertIcon(alert.alert_type)}</Text>
                        </View>
                        <View style={s.alertBody}>
                            <Text style={[s.alertTitle, { color: pStyle.text }]}>{getAlertTitle(alert.alert_type)}</Text>
                            <Text style={[s.alertMessage, { color: pStyle.text }]} numberOfLines={2}>{alert.message}</Text>
                            <Text style={[s.alertTime, { color: pStyle.text }]}>{new Date(alert.created_at).toLocaleString()}</Text>
                        </View>
                    </View>
                    <TouchableOpacity style={s.dismissBtn} onPress={() => onMarkAsRead(alert.id)}>
                        <X size={14} color={pStyle.text} />
                    </TouchableOpacity>
                </View>
            ))}
        </View>
    )
}

export default function StockAlerts({ alerts, onMarkAsRead }: StockAlertsProps) {
    const highAlerts   = alerts.filter(a => getAlertPriority(a.alert_type) === 'high')
    const mediumAlerts = alerts.filter(a => getAlertPriority(a.alert_type) === 'medium')
    const lowAlerts    = alerts.filter(a => getAlertPriority(a.alert_type) === 'low')

    if (alerts.length === 0) return (
        <View style={s.empty}>
            <View style={s.emptyIcon}><AlertTriangle size={32} color={C.orange} /></View>
            <Text style={s.emptyTitle}>No Active Alerts</Text>
            <Text style={s.emptySub}>All your stocks are in good condition</Text>
        </View>
    )

    return (
        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

            <View style={s.summaryBar}>
                <View style={s.summaryItem}>
                    <View style={[s.summaryDot, { backgroundColor: C.error }]} />
                    <Text style={s.summaryText}>{highAlerts.length} urgent</Text>
                </View>
                <View style={s.summaryItem}>
                    <View style={[s.summaryDot, { backgroundColor: C.orange }]} />
                    <Text style={s.summaryText}>{mediumAlerts.length} warning</Text>
                </View>
                <View style={s.summaryItem}>
                    <View style={[s.summaryDot, { backgroundColor: C.warning }]} />
                    <Text style={s.summaryText}>{lowAlerts.length} info</Text>
                </View>
                <TouchableOpacity style={s.markAllBtn} onPress={() => alerts.forEach(a => onMarkAsRead(a.id))}>
                    <Check size={12} color={C.white} />
                    <Text style={s.markAllText}>All Read</Text>
                </TouchableOpacity>
            </View>

            {highAlerts.length   > 0 && <AlertGroup title="Urgent"      count={highAlerts.length}   alerts={highAlerts}   priority="high"   onMarkAsRead={onMarkAsRead} />}
            {mediumAlerts.length > 0 && <AlertGroup title="Warning"     count={mediumAlerts.length} alerts={mediumAlerts} priority="medium" onMarkAsRead={onMarkAsRead} />}
            {lowAlerts.length    > 0 && <AlertGroup title="Information" count={lowAlerts.length}    alerts={lowAlerts}    priority="low"    onMarkAsRead={onMarkAsRead} />}

        </ScrollView>
    )
}

const s = StyleSheet.create({
    scroll: { padding: 16, paddingBottom: 32, gap: 16 },

    empty:     { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 32 },
    emptyIcon: { width: 72, height: 72, borderRadius: radius.lg, backgroundColor: C.orangeTint, borderWidth: 1.5, borderColor: C.orangeDim, alignItems: 'center', justifyContent: 'center' },
    emptyTitle:{ fontSize: 17, fontWeight: '800', color: C.white },
    emptySub:  { fontSize: 12, color: C.muted, textAlign: 'center' },

    summaryBar:  { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: C.charcoal, borderRadius: radius.md, borderWidth: 1.5, borderColor: C.border, padding: 12 },
    summaryItem: { flexDirection: 'row', alignItems: 'center', gap: 5, flex: 1 },
    summaryDot:  { width: 8, height: 8, borderRadius: radius.pill },
    summaryText: { fontSize: 11, color: C.dim, fontWeight: '600' },
    markAllBtn:  { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: C.orange, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 5 },
    markAllText: { fontSize: 10, fontWeight: '800', color: C.white },

    group:       { gap: 8 },
    groupHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
    groupTitle:  { fontSize: 13, fontWeight: '800' },

    alertCard:   { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', borderWidth: 1.5, borderRadius: radius.md, padding: 12, gap: 10 },
    alertLeft:   { flexDirection: 'row', alignItems: 'flex-start', gap: 10, flex: 1 },
    alertIconBox:{ width: 34, height: 34, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    alertEmoji:  { fontSize: 16 },
    alertBody:   { flex: 1, gap: 2 },
    alertTitle:  { fontSize: 12, fontWeight: '800' },
    alertMessage:{ fontSize: 12, fontWeight: '500', opacity: 0.85 },
    alertTime:   { fontSize: 10, fontWeight: '500', opacity: 0.7, marginTop: 2 },
    dismissBtn:  { padding: 4 },
})