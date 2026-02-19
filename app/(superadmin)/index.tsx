import { View, Text } from 'react-native'
import { Link } from 'expo-router'
import LogoutButton
 from '@/components/LogoutButton'
const SuperAdminDashboard = () => {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>SuperAdminDashboard</Text>
      <Link href="/(cashier)">try cashier dashboard</Link>
      <Link href="/(manager)">try manager dashboard</Link>
      <LogoutButton />
    </View>
  )
}

export default SuperAdminDashboard