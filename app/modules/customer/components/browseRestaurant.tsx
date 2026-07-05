import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'expo-router'
import { ChevronRight, Store, Utensils } from 'lucide-react-native'
import {
    ActivityIndicator,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native'
import restaurantService, { Restaurant } from '../../restaurant/services/restaurantService'
import { useRestaurant } from '../../shared/context/RestaurantContext'
import { corner, palette } from '../../shared/theme'

export default function BrowseRestaurants() {
  const router = useRouter()
  const { setSelectedRestaurantId } = useRestaurant()

  const { data: restaurants = [], isLoading, error } = useQuery<Restaurant[]>({
    queryKey: ['active-restaurants'],
    queryFn: () => restaurantService.getActiveRestaurants(),
  })

  const handleSelect = (restaurant: Restaurant) => {
    setSelectedRestaurantId(restaurant.restaurant_id)
    router.replace('/modules/customer/customer_Dashboard')
  }

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <View style={styles.loadingIcon}>
          <Store size={26} color={palette.orange} />
        </View>
        <ActivityIndicator size="large" color={palette.orange} style={{ marginTop: 16 }} />
        <Text style={styles.loadingText}>Finding restaurants…</Text>
      </View>
    )
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorTitle}>Couldn't load restaurants</Text>
        <Text style={styles.errorSub}>{String(error)}</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.blob1} />
      <View style={styles.blob2} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.headerIcon}>
            <Utensils size={22} color={palette.white} />
          </View>
          <Text style={styles.title}>Choose a Restaurant</Text>
          <Text style={styles.subtitle}>Pick where you'd like to order from or reserve a table</Text>
        </View>

        {restaurants.length === 0 ? (
          <View style={styles.emptyState}>
            <Store size={40} color={palette.steel} />
            <Text style={styles.emptyTitle}>No restaurants yet</Text>
            <Text style={styles.emptySub}>Check back soon</Text>
          </View>
        ) : (
          <View style={styles.list}>
            {restaurants.map((restaurant) => (
              <TouchableOpacity
                key={restaurant.restaurant_id}
                style={styles.card}
                onPress={() => handleSelect(restaurant)}
                activeOpacity={0.85}
              >
                {restaurant.cover_image_url ? (
                  <Image source={{ uri: restaurant.cover_image_url }} style={styles.cardImage} />
                ) : (
                  <View style={styles.cardImageFallback}>
                    <Store size={26} color={palette.orange} />
                  </View>
                )}

                <View style={styles.cardBody}>
                  <Text style={styles.cardTitle} numberOfLines={1}>{restaurant.restaurant_name}</Text>
                  {restaurant.description ? (
                    <Text style={styles.cardDesc} numberOfLines={2}>{restaurant.description}</Text>
                  ) : null}
                  {restaurant.address ? (
                    <Text style={styles.cardAddress} numberOfLines={1}>{restaurant.address}</Text>
                  ) : null}
                </View>

                <ChevronRight size={18} color={palette.dim} />
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.black },
  content: { padding: 20, paddingTop: 56, paddingBottom: 40 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.black, gap: 12 },

  blob1: { position: 'absolute', top: -80, left: '20%', width: 260, height: 260, borderRadius: 130, backgroundColor: palette.orange, opacity: 0.08 },
  blob2: { position: 'absolute', top: -40, left: '45%', width: 180, height: 180, borderRadius: 90, backgroundColor: palette.orange, opacity: 0.12 },

  loadingIcon: { width: 56, height: 56, borderRadius: 14, backgroundColor: palette.orangeTint, borderWidth: 1.5, borderColor: palette.orangeDim, alignItems: 'center', justifyContent: 'center' },
  loadingText: { fontSize: 14, fontWeight: '700', color: palette.muted, marginTop: 8 },
  errorTitle: { fontSize: 16, fontWeight: '800', color: palette.error },
  errorSub: { fontSize: 12, color: palette.muted },

  header: { alignItems: 'center', marginBottom: 28, gap: 6 },
  headerIcon: { width: 56, height: 56, borderRadius: corner.lg, backgroundColor: palette.orange, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  title: { fontSize: 22, fontWeight: '900', color: palette.white, letterSpacing: 0.3 },
  subtitle: { fontSize: 13, color: palette.muted, textAlign: 'center', paddingHorizontal: 24 },

  emptyState: { alignItems: 'center', paddingVertical: 60, gap: 10 },
  emptyTitle: { fontSize: 16, fontWeight: '800', color: palette.white },
  emptySub: { fontSize: 13, color: palette.muted },

  list: { gap: 12 },
  card: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: palette.card, borderRadius: corner.md,
    borderWidth: 1.5, borderColor: palette.border, padding: 12,
  },
  cardImage: { width: 64, height: 64, borderRadius: corner.sm },
  cardImageFallback: {
    width: 64, height: 64, borderRadius: corner.sm,
    backgroundColor: palette.orangeTint, borderWidth: 1, borderColor: palette.orangeDim,
    alignItems: 'center', justifyContent: 'center',
  },
  cardBody: { flex: 1, gap: 3 },
  cardTitle: { fontSize: 15, fontWeight: '800', color: palette.white },
  cardDesc: { fontSize: 12, color: palette.muted, lineHeight: 16 },
  cardAddress: { fontSize: 11, color: palette.dim, marginTop: 2 },
})