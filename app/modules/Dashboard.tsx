import { useRouter } from 'expo-router'
import {
  FileText,
  LayoutDashboard,
  Package,
  Receipt,
  Shield,
  ShoppingCart,
  Utensils,
  Video,
} from 'lucide-react-native'
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'

const C = {
  espresso:    '#1C1008',
  roast:       '#3D2010',
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
  onDark:      '#FDF6EC',
}

const radius = { xs: 6, sm: 10, md: 14, lg: 18, pill: 100 }

interface MenuItem {
  id: string
  label: string
  icon: React.ReactNode
  route: string
  badge?: string
}

export default function Dashboard() {
  const router = useRouter()

  const menuItems: MenuItem[] = [
 



    {
      id: 'pos',
      label: 'Point of Sale',
      icon: <ShoppingCart size={22} color={C.espresso} />,
      route: '/modules/pos/POS',
    },
    {
      id: 'orders',
      label: 'Orders',
      icon: <Receipt size={22} color={C.espresso} />,
      route: '/modules/orders/Orders',
    },

    
    {
      id: 'products',
      label: 'Products',
      icon: <Package size={22} color={C.espresso} />,
      route: '/modules/products/Products',
    },
    {
      id: 'categories',
      label: 'Categories',
      icon: <LayoutDashboard size={22} color={C.espresso} />,
      route: '/modules/categories/Categories',
    },

  
    {
      id: 'reports',
      label: 'Reports',
      icon: <FileText size={22} color={C.espresso} />,
      route: '/modules/reports/Reports',
    },
    {
      id: 'auditguard',
      label: 'Audit Logs',
      icon: <Shield size={22} color={C.espresso} />,
      route: '/modules/auditguard/AuditGuard',
    },


    {
      id: 'tiktok',
      label: 'Social Media',
      icon: <Video size={22} color={C.espresso} />,
      route: '/modules/tiktok/TikTok',
      badge: 'Beta',
    },
  ]

  const handleMenuPress = (route: string) => {
    router.push(route as any)
  }

  return (
    <View style={styles.root}>

   
      <View style={styles.profileSection}>
        <View style={styles.profileContent}>

          
          <View style={styles.profilePicture}>
            <Utensils size={32} color={C.cream} />
          </View>

          <View style={styles.userInfo}>
            <Text style={styles.userName}>Yammy Fresh</Text>
            <Text style={styles.userEmail}>yammy@restaurant.com</Text>
          </View>

          <View style={styles.ownerBadge}>
            <Text style={styles.ownerBadgeText}>Owner</Text>
          </View>
        </View>
      </View>

      
      <ScrollView style={styles.menuScroll} showsVerticalScrollIndicator={false}>
        <View style={styles.menuList}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.menuItem,
                index === menuItems.length - 1 && styles.menuItemLast,
              ]}
              onPress={() => handleMenuPress(item.route)}
              activeOpacity={0.75}
            >
              <View style={styles.menuItemIcon}>{item.icon}</View>
              <Text style={styles.menuItemText}>{item.label}</Text>
              {item.badge && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{item.badge}</Text>
                </View>
              )}
              <Text style={styles.menuItemArrow}>›</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.cream,
  },

  
  profileSection: {
    backgroundColor: C.espresso,
    paddingTop: 60,
    paddingBottom: 28,
    paddingHorizontal: 20,
    shadowColor: C.espresso,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  profileContent: {
    alignItems: 'center',
    gap: 10,
  },
  profilePicture: {
    width: 76,
    height: 76,
    borderRadius: radius.md,
    backgroundColor: C.brass,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
    borderWidth: 1.5,
    borderColor: C.brassBorder,
    shadowColor: C.brass,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  userInfo: {
    alignItems: 'center',
    gap: 4,
  },
  userName: {
    fontSize: 18,
    fontWeight: '900',
    color: C.cream,
    letterSpacing: 0.4,
  },
  userEmail: {
    fontSize: 13,
    color: C.latte,
    fontWeight: '500',
  },
  ownerBadge: {
    backgroundColor: C.brassLight,
    paddingHorizontal: 16,
    paddingVertical: 5,
    borderRadius: radius.pill,
    marginTop: 6,
    borderWidth: 1,
    borderColor: C.brassBorder,
  },
  ownerBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: C.brass,
    letterSpacing: 0.5,
  },

 
  menuScroll: {
    flex: 1,
  },
  menuList: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    gap: 2,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: C.vellum,
    gap: 4,
  },
  menuItemLast: {
    borderBottomWidth: 0,
  },
  menuItemIcon: {
    width: 38,
    height: 38,
    borderRadius: radius.sm,
    backgroundColor: C.brassLight,
    borderWidth: 1,
    borderColor: C.brassBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  menuItemText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: C.espresso,
    letterSpacing: 0.1,
  },
  menuItemArrow: {
    fontSize: 20,
    color: C.latte,
    fontWeight: '300',
  },
  badge: {
    backgroundColor: C.brassLight,
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: C.brassBorder,
    marginRight: 6,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: C.brass,
  },
})