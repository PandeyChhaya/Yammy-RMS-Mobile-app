import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'expo-router'
import { useVideoPlayer, VideoView } from 'expo-video'
import { Eye, Film, Store } from 'lucide-react-native'
import { useRef, useState } from 'react'
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import minisService from '../../minis/services/minis'
import type { Mini } from '../../minis/types/minis'
import { useRestaurant } from '../../shared/context/RestaurantContext'

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window')

const C = {
  espresso: '#1C1008', clay: '#7A4528', latte: '#C8956A',
  cream: '#FDF6EC', brass: '#B5822A', brassLight: '#F7EDD8', brassBorder: '#DEC07A',
}

function MiniItem({ item, isActive, onReserve, onMenu }: {
  item: Mini; isActive: boolean
  onReserve: () => void; onMenu: () => void
}) {
  const player = useVideoPlayer(item.video_url, p => {
    p.loop = true
    if (isActive) p.play()
  })

  return (
    <View style={styles.videoContainer}>
      <VideoView player={player} style={styles.video} contentFit="cover" nativeControls={false} />
      <View style={styles.overlay}>
        <View style={styles.topInfo}>
          <View style={styles.restaurantBadge}>
            <Store size={12} color={C.brass} />
            <Text style={styles.restaurantName}>{item.users?.user_name ?? 'Restaurant'}</Text>
          </View>
        </View>
        <View style={styles.bottomInfo}>
          <View style={styles.textInfo}>
            <Text style={styles.miniTitle}>{item.title}</Text>
            {item.description && <Text style={styles.miniDesc} numberOfLines={2}>{item.description}</Text>}
            <View style={styles.viewRow}>
              <Eye size={12} color={C.latte} />
              <Text style={styles.viewCount}>{item.view_count} views</Text>
            </View>
          </View>
          <View style={styles.actions}>
            <TouchableOpacity style={styles.actionBtn} onPress={onReserve}>
              <Text style={styles.actionBtnText}>Reserve</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionBtn, styles.actionBtnSecondary]} onPress={onMenu}>
              <Text style={[styles.actionBtnText, { color: C.brass }]}>Menu</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  )
}

export default function ViewMinis() {
  const router = useRouter()
  const { setSelectedRestaurantId } = useRestaurant()
  const [activeIndex, setActiveIndex] = useState(0)

  const { data: minis = [], isLoading } = useQuery<Mini[]>({
    queryKey: ['approved-minis'],
    queryFn: () => minisService.getApproved(),
  })

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      const index = viewableItems[0].index ?? 0
      setActiveIndex(index)
      minisService.incrementView(minis[index]?.mini_id)
    }
  }).current

  if (isLoading) return (
    <View style={styles.centered}>
      <ActivityIndicator size="large" color={C.brass} />
      <Text style={styles.loadingText}>Loading Minis…</Text>
    </View>
  )

  if (minis.length === 0) return (
    <View style={styles.centered}>
      <View style={styles.emptyIcon}><Film size={36} color={C.brass} /></View>
      <Text style={styles.emptyTitle}>No Minis Yet</Text>
      <Text style={styles.emptySubtitle}>Check back soon for food videos</Text>
    </View>
  )

  return (
    <View style={styles.container}>
      <FlatList
        data={minis}
        renderItem={({ item, index }) => (
          <MiniItem
            item={item}
            isActive={index === activeIndex}
            onReserve={() => { setSelectedRestaurantId(item.restaurant_id); router.push('/modules/customer/components/MakeReservation' as any) }}
            onMenu={() => { setSelectedRestaurantId(item.restaurant_id); router.push('/modules/customer/components/KioskOrder' as any) }}
          />
        )}
        keyExtractor={(item) => String(item.mini_id)}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        snapToInterval={SCREEN_HEIGHT}
        snapToAlignment="start"
        decelerationRate="fast"
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ itemVisiblePercentThreshold: 60 }}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, backgroundColor: C.cream },
  loadingText: { fontSize: 14, color: C.clay, fontWeight: '600' },
  emptyIcon: { width: 72, height: 72, borderRadius: 18, backgroundColor: C.brassLight, borderWidth: 1.5, borderColor: C.brassBorder, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: 17, fontWeight: '800', color: C.espresso },
  emptySubtitle: { fontSize: 13, color: C.clay },
  videoContainer: { width: SCREEN_WIDTH, height: SCREEN_HEIGHT },
  video: { width: SCREEN_WIDTH, height: SCREEN_HEIGHT, position: 'absolute' },
  overlay: { flex: 1, justifyContent: 'space-between', backgroundColor: 'rgba(0,0,0,0.25)' },
  topInfo: { paddingTop: 56, paddingHorizontal: 20 },
  restaurantBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(28,16,8,0.7)', alignSelf: 'flex-start', borderRadius: 100, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: C.brassBorder },
  restaurantName: { fontSize: 12, fontWeight: '700', color: C.cream },
  bottomInfo: { padding: 20, paddingBottom: 48, gap: 16 },
  textInfo: { gap: 6 },
  miniTitle: { fontSize: 18, fontWeight: '900', color: C.cream },
  miniDesc: { fontSize: 13, color: 'rgba(253,246,236,0.8)', lineHeight: 18 },
  viewRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  viewCount: { fontSize: 11, color: C.latte, fontWeight: '600' },
  actions: { flexDirection: 'row', gap: 10 },
  actionBtn: { flex: 1, backgroundColor: C.brass, borderRadius: 100, paddingVertical: 12, alignItems: 'center' },
  actionBtnSecondary: { backgroundColor: C.cream },
  actionBtnText: { fontSize: 14, fontWeight: '800', color: C.cream },
})