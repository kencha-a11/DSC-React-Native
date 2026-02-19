import { View, Text } from 'react-native'
import { Link } from 'expo-router'
import React from 'react'
import LogoutButton from '@/components/LogoutButton'

const ManagerDashboard = () => {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>ManagerDashboard</Text>
      <Link href="/(cashier)">try cashier dashboard</Link>
      <Link href="/(superadmin)">try superadmin dashboard</Link>
      <LogoutButton />
    </View>
  )
}

export default ManagerDashboard