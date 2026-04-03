import { useRouter } from 'expo-router'
import {
  Receipt
} from 'lucide-react-native'
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native'

interface MenuItem {
  id: string
  label: string
  icon: React.ReactNode
  route: string
}

export default function Dashboard() {
  const router = useRouter()

  const menuItems: MenuItem[] = [
   
     
    {
      id: 'orders',
      label: 'Orders',
      icon: <Receipt size={24} color="#1A1A1A" />,
      route: '/modules/orders/Orders',
    },
     {
      id: 'categories',
      label: 'Categories',
      icon: <Receipt size={24} color="#1A1A1A" />,
      route: '/modules/categories/Categories',
    },
     {
      id: 'login',
      label: 'Login',
      icon: <Receipt size={24} color="#1A1A1A" />,
      route: '/modules/auth/login',
    },
  
     
    
    


      
    
    
    
    
    
  ]

  const handleMenuPress = (route: string) => {
    router.push(route as any)
  }

  return (
    <View style={styles.root}>
      {/* Profile Section */}
      <View style={styles.profileSection}>
        <View style={styles.profileContent}>
          <View style={styles.profilePicture}>
            <Text style={styles.profileInitial}>Y</Text>
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

      {/* Menu Items */}
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
            >
              <View style={styles.menuItemIcon}>{item.icon}</View>
              <Text style={styles.menuItemText}>{item.label}</Text>
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
    backgroundColor: '#FEF1A8',
  },
  profileSection: {
    backgroundColor: '#2C2C2C',
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 20,
  },
  profileContent: {
    alignItems: 'center',
    gap: 12,
  },
  profilePicture: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#C41E1E',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  profileInitial: {
    fontSize: 36,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  userInfo: {
    alignItems: 'center',
    gap: 4,
  },
  userName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  userEmail: {
    fontSize: 14,
    color: '#D1D5DB',
  },
  ownerBadge: {
    backgroundColor: '#FEF1A8',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 8,
  },
  ownerBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  menuScroll: {
    flex: 1,
  },
  menuList: {
    paddingVertical: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E8D88A',
  },
  menuItemLast: {
    borderBottomWidth: 0,
  },
  menuItemIcon: {
    marginRight: 16,
  },
  menuItemText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1A1A1A',
  },
})