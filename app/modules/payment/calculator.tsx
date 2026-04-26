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
import QRCode from 'react-native-qrcode-svg'
import type { PaymentCalculatorProps, PaymentMethod, SplitEntry } from './types/payment'

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
}
const radius = { xs: 6, sm: 10, md: 14, lg: 20, pill: 100 }

const KEYS = ['7','8','9','4','5','6','1','2','3','.','0','⌫']

const fmt = (n: number, sym = 'NPR') => `${sym} ${Number(n).toFixed(2)}`

type Screen = 'calculator' | 'qr' | 'split'

export default function PaymentCalculator({
    onClose,
    onCharge,
    onSplit,
    totalWithTax,
    esewaQrUrl,
    symbol = 'NPR',
}: PaymentCalculatorProps & { esewaQrUrl?: string }) {
    const [screen,    setScreen]    = useState<Screen>('calculator')
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
            setScreen('qr')
            onCharge(totalWithTax, notes, 'esewa')
        } else {
            onCharge(numericValue || totalWithTax, notes, 'cash')
        }
    }

    const addSplit    = () => setSplits(p => [...p, { id: Date.now(), amount: '' }])
    const removeSplit = (id: number) => { if (splits.length > 2) setSplits(p => p.filter(s => s.id !== id)) }
    const updateSplit = (id: number, val: string) => setSplits(p => p.map(s => s.id === id ? { ...s, amount: val } : s))

    if (screen === 'qr') {
        const qrValue = esewaQrUrl || `https://rc-epay.esewa.com.np/epay/main?amt=${totalWithTax}&scd=EPAYTEST`
        return (
            <ScrollView contentContainerStyle={s.qrScreen} showsVerticalScrollIndicator={false}>
                <TouchableOpacity style={s.backRow} onPress={() => setScreen('calculator')}>
                    <ArrowLeft size={16} color={C.clay} />
                    <Text style={s.backText}>Back</Text>
                </TouchableOpacity>

                <Text style={s.qrTitle}>eSewa Payment</Text>
                <Text style={s.qrSubtitle}>Show this QR to the customer</Text>

                <View style={s.qrBox}>
                    <QRCode
                        value={qrValue}
                        size={220}
                        color={C.espresso}
                        backgroundColor={C.cream}
                    />
                </View>

                <View style={s.qrAmountBox}>
                    <Text style={s.qrAmountLabel}>Amount to Pay</Text>
                    <Text style={s.qrAmountValue}>{fmt(totalWithTax, symbol)}</Text>
                </View>

                <Text style={s.qrInstruction}>
                    Customer opens eSewa → Scan QR → Confirm with PIN or fingerprint
                </Text>
            </ScrollView>
        )
    }

    if (screen === 'split') {
        return (
            <ScrollView contentContainerStyle={s.padded} showsVerticalScrollIndicator={false}>
                <View style={s.splitHeader}>
                    <TouchableOpacity onPress={() => setScreen('calculator')}>
                        <ArrowLeft size={16} color={C.clay} />
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
                            placeholderTextColor={C.latte}
                            keyboardType="decimal-pad"
                        />
                        {splits.length > 2 && (
                            <TouchableOpacity style={s.splitRemove} onPress={() => removeSplit(sp.id)}>
                                <X size={14} color={C.terracotta} />
                            </TouchableOpacity>
                        )}
                    </View>
                ))}

                <View style={s.splitRemainingRow}>
                    <Text style={s.splitRemainingLabel}>Remaining</Text>
                    <Text style={[s.splitRemainingValue, splitLeft === 0 && { color: C.sage }]}>
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

    return (
        <ScrollView contentContainerStyle={s.padded} showsVerticalScrollIndicator={false}>
            <View style={s.header}>
                <Text style={s.headerTitle}>Charge</Text>
                <TouchableOpacity style={s.closeBtn} onPress={onClose}>
                    <X size={18} color={C.clay} />
                </TouchableOpacity>
            </View>

            <View style={s.displayBox}>
                <Text style={s.totalDue}>Due: {fmt(totalWithTax, symbol)}</Text>
                <Text style={s.displayValue}>
                    {symbol} {input || '0.00'}
                </Text>
                {numericValue > 0 && (
                    <Text style={s.changeText}>Change: {fmt(changeDue, symbol)}</Text>
                )}
            </View>

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

            <TouchableOpacity
                style={s.notesRow}
                onPress={() => setShowNotes(p => !p)}
                activeOpacity={0.7}
            >
                <FileText size={15} color={C.clay} />
                <Text style={s.notesLabel}>{notes || 'Add a note...'}</Text>
                <ChevronRight size={15} color={C.latte} />
            </TouchableOpacity>

            {showNotes && (
                <TextInput
                    style={s.notesInput}
                    value={notes}
                    onChangeText={setNotes}
                    placeholder="Write a note for this order..."
                    placeholderTextColor={C.latte}
                    multiline
                    numberOfLines={2}
                    autoFocus
                />
            )}

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
    header: {
        flexDirection: 'row', alignItems: 'center',
        justifyContent: 'space-between', marginBottom: 16,
    },
    headerTitle: { fontSize: 18, fontWeight: '900', color: C.espresso },
    closeBtn: {
        padding: 6, borderRadius: radius.xs,
        backgroundColor: C.cream, borderWidth: 1, borderColor: C.vellum,
    },
    displayBox: {
        backgroundColor: C.espresso, borderRadius: radius.md,
        padding: 20, alignItems: 'flex-end', marginBottom: 14, gap: 4,
    },
    totalDue:     { fontSize: 12, color: C.latte, fontWeight: '600' },
    displayValue: { fontSize: 36, fontWeight: '900', color: C.cream, letterSpacing: 1 },
    changeText:   { fontSize: 13, color: C.sage, fontWeight: '700' },
    methodRow:    { flexDirection: 'row', gap: 8, marginBottom: 14 },
    methodBtn: {
        flex: 1, alignItems: 'center', paddingVertical: 9,
        borderRadius: radius.pill, borderWidth: 1.5,
        borderColor: C.vellum, backgroundColor: C.cream,
    },
    methodActive:     { backgroundColor: C.sageLight, borderColor: C.sageBorder },
    methodText:       { fontSize: 13, fontWeight: '700', color: C.clay },
    methodTextActive: { color: C.sage },
    keypad: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
    key: {
        width: '30%', paddingVertical: 16, alignItems: 'center',
        borderRadius: radius.md, backgroundColor: C.cream,
        borderWidth: 1.5, borderColor: C.vellum, flexGrow: 1,
    },
    keyDelete:     { backgroundColor: C.tcLight, borderColor: C.tcBorder },
    keyText:       { fontSize: 20, fontWeight: '700', color: C.espresso },
    keyDeleteText: { color: C.terracotta },
    esewaHint: {
        backgroundColor: C.sageLight, borderRadius: radius.md,
        borderWidth: 1.5, borderColor: C.sageBorder,
        padding: 14, alignItems: 'center', marginBottom: 14,
    },
    esewaHintText: { fontSize: 13, color: C.sage, fontWeight: '600', textAlign: 'center' },
    notesRow: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        backgroundColor: C.cream, borderRadius: radius.md,
        borderWidth: 1.5, borderColor: C.vellum, padding: 12, marginBottom: 8,
    },
    notesLabel: { flex: 1, fontSize: 13, color: C.clay, fontWeight: '500' },
    notesInput: {
        borderWidth: 1.5, borderColor: C.brassBorder, borderRadius: radius.md,
        backgroundColor: C.brassLight, paddingHorizontal: 14, paddingVertical: 10,
        fontSize: 13, color: C.espresso, height: 72,
        textAlignVertical: 'top', marginBottom: 10,
    },
    actionRow:    { flexDirection: 'row', gap: 10, marginTop: 4 },
    splitBtn: {
        paddingVertical: 15, paddingHorizontal: 24,
        borderRadius: radius.pill, borderWidth: 1.5,
        borderColor: C.brassBorder, backgroundColor: C.brassLight, alignItems: 'center',
    },
    splitBtnText:      { fontSize: 15, fontWeight: '800', color: C.brass },
    chargeBtn: {
        flex: 1, backgroundColor: C.sage,
        borderRadius: radius.pill, paddingVertical: 15, alignItems: 'center',
    },
    chargeBtnDisabled: { opacity: 0.4 },
    chargeBtnText:     { fontSize: 15, fontWeight: '800', color: C.cream },

    qrScreen: { padding: 24, alignItems: 'center', paddingBottom: 40 },
    backRow:  { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', marginBottom: 20 },
    backText: { fontSize: 14, fontWeight: '700', color: C.clay },
    qrTitle:    { fontSize: 20, fontWeight: '900', color: C.espresso, marginBottom: 4 },
    qrSubtitle: { fontSize: 13, color: C.clay, marginBottom: 24 },
    qrBox: {
        backgroundColor: C.cream, borderRadius: radius.lg,
        borderWidth: 2, borderColor: C.vellum,
        padding: 24, marginBottom: 20,
        shadowColor: C.espresso, shadowOpacity: 0.08,
        shadowRadius: 12, shadowOffset: { width: 0, height: 4 },
        elevation: 4,
    },
    qrAmountBox: {
        backgroundColor: C.espresso, borderRadius: radius.md,
        paddingHorizontal: 32, paddingVertical: 14,
        alignItems: 'center', marginBottom: 16, width: '100%',
    },
    qrAmountLabel: { fontSize: 11, color: C.latte, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
    qrAmountValue: { fontSize: 28, fontWeight: '900', color: C.cream, marginTop: 4 },
    qrInstruction: {
        fontSize: 13, color: C.clay, textAlign: 'center',
        fontWeight: '500', lineHeight: 20,
    },

    splitHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
    splitTitle:  { fontSize: 16, fontWeight: '900', color: C.espresso },
    splitTotalBox: {
        backgroundColor: C.cream, borderRadius: radius.md,
        borderWidth: 1, borderColor: C.vellum,
        padding: 14, marginBottom: 14,
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    },
    splitTotalLabel: { fontSize: 13, color: C.clay, fontWeight: '600' },
    splitTotalValue: { fontSize: 18, fontWeight: '900', color: C.espresso },
    splitRow:        { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
    splitPersonLabel:{ fontSize: 12, fontWeight: '700', color: C.clay, width: 64 },
    splitInput: {
        flex: 1, borderWidth: 1.5, borderColor: C.vellum, borderRadius: radius.md,
        paddingHorizontal: 12, paddingVertical: 9,
        fontSize: 14, color: C.espresso, backgroundColor: C.cream,
    },
    splitRemove: {
        padding: 7, borderRadius: radius.xs,
        backgroundColor: C.tcLight, borderWidth: 1, borderColor: C.tcBorder,
    },
    splitRemainingRow: {
        flexDirection: 'row', justifyContent: 'space-between',
        borderTopWidth: 1, borderTopColor: C.vellum,
        paddingTop: 10, marginTop: 4, marginBottom: 14,
    },
    splitRemainingLabel: { fontSize: 13, fontWeight: '700', color: C.clay },
    splitRemainingValue: { fontSize: 14, fontWeight: '900', color: C.terracotta },
    addPersonBtn: {
        alignItems: 'center', paddingVertical: 10, borderRadius: radius.md,
        borderWidth: 1.5, borderColor: C.brassBorder,
        backgroundColor: C.brassLight, marginBottom: 14,
    },
    addPersonText: { fontSize: 13, fontWeight: '700', color: C.brass },
})
