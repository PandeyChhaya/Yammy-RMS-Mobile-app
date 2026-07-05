import { ArrowLeft, ChevronRight, FileText, X } from 'lucide-react-native'
import { useState } from 'react'
import {
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native'
import type { PaymentCalculatorProps, PaymentMethod, SplitEntry } from './types/payment'

const C = {
  black:      '#0A0A0A',
  charcoal:   '#1A1A1A',
  graphite:   '#2C2C2C',
  steel:      '#3D3D3D',
  muted:      '#6B6B6B',
  border:     '#2E2E2E',
  card:       '#1E1E1E',
  orange:     '#FF6B2C',
  orangeTint: '#2A1A10',
  orangeDim:  '#7A3010',
  white:      '#FFFFFF',
  offWhite:   '#F0F0F0',
  dim:        '#A0A0A0',
  success:    '#22C55E',
  successBg:  '#0D2818',
  successBorder: '#1A4A2A',
  error:      '#EF4444',
  errorBg:    '#2A0A0A',
  errorBorder:'#7A1010',
}

const radius = { xs: 6, sm: 10, md: 14, lg: 20, pill: 100 }

const KEYS = ['7','8','9','4','5','6','1','2','3','.','0','⌫']
const fmt = (n: number, sym = 'NPR') => `${sym} ${Number(n).toFixed(2)}`

export type Screen = 'calculator' | 'split'

interface Props extends PaymentCalculatorProps {
    screen: Screen
    setScreen: (s: Screen) => void
}

export default function PaymentCalculator({
    onClose,
    onCharge,
    onSplit,
    totalWithTax,
    symbol = 'NPR',
    screen,
    setScreen,
}: Props) {
    const [input,     setInput]     = useState('')
    const [notes,     setNotes]     = useState('')
    const [showNotes, setShowNotes] = useState(false)
    const [method,    setMethod]    = useState<PaymentMethod>('cash')
    const [splits,    setSplits]    = useState<SplitEntry[]>([
        { id: 1, amount: '' },
        { id: 2, amount: '' },
    ])

    const numericValue = parseFloat(input) || 0
    const changeDue    = Math.max(0, numericValue - totalWithTax)
    const splitTotal   = splits.reduce((s, e) => s + (parseFloat(e.amount) || 0), 0)
    const splitLeft    = Math.max(0, totalWithTax - splitTotal)

    const handleKey = (key: string) => {
        if (key === '⌫') { setInput(p => p.slice(0, -1)); return }
        if (key === '.' && input.includes('.')) return
        if (input.length >= 10) return
        setInput(p => p + key)
    }

    const handleCharge = () => {
        if (method === 'esewa') {
            // parent (PaymentModal) swaps in the eSewa WebView once
            // esewaInitMutation succeeds, no local screen change needed here
            onCharge(totalWithTax, notes, 'esewa')
        } else {
            onCharge(numericValue || totalWithTax, notes, 'cash')
        }
    }

    const addSplit    = () => setSplits(p => [...p, { id: Date.now(), amount: '' }])
    const removeSplit = (id: number) => { if (splits.length > 2) setSplits(p => p.filter(s => s.id !== id)) }
    const updateSplit = (id: number, val: string) => setSplits(p => p.map(s => s.id === id ? { ...s, amount: val } : s))

    // ── Split Screen ─────────────────────────────────────────
    if (screen === 'split') {
        return (
            <ScrollView contentContainerStyle={s.padded} showsVerticalScrollIndicator={false}>
                <View style={s.splitHeader}>
                    <TouchableOpacity onPress={() => setScreen('calculator')}>
                        <ArrowLeft size={16} color={C.orange} />
                    </TouchableOpacity>
                    <Text style={s.splitTitle}>Split Bill</Text>
                </View>

                <View style={s.splitTotalBox}>
                    <Text style={s.splitTotalLabel}>Total to split</Text>
                    <Text style={s.splitTotalValue}>{fmt(totalWithTax, symbol)}</Text>
                </View>

                {splits.map((sp, idx) => (
                    <View key={sp.id} style={s.splitRow}>
                        <Text style={s.splitPersonLabel}>Person {idx + 1}</Text>
                        <TextInput
                            style={s.splitInput}
                            value={sp.amount}
                            onChangeText={val => updateSplit(sp.id, val)}
                            placeholder="0.00"
                            placeholderTextColor={C.muted}
                            keyboardType="decimal-pad"
                        />
                        {splits.length > 2 && (
                            <TouchableOpacity style={s.splitRemove} onPress={() => removeSplit(sp.id)}>
                                <X size={14} color={C.error} />
                            </TouchableOpacity>
                        )}
                    </View>
                ))}

                <View style={s.splitRemainingRow}>
                    <Text style={s.splitRemainingLabel}>Remaining</Text>
                    <Text style={[s.splitRemainingValue, splitLeft === 0 && { color: C.success }]}>
                        {fmt(splitLeft, symbol)}
                    </Text>
                </View>

                <TouchableOpacity style={s.addPersonBtn} onPress={addSplit}>
                    <Text style={s.addPersonText}>+ Add Person</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[s.chargeBtn, splitLeft > 0 && s.chargeBtnDisabled]}
                    onPress={() => onSplit(splits, notes)}
                    disabled={splitLeft > 0}
                >
                    <Text style={s.chargeBtnText}>Confirm Split</Text>
                </TouchableOpacity>
            </ScrollView>
        )
    }

    // ── Calculator Screen ────────────────────────────────────
    return (
        <ScrollView contentContainerStyle={s.padded} showsVerticalScrollIndicator={false}>
            <View style={s.header}>
                <Text style={s.headerTitle}>Charge</Text>
                <TouchableOpacity style={s.closeBtn} onPress={onClose}>
                    <X size={18} color={C.dim} />
                </TouchableOpacity>
            </View>

            {/* Display */}
            <View style={s.displayBox}>
                <Text style={s.totalDue}>Due: {fmt(totalWithTax, symbol)}</Text>
                <Text style={s.displayValue}>{symbol} {input || '0.00'}</Text>
                {numericValue > 0 && (
                    <Text style={s.changeText}>Change: {fmt(changeDue, symbol)}</Text>
                )}
            </View>

            {/* Method selector */}
            <View style={s.methodRow}>
                {(['cash', 'esewa'] as PaymentMethod[]).map(m => (
                    <TouchableOpacity
                        key={m}
                        style={[s.methodBtn, method === m && s.methodActive]}
                        onPress={() => setMethod(m)}
                    >
                        <Text style={[s.methodText, method === m && s.methodTextActive]}>
                            {m === 'cash' ? '💵 Cash' : '🟢 eSewa'}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Keypad */}
            {method === 'cash' && (
                <View style={s.keypad}>
                    {KEYS.map(k => (
                        <TouchableOpacity
                            key={k}
                            style={[s.key, k === '⌫' && s.keyDelete]}
                            onPress={() => handleKey(k)}
                            activeOpacity={0.6}
                        >
                            <Text style={[s.keyText, k === '⌫' && s.keyDeleteText]}>{k}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            )}

            {method === 'esewa' && (
                <View style={s.esewaHint}>
                    <Text style={s.esewaHintText}>
                        Tap Charge to generate a QR code for the customer to scan
                    </Text>
                </View>
            )}

            {/* Notes */}
            <TouchableOpacity style={s.notesRow} onPress={() => setShowNotes(p => !p)} activeOpacity={0.7}>
                <FileText size={15} color={C.orange} />
                <Text style={s.notesLabel}>{notes || 'Add a note...'}</Text>
                <ChevronRight size={15} color={C.muted} />
            </TouchableOpacity>

            {showNotes && (
                <TextInput
                    style={s.notesInput}
                    value={notes}
                    onChangeText={setNotes}
                    placeholder="Write a note for this order..."
                    placeholderTextColor={C.muted}
                    multiline
                    numberOfLines={2}
                    autoFocus
                />
            )}

            {/* Actions */}
            <View style={s.actionRow}>
                <TouchableOpacity style={s.splitBtn} onPress={() => setScreen('split')}>
                    <Text style={s.splitBtnText}>Split</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.chargeBtn} onPress={handleCharge}>
                    <Text style={s.chargeBtnText}>
                        Charge {fmt(numericValue || totalWithTax, symbol)}
                    </Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    )
}

const s = StyleSheet.create({
    padded: { padding: 20, paddingBottom: 32 },

    // ── Header
    header: {
        flexDirection: 'row', alignItems: 'center',
        justifyContent: 'space-between', marginBottom: 16,
    },
    headerTitle: { fontSize: 20, fontWeight: '900', color: C.white },
    closeBtn: {
        padding: 6, borderRadius: radius.xs,
        backgroundColor: C.graphite, borderWidth: 1, borderColor: C.border,
    },

    // ── Display
    displayBox: {
        backgroundColor: C.charcoal, borderRadius: radius.md,
        borderWidth: 1, borderColor: C.border,
        padding: 20, alignItems: 'flex-end', marginBottom: 14, gap: 4,
    },
    totalDue:     { fontSize: 12, color: C.muted, fontWeight: '600' },
    displayValue: { fontSize: 36, fontWeight: '900', color: C.orange, letterSpacing: 1 },
    changeText:   { fontSize: 13, color: C.success, fontWeight: '700' },

    // ── Method
    methodRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
    methodBtn: {
        flex: 1, alignItems: 'center', paddingVertical: 10,
        borderRadius: radius.pill, borderWidth: 1,
        borderColor: C.border, backgroundColor: C.graphite,
    },
    methodActive:     { backgroundColor: C.successBg, borderColor: C.successBorder },
    methodText:       { fontSize: 13, fontWeight: '700', color: C.dim },
    methodTextActive: { color: C.success },

    // ── Keypad
    keypad: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
    key: {
        width: '30%', paddingVertical: 16, alignItems: 'center',
        borderRadius: radius.md, backgroundColor: C.graphite,
        borderWidth: 1, borderColor: C.border, flexGrow: 1,
    },
    keyDelete:     { backgroundColor: C.errorBg, borderColor: C.errorBorder },
    keyText:       { fontSize: 20, fontWeight: '700', color: C.offWhite },
    keyDeleteText: { color: C.error },

    // ── eSewa hint
    esewaHint: {
        backgroundColor: C.successBg, borderRadius: radius.md,
        borderWidth: 1, borderColor: C.successBorder,
        padding: 14, alignItems: 'center', marginBottom: 14,
    },
    esewaHintText: { fontSize: 13, color: C.success, fontWeight: '600', textAlign: 'center' },

    // ── Notes
    notesRow: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        backgroundColor: C.graphite, borderRadius: radius.md,
        borderWidth: 1, borderColor: C.border, padding: 12, marginBottom: 8,
    },
    notesLabel: { flex: 1, fontSize: 13, color: C.dim, fontWeight: '500' },
    notesInput: {
        borderWidth: 1, borderColor: C.border, borderRadius: radius.md,
        backgroundColor: C.graphite, paddingHorizontal: 14, paddingVertical: 10,
        fontSize: 13, color: C.white, height: 72,
        textAlignVertical: 'top', marginBottom: 10,
    },

    // ── Actions
    actionRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
    splitBtn: {
        paddingVertical: 15, paddingHorizontal: 24,
        borderRadius: radius.pill, borderWidth: 1,
        borderColor: C.border, backgroundColor: C.graphite, alignItems: 'center',
    },
    splitBtnText:      { fontSize: 15, fontWeight: '800', color: C.offWhite },
    chargeBtn: {
        flex: 1, backgroundColor: C.orange,
        borderRadius: radius.pill, paddingVertical: 15, alignItems: 'center',
    },
    chargeBtnDisabled: { opacity: 0.4 },
    chargeBtnText:     { fontSize: 15, fontWeight: '800', color: C.white },

    // ── Split Screen
    splitHeader:    { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
    splitTitle:     { fontSize: 18, fontWeight: '900', color: C.white },
    splitTotalBox: {
        backgroundColor: C.card, borderRadius: radius.md,
        borderWidth: 1, borderColor: C.border,
        padding: 14, marginBottom: 14,
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    },
    splitTotalLabel: { fontSize: 13, color: C.muted, fontWeight: '600' },
    splitTotalValue: { fontSize: 18, fontWeight: '900', color: C.orange },
    splitRow:        { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
    splitPersonLabel:{ fontSize: 12, fontWeight: '700', color: C.dim, width: 64 },
    splitInput: {
        flex: 1, borderWidth: 1, borderColor: C.border, borderRadius: radius.md,
        paddingHorizontal: 12, paddingVertical: 9,
        fontSize: 14, color: C.white, backgroundColor: C.graphite,
    },
    splitRemove: {
        padding: 7, borderRadius: radius.xs,
        backgroundColor: C.errorBg, borderWidth: 1, borderColor: C.errorBorder,
    },
    splitRemainingRow: {
        flexDirection: 'row', justifyContent: 'space-between',
        borderTopWidth: 1, borderTopColor: C.border,
        paddingTop: 10, marginTop: 4, marginBottom: 14,
    },
    splitRemainingLabel: { fontSize: 13, fontWeight: '700', color: C.dim },
    splitRemainingValue: { fontSize: 14, fontWeight: '900', color: C.error },
    addPersonBtn: {
        alignItems: 'center', paddingVertical: 10, borderRadius: radius.md,
        borderWidth: 1, borderColor: C.border,
        backgroundColor: C.graphite, marginBottom: 14,
    },
    addPersonText: { fontSize: 13, fontWeight: '700', color: C.orange },
})