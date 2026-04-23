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
    espresso:    '#1C1008',
    clay:        '#7A4528',
    latte:       '#C8956A',
    cream:       '#FDF6EC',
    parchment:   '#F5E9D4',
    vellum:      '#EDD9BC',
    brass:       '#B5822A',
    brassLight:  '#F7EDD8',
    brassBorder: '#DEC07A',
    sage:        '#3B6E52',
    sageLight:   '#EBF4EE',
    sageBorder:  '#9FCFB4',
    terracotta:  '#A03020',
    tcLight:     '#FAECEA',
    tcBorder:    '#E8A898',
    orange:      '#C2410C',
    orangeLight: '#FFF7ED',
    orangeBorder:'#FDBA74',
    yellow:      '#92400E',
    yellowLight: '#FFFBEB',
    yellowBorder:'#FCD34D',
}

const radius = { xs: 6, sm: 10, md: 14, lg: 18, pill: 100 }

interface StockAlertsProps {
    alerts: StockAlert[]
    onMarkAsRead: (alertId: string) => void
}

const getAlertTitle = (type: string) => {
    switch (type) {
        case 'out_of_stock':   return 'Out of Stock'
        case 'low_stock':      return 'Low Stock'
        case 'expiring_soon':  return 'Expiring Soon'
        case 'expired':        return 'Product Expired'
        default:               return 'Alert'
    }
}

const getAlertPriority = (type: string): 'high' | 'medium' | 'low' => {
    switch (type) {
        case 'out_of_stock':
        case 'expired':        return 'high'
        case 'low_stock':
        case 'expiring_soon':  return 'medium'
        default:               return 'low'
    }
}

const priorityStyle = (priority: 'high' | 'medium' | 'low') => {
    switch (priority) {
        case 'high':   return { bg: C.tcLight,     border: C.tcBorder,     text: C.terracotta, icon: C.terracotta }
        case 'medium': return { bg: C.orangeLight,  border: C.orangeBorder, text: C.orange,     icon: C.orange }
        default:       return { bg: C.yellowLight,  border: C.yellowBorder, text: C.yellow,     icon: C.yellow }
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
        <View style={styles.group}>
            <View style={styles.groupHeader}>
                <Icon size={16} color={pStyle.icon} />
                <Text style={[styles.groupTitle, { color: pStyle.text }]}>
                    {title} ({count})
                </Text>
            </View>

            {alerts.map(alert => (
                <View
                    key={alert.id}
                    style={[styles.alertCard, { backgroundColor: pStyle.bg, borderColor: pStyle.border }]}
                >
                    <View style={styles.alertLeft}>
                        <View style={[styles.alertIconBox, { backgroundColor: pStyle.bg, borderColor: pStyle.border, borderWidth: 1 }]}>
                            <Text style={styles.alertEmoji}>{getAlertIcon(alert.alert_type)}</Text>
                        </View>
                        <View style={styles.alertBody}>
                            <Text style={[styles.alertTitle, { color: pStyle.text }]}>
                                {getAlertTitle(alert.alert_type)}
                            </Text>
                            <Text style={[styles.alertMessage, { color: pStyle.text }]} numberOfLines={2}>
                                {alert.message}
                            </Text>
                            <Text style={[styles.alertTime, { color: pStyle.text }]}>
                                {new Date(alert.created_at).toLocaleString()}
                            </Text>
                        </View>
                    </View>
                    <TouchableOpacity
                        style={styles.dismissBtn}
                        onPress={() => onMarkAsRead(alert.id)}
                    >
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

    if (alerts.length === 0) {
        return (
            <View style={styles.empty}>
                <View style={styles.emptyIcon}>
                    <AlertTriangle size={32} color={C.brass} />
                </View>
                <Text style={styles.emptyTitle}>No Active Alerts</Text>
                <Text style={styles.emptySub}>All your stocks are in good condition</Text>
            </View>
        )
    }

    return (
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

            <View style={styles.summaryBar}>
                <View style={styles.summaryItem}>
                    <View style={[styles.summaryDot, { backgroundColor: C.terracotta }]} />
                    <Text style={styles.summaryText}>{highAlerts.length} urgent</Text>
                </View>
                <View style={styles.summaryItem}>
                    <View style={[styles.summaryDot, { backgroundColor: C.orange }]} />
                    <Text style={styles.summaryText}>{mediumAlerts.length} warning</Text>
                </View>
                <View style={styles.summaryItem}>
                    <View style={[styles.summaryDot, { backgroundColor: C.yellow }]} />
                    <Text style={styles.summaryText}>{lowAlerts.length} info</Text>
                </View>
                <TouchableOpacity
                    style={styles.markAllBtn}
                    onPress={() => alerts.forEach(a => onMarkAsRead(a.id))}
                >
                    <Check size={12} color={C.cream} />
                    <Text style={styles.markAllText}>All Read</Text>
                </TouchableOpacity>
            </View>

            {highAlerts.length > 0 && (
                <AlertGroup
                    title="Urgent"
                    count={highAlerts.length}
                    alerts={highAlerts}
                    priority="high"
                    onMarkAsRead={onMarkAsRead}
                />
            )}

            {mediumAlerts.length > 0 && (
                <AlertGroup
                    title="Warning"
                    count={mediumAlerts.length}
                    alerts={mediumAlerts}
                    priority="medium"
                    onMarkAsRead={onMarkAsRead}
                />
            )}

            {lowAlerts.length > 0 && (
                <AlertGroup
                    title="Information"
                    count={lowAlerts.length}
                    alerts={lowAlerts}
                    priority="low"
                    onMarkAsRead={onMarkAsRead}
                />
            )}

        </ScrollView>
    )
}

const styles = StyleSheet.create({
    scroll: {
        padding: 16, paddingBottom: 32, gap: 16,
    },

    empty: {
        flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 32,
    },
    emptyIcon: {
        width: 72, height: 72, borderRadius: radius.lg,
        backgroundColor: C.brassLight, borderWidth: 1.5, borderColor: C.brassBorder,
        alignItems: 'center', justifyContent: 'center',
    },
    emptyTitle: {
        fontSize: 17, fontWeight: '800', color: C.espresso,
    },
    emptySub: {
        fontSize: 12, color: C.clay, textAlign: 'center',
    },

    summaryBar: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        backgroundColor: C.cream,
        borderRadius: radius.md,
        borderWidth: 1.5, borderColor: C.vellum,
        padding: 12,
    },
    summaryItem: {
        flexDirection: 'row', alignItems: 'center', gap: 5, flex: 1,
    },
    summaryDot: {
        width: 8, height: 8, borderRadius: radius.pill,
    },
    summaryText: {
        fontSize: 11, color: C.clay, fontWeight: '600',
    },
    markAllBtn: {
        flexDirection: 'row', alignItems: 'center', gap: 4,
        backgroundColor: C.sage, borderRadius: radius.pill,
        paddingHorizontal: 10, paddingVertical: 5,
    },
    markAllText: {
        fontSize: 10, fontWeight: '800', color: C.cream,
    },

    group: {
        gap: 8,
    },
    groupHeader: {
        flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2,
    },
    groupTitle: {
        fontSize: 13, fontWeight: '800',
    },

    alertCard: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        borderWidth: 1.5,
        borderRadius: radius.md,
        padding: 12,
        gap: 10,
    },
    alertLeft: {
        flexDirection: 'row', alignItems: 'flex-start', gap: 10, flex: 1,
    },
    alertIconBox: {
        width: 34, height: 34, borderRadius: radius.sm,
        alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    },
    alertEmoji: {
        fontSize: 16,
    },
    alertBody: {
        flex: 1, gap: 2,
    },
    alertTitle: {
        fontSize: 12, fontWeight: '800',
    },
    alertMessage: {
        fontSize: 12, fontWeight: '500', opacity: 0.85,
    },
    alertTime: {
        fontSize: 10, fontWeight: '500', opacity: 0.7, marginTop: 2,
    },
    dismissBtn: {
        padding: 4,
    },
})
