import { AVPlaybackStatus, ResizeMode, Video } from 'expo-av'
import { StatusBar } from 'expo-status-bar'
import { useCallback, useRef, useState } from 'react'
import {
    Dimensions,
    FlatList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    ViewToken,
} from 'react-native'

const { height, width } = Dimensions.get('window')

const VIDEO_MENU = [
  {
    id: '1',
    title: 'Momo Platter',
    description: 'Steamed dumplings with spicy sauce',
    price: 'NPR 250',
    category: 'Starters',
    uri: 'https://your-cloudinary-url/momo.mp4',
  },
  {
    id: '2',
    title: 'Chicken Chowmein',
    description: 'Stir fried noodles with vegetables',
    price: 'NPR 300',
    category: 'Main Course',
    uri: 'https://your-cloudinary-url/chowmein.mp4',
  },
  {
    id: '3',
    title: 'Masala Tea',
    description: 'Spiced milk tea',
    price: 'NPR 80',
    category: 'Drinks',
    uri: 'https://your-cloudinary-url/tea.mp4',
  },
]

// ── Single video item ──
function VideoItem({
  item,
  isActive,
}: {
  item: typeof VIDEO_MENU[0]
  isActive: boolean
}) {
  const videoRef = useRef<Video>(null)

  // Play or pause based on visibility
  const handlePlaybackStatus = (status: AVPlaybackStatus) => {}

  return (
    <View style={styles.videoContainer}>

      {/* Video */}
      <Video
        ref={videoRef}
        source={{ uri: item.uri }}
        style={styles.video}
        resizeMode={ResizeMode.COVER}
        isLooping
        shouldPlay={isActive}
        isMuted={false}
      />

      {/* Dark overlay at bottom */}
      <View style={styles.overlay} />

      {/* Food info */}
      <View style={styles.infoContainer}>

        <View style={styles.categoryBadge}>
          <Text style={styles.categoryText}>{item.category}</Text>
        </View>

        <Text style={styles.foodTitle}>{item.title}</Text>
        <Text style={styles.foodDescription}>{item.description}</Text>
        <Text style={styles.foodPrice}>{item.price}</Text>

        {/* Order button */}
        <TouchableOpacity
          style={styles.orderButton}
          onPress={() => {
            // connect to your orders logic here
            console.log('Order:', item.title)
          }}
        >
          <Text style={styles.orderButtonText}>Add to Order</Text>
        </TouchableOpacity>

      </View>

      {/* Scroll hint on first video */}
      <View style={styles.scrollHint}>
        <Text style={styles.scrollHintText}>↑ Swipe up for more</Text>
      </View>

    </View>
  )
}

// ── Main screen ──
export default function VideoMenu() {
  const [activeIndex, setActiveIndex] = useState(0)

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0) {
        setActiveIndex(viewableItems[0].index ?? 0)
      }
    },
    []
  )

  const viewabilityConfig = {
    itemVisiblePercentThreshold: 60,
  }

  return (
    <View style={styles.root}>
      <StatusBar style="light" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerText}>Video Menu</Text>
      </View>

      {/* TikTok style feed */}
      <FlatList
        data={VIDEO_MENU}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <VideoItem
            item={item}
            isActive={index === activeIndex}
          />
        )}
        pagingEnabled                          // snaps to each video
        showsVerticalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        getItemLayout={(_, index) => ({
          length: height,
          offset: height * index,
          index,
        })}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    position: 'absolute',
    top: 52,
    left: 0,
    right: 0,
    zIndex: 10,
    alignItems: 'center',
  },
  headerText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    fontFamily: 'Inter-Bold',
  },

  // Video
  videoContainer: {
    width,
    height,
  },
  video: {
    width,
    height,
    position: 'absolute',
  },
  overlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
    backgroundColor: 'rgba(0,0,0,0.45)',
  },

  // Info
  infoContainer: {
    position: 'absolute',
    bottom: 80,
    left: 20,
    right: 20,
  },
  categoryBadge: {
    backgroundColor: '#C41E1E',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    marginBottom: 8,
  },
  categoryText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  foodTitle: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '800',
    fontFamily: 'Inter-Bold',
    marginBottom: 6,
  },
  foodDescription: {
    color: '#E0E0E0',
    fontSize: 14,
    fontFamily: 'Inter',
    marginBottom: 8,
  },
  foodPrice: {
    color: '#D4A843',
    fontSize: 22,
    fontWeight: '700',
    fontFamily: 'Inter-Bold',
    marginBottom: 16,
  },
  orderButton: {
    backgroundColor: '#C41E1E',
    paddingVertical: 14,
    borderRadius: 25,
    alignItems: 'center',
  },
  orderButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'Inter-Bold',
  },

  // Scroll hint
  scrollHint: {
    position: 'absolute',
    bottom: 30,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  scrollHintText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    fontFamily: 'Inter',
  },
})