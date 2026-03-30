import { useToggle } from '@/hooks/useToggle'
import { View, Button, Text, Modal } from 'react-native'

export default function ProductItem() {
    // [The value, The Flip Function]
    const [isModalOpen, toggleModal] = useToggle(false)
    const [isPasswordVisible, togglePassword] = useToggle(false)

    return (
        <View style={{ padding: 20 }}>
            <Button title="View Product Details" onPress={toggleModal} />

            <Modal visible={isModalOpen} animationType="slide">
                <View style={{ padding: 20 }}>
                    <Text>Product Details</Text>
                    <Button title="Close" onPress={toggleModal} />
                </View>
            </Modal>

            <View>
                <Text>Password</Text>
                <Button title={isPasswordVisible ? "Hide" : "Show"} onPress={togglePassword} />
                <Text>{isPasswordVisible ? "123456" : "********"}</Text>
            </View>
        </View>
    )
}