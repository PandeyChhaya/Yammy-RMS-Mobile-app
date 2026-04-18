import { Bot, MessageCircle, Send, User } from 'lucide-react-native'
import React, { useRef, useState } from 'react'
import {
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native'

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
  amber:       '#C47A1E',
  amberLight:  '#FEF3E2',
  violet:      '#6D3FA0',
  violetLight: '#F3EDFB',
  terracotta:  '#A03020',
}

const radius = { xs: 6, sm: 10, md: 14, pill: 100 }

interface ChatMessage {
  id: string
  type: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface ChatSectionProps {
  compact?: boolean
}

export default function ChatSection({ compact = false }: ChatSectionProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      type: 'assistant',
      content: 'Hello! I am your POS assistant. How can I help you today?',
      timestamp: new Date(),
    },
    {
      id: '2',
      type: 'assistant',
      content: '💡 **Quick instructions:**\n• Click on a product to add it to cart\n• Use "Direct sale" for takeout orders\n• Select a table for dine-in orders',
      timestamp: new Date(),
    },
  ])
  const [inputValue, setInputValue] = useState('')
  const scrollViewRef = useRef<ScrollView>(null)

  const handleSendMessage = () => {
    if (!inputValue.trim()) return

    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, newMessage])
    setInputValue('')

    // Simulate assistant response
    setTimeout(() => {
      const assistantResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: 'I understand your request. Let me help you with that...',
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, assistantResponse])
    }, 1000)
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      {/* Header */}
      <View style={[styles.header, compact && styles.headerCompact]}>
        <MessageCircle size={compact ? 16 : 20} color={C.cream} />
        <Text style={[styles.headerTitle, compact && styles.textSm]}>POS Assistant</Text>
      </View>

      {/* Messages */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.messageList}
        contentContainerStyle={[styles.messageContent, compact && styles.paddingCompact]}
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
      >
        {messages.map((message) => {
          const isUser = message.type === 'user'
          return (
            <View
              key={message.id}
              style={[styles.messageRow, isUser ? styles.rowUser : styles.rowAssistant]}
            >
              <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAssistant]}>
                <View style={styles.bubbleHeader}>
                  {isUser ? (
                    <User size={12} color={C.latte} style={styles.icon} />
                  ) : (
                    <Bot size={12} color={C.violet} style={styles.icon} />
                  )}
                  <View style={styles.textContainer}>
                    <Text style={[styles.messageText, isUser ? styles.textUser : styles.textAssistant, compact && styles.textSm]}>
                      {message.content}
                    </Text>
                    <Text style={[styles.timestamp, isUser ? styles.timeUser : styles.timeAssistant]}>
                      {message.timestamp.toLocaleTimeString('fr-FR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          )
        })}
      </ScrollView>

      {/* Input Area */}
      <View style={[styles.inputWrapper, compact && styles.paddingCompact]}>
        <View style={styles.inputContainer}>
          <TextInput
            style={[styles.input, compact && styles.textSm]}
            value={inputValue}
            onChangeText={setInputValue}
            placeholder="Posez votre question..."
            placeholderTextColor={C.latte}
            multiline={false}
          />
          <TouchableOpacity
            onPress={handleSendMessage}
            disabled={!inputValue.trim()}
            style={[styles.sendButton, !inputValue.trim() && styles.disabled]}
          >
            <Send size={16} color={C.cream} />
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.parchment,
  },
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.violet,
    paddingVertical: 14,
    gap: 8,
  },
  headerCompact: {
    paddingVertical: 8,
  },
  headerTitle: {
    color: C.cream,
    fontWeight: '800',
    fontSize: 15,
    letterSpacing: 0.5,
  },
  // Message List
  messageList: {
    flex: 1,
  },
  messageContent: {
    padding: 16,
    gap: 12,
  },
  paddingCompact: {
    padding: 10,
  },
  // Bubbles
  messageRow: {
    flexDirection: 'row',
    width: '100%',
  },
  rowUser: {
    justifyContent: 'flex-end',
  },
  rowAssistant: {
    justifyContent: 'flex-start',
  },
  bubble: {
    maxWidth: '85%',
    padding: 12,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  bubbleUser: {
    backgroundColor: C.espresso,
    borderColor: C.espresso,
    borderBottomRightRadius: 2,
  },
  bubbleAssistant: {
    backgroundColor: C.cream,
    borderColor: C.vellum,
    borderBottomLeftRadius: 2,
  },
  bubbleHeader: {
    flexDirection: 'row',
    gap: 8,
  },
  icon: {
    marginTop: 2,
  },
  textContainer: {
    flex: 1,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  textUser: {
    color: C.parchment,
  },
  textAssistant: {
    color: C.espresso,
  },
  timestamp: {
    fontSize: 10,
    marginTop: 4,
    fontWeight: '600',
  },
  timeUser: {
    color: C.latte,
    textAlign: 'right',
  },
  timeAssistant: {
    color: C.latte,
  },
  // Input
  inputWrapper: {
    padding: 14,
    backgroundColor: C.parchment,
    borderTopWidth: 1.5,
    borderTopColor: C.vellum,
  },
  inputContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: C.cream,
    borderWidth: 1.5,
    borderColor: C.vellum,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: C.espresso,
    fontSize: 14,
  },
  sendButton: {
    backgroundColor: C.violet,
    width: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
  },
  textSm: {
    fontSize: 13,
  },
  disabled: {
    opacity: 0.5,
  },
})