import { X } from 'lucide-react-native'
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { WebView, WebViewNavigation } from 'react-native-webview'

const SUCCESS_PATH = '/api/payment/esewa/callback/success'
const FAILURE_PATH = '/api/payment/esewa/callback/failure'

interface Props {
    paymentUrl: string
    onSuccess: () => void
    onFailure: () => void
    onClose: () => void
}

export default function EsewaWebView({ paymentUrl, onSuccess, onFailure, onClose }: Props) {
    const handleNavChange = (navState: WebViewNavigation) => {
        if (navState.url.includes(SUCCESS_PATH)) {
            onSuccess()
        } else if (navState.url.includes(FAILURE_PATH)) {
            onFailure()
        }
    }

    return (
        <View style={s.container}>
            <View style={s.header}>
                <Text style={s.title}>eSewa Checkout</Text>
                <TouchableOpacity onPress={onClose} style={s.closeBtn}>
                    <X size={18} color="#FFFFFF" />
                </TouchableOpacity>
            </View>

            <WebView
                source={{ uri: paymentUrl }}
                onNavigationStateChange={handleNavChange}
                startInLoadingState
                renderLoading={() => (
                    <View style={s.loading}>
                        <ActivityIndicator size="large" color="#FF6B2C" />
                    </View>
                )}
            />
        </View>
    )
}

const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0A0A0A' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#2C2C2C',
    },
    title: { fontSize: 16, fontWeight: '800', color: '#FFFFFF' },
    closeBtn: { padding: 6, borderRadius: 8, backgroundColor: '#1A1A1A' },
    loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
})